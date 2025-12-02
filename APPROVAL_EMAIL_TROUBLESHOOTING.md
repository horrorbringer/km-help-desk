# Approval Email Troubleshooting Guide

## Issue: Emails Not Received During Approval Workflow Testing

### Status
✅ **Emails ARE being sent** - Logs confirm successful email delivery

### Verification Steps

1. **Check Laravel Logs**
   ```bash
   tail -f storage/logs/laravel.log | grep -i "email\|approval"
   ```
   
   Look for:
   - `Email sent successfully` - Email was sent
   - `Failed to send email` - Email failed (check error message)
   - `No active email template found` - Template missing or inactive

2. **Verify Email Templates Exist**
   ```bash
   php artisan tinker
   >>> App\Models\EmailTemplate::where('event_type', 'like', 'approval_%')->count();
   ```
   Should return: `6`

3. **Verify Templates Are Active**
   ```bash
   php artisan tinker
   >>> App\Models\EmailTemplate::where('event_type', 'like', 'approval_%')->where('is_active', true)->count();
   ```
   Should return: `6`

4. **Check Mail Settings**
   ```bash
   php artisan tinker
   >>> \App\Models\Setting::get('mail_enabled', true);
   ```
   Should return: `true` or `1`

### Common Issues & Solutions

#### Issue 1: Emails in Spam Folder
**Solution**: 
- Check spam/junk folder
- Add sender email to contacts
- Verify `MAIL_FROM_ADDRESS` in `.env` matches your domain

#### Issue 2: Wrong Email Addresses
**Solution**: 
- Verify user email addresses in database:
  ```sql
  SELECT id, name, email FROM users WHERE email LIKE '%@%';
  ```
- Ensure test users have correct email addresses

#### Issue 3: SMTP Configuration
**Solution**: 
- Verify `.env` settings match your email provider
- For Outlook/Microsoft 365, see `OUTLOOK_EMAIL_CONFIGURATION.md`
- Test with the test route: `/test-email`

#### Issue 4: Email Template Variables Not Replaced
**Solution**: 
- Check template variables match data being passed
- Verify template uses `{{{variable}}}` format (triple braces)
- Check logs for template rendering errors

### Testing Email Sending

#### Method 1: Test Route (Direct)
```
GET /test-email
```
This uses `Mail::raw()` directly and bypasses templates.

#### Method 2: Test Approval Email (With Template)
```php
php artisan tinker
>>> $ticket = App\Models\Ticket::first();
>>> $approver = App\Models\User::where('email', 'vannysmilekh@gmail.com')->first();
>>> app(App\Services\EmailService::class)->sendApprovalRequested($ticket, $approver, 'lm');
```

#### Method 3: Check Logs
```bash
tail -f storage/logs/laravel.log
```
Then trigger an approval workflow and watch for email logs.

### Email Flow

1. **Approval Requested**:
   - `ApprovalWorkflowService::initializeWorkflow()` 
   - → `NotificationService::notifyApprovalRequested()`
   - → `EmailService::sendApprovalRequested()`
   - → `EmailService::sendTemplate('approval_lm_requested' or 'approval_hod_requested')`

2. **Approval Approved**:
   - `ApprovalWorkflowService::approve()`
   - → `NotificationService::notifyApprovalApproved()`
   - → `EmailService::sendApprovalApproved()`
   - → `EmailService::sendTemplate('approval_lm_approved' or 'approval_hod_approved')`

3. **Approval Rejected**:
   - `ApprovalWorkflowService::reject()`
   - → `NotificationService::notifyApprovalRejected()`
   - → `EmailService::sendApprovalRejected()`
   - → `EmailService::sendTemplate('approval_lm_rejected' or 'approval_hod_rejected')`

### Debugging Steps

1. **Enable Detailed Logging**
   - Already enabled in `EmailService.php`
   - Check `storage/logs/laravel.log` for:
     - `Sending approval requested email`
     - `Email sent successfully`
     - `Failed to send email` (with error details)

2. **Verify Email Configuration**
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

3. **Test SMTP Connection**
   ```bash
   php artisan tinker
   >>> Mail::raw('Test', function($m) { $m->to('your-email@example.com')->subject('Test'); });
   ```

4. **Check Email Queue** (if using queue)
   ```bash
   php artisan queue:work
   ```

### Expected Log Output

When approval workflow triggers, you should see:
```
[INFO] Sending approval requested email {"event_type":"approval_lm_requested","ticket_id":X,"approver_email":"..."}
[INFO] Email sent successfully {"event_type":"approval_lm_requested","recipient":"...","ticket_id":X}
```

If you see errors:
```
[ERROR] Failed to send email: [error message] {"event_type":"...","recipient":"...","ticket_id":X}
```

### Real User Email Addresses

From `UserSeeder.php`:
- **Chanthou**: `chanthou121@outlook.com` (Requester)
- **Vannak**: `fnak98755@gmail.com` (Line Manager)
- **Sokuntha**: `sokuntha@kimmix.com` (HOD)
- **Dongdong**: `dongdongmi72@gmail.com` (Requester)
- **Sokun**: `sokun12442@outlook.com` (Requester)

### Next Steps

1. ✅ Check spam folders for all test users
2. ✅ Verify email addresses are correct in database
3. ✅ Check Laravel logs for email sending confirmations
4. ✅ Test with `/test-email` route to verify SMTP works
5. ✅ Review email template content for variable issues

### Notes

- The test route (`/test-email`) works because it uses `Mail::raw()` directly
- Approval workflow emails use templates, which adds an extra layer
- All email sending is logged - check logs to confirm emails are being sent
- If logs show "Email sent successfully" but emails aren't received, check spam folders and email addresses

