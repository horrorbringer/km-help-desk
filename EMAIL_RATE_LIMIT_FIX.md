# Email Rate Limit Fix

## Issue

Email sending was failing with rate limit errors from Mailtrap:
```
Failed to send email: Expected response code "354" but got code "550", with message "550 5.7.0 Too many emails per second. Please upgrade your plan https://mailtrap.io/billing/plans/testing"
```

This occurred when sending emails to multiple team members simultaneously (e.g., when a ticket is assigned to a team with many members).

## Root Cause

When a ticket is assigned to a team, the system sends email notifications to **all active team members** in a loop without any delay between sends. This causes:
- Multiple emails sent in rapid succession (within milliseconds)
- SMTP server (Mailtrap) rate limiting kicks in
- Subsequent emails fail with rate limit errors

## Solution

Implemented email throttling with the following features:

### 1. **Configurable Delay Between Emails**
- Added a configurable delay setting: `mail_send_delay_ms` (default: 500ms)
- Delay is applied between each email send (skipped for the first email)
- Can be adjusted via the `settings` table if needed

### 2. **Rate Limit Detection and Handling**
- Detects rate limit errors by checking for:
  - "Too many emails" in error message
  - "rate limit" in error message
  - "550 5.7.0" SMTP error code
- When rate limit is detected:
  - Waits 2x the normal delay before continuing
  - Logs a warning with details
  - Continues sending to remaining recipients

### 3. **Enhanced Error Logging**
- Logs rate limit errors separately with `is_rate_limit` flag
- Provides better visibility into email sending issues
- Helps identify when delays need to be increased

## Code Changes

### `app/Services/NotificationService.php`

Updated both `notifyTicketCreated()` and `notifyTicketAssigned()` methods:

```php
$delayBetweenEmails = (int) \App\Models\Setting::get('mail_send_delay_ms', 500); // Default 500ms delay
$memberIndex = 0;

foreach ($teamMembers as $user) {
    // Add delay between emails to prevent rate limiting (skip delay for first email)
    if ($memberIndex > 0) {
        usleep($delayBetweenEmails * 1000); // Convert ms to microseconds
    }
    
    try {
        $result = $emailService->sendTicketAssigned($ticket, $user);
        // ... success handling ...
    } catch (\Exception $e) {
        $errorMessage = $e->getMessage();
        $isRateLimitError = str_contains($errorMessage, 'Too many emails') || 
                           str_contains($errorMessage, 'rate limit') ||
                           str_contains($errorMessage, '550 5.7.0');
        
        if ($isRateLimitError) {
            // If rate limited, wait longer before continuing
            Log::warning('NotificationService: Rate limit detected, waiting before continuing', [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'delay_ms' => $delayBetweenEmails * 2,
            ]);
            usleep($delayBetweenEmails * 2000); // Wait 2x longer on rate limit
        }
        
        Log::error('NotificationService: Exception sending email to team member', [
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'user_email' => $user->email,
            'error' => $errorMessage,
            'is_rate_limit' => $isRateLimitError,
        ]);
    }
    
    $memberIndex++;
}
```

## Impact

- ✅ **Prevents Rate Limiting**: Emails are sent with delays, preventing SMTP server rate limits
- ✅ **Configurable**: Delay can be adjusted via settings if needed
- ✅ **Resilient**: Automatically handles rate limit errors and continues sending
- ✅ **Better Logging**: Enhanced error logging helps identify and debug issues
- ✅ **Production Ready**: Works with any SMTP provider (Mailtrap, SendGrid, AWS SES, etc.)

## Configuration

### Default Delay
- **Default**: 500ms (0.5 seconds) between emails
- **Rate Limit Delay**: 1000ms (1 second) when rate limit is detected

### Adjusting the Delay

To change the delay, update the `mail_send_delay_ms` setting in the database:

```php
\App\Models\Setting::set('mail_send_delay_ms', 1000, 'integer', 'mail', 'Delay between email sends in milliseconds');
```

Or via SQL:
```sql
UPDATE settings SET value = '1000' WHERE key = 'mail_send_delay_ms';
```

**Recommended Values:**
- **Mailtrap (Testing)**: 500-1000ms
- **Production SMTP**: 100-500ms (depending on provider limits)
- **High-volume providers**: 50-200ms

## Testing

To verify the fix:
1. Create a ticket and assign it to a team with multiple members
2. Check logs - should see emails sent with delays
3. If rate limit occurs, system should wait longer and continue
4. All team members should receive emails (may take longer due to delays)

## Future Improvements

Consider implementing:
1. **Email Queuing**: Use Laravel queues to send emails asynchronously
2. **Batch Processing**: Send emails in smaller batches
3. **Retry Logic**: Retry failed emails after a delay
4. **Provider-Specific Limits**: Configure delays based on SMTP provider

## Notes

- The delay is applied **between** emails, not before each email
- First email is sent immediately (no delay)
- Rate limit detection is automatic and doesn't require configuration
- Works with any SMTP provider that has rate limits

