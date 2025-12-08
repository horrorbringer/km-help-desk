# Email From Address Fix

## Issue

Email sending was failing with the error:
```
Failed to send email: Email "" does not comply with addr-spec of RFC 2822.
```

The error occurred at `EmailService.php:46` when trying to set the "from" address with an empty email string.

## Root Cause

The `EmailService` was retrieving the `mail_from_address` from the database settings using `Setting::get('mail_from_address', config('mail.from.address'))`. However, if a `mail_from_address` setting exists in the database with an empty value (`''`), the `Setting::get()` method returns that empty string instead of falling back to the config default.

This happened because:
1. `Setting::get()` checks if a setting exists in the database
2. If it exists (even with an empty value), it returns that value
3. The fallback (`config('mail.from.address')`) is only used if the setting doesn't exist at all

## Solution

Updated `app/Services/EmailService.php` to validate the from address before using it:

1. **Validation Check**: After retrieving `mail_from_address` from settings, check if it's empty or not a valid email address
2. **Fallback Logic**: If invalid or empty, use `config('mail.from.address')` as fallback
3. **Name Validation**: Also validate `mail_from_name` and fall back to config if empty
4. **Logging**: Log a warning when falling back to config so administrators know their settings need attention

## Code Changes

```php
$fromAddress = \App\Models\Setting::get('mail_from_address', config('mail.from.address'));
$fromName = \App\Models\Setting::get('mail_from_name', config('mail.from.name'));

// Validate and fallback to config if setting is empty
if (empty($fromAddress) || !filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
    $fromAddress = config('mail.from.address');
    Log::warning("Invalid or empty mail_from_address setting, using config fallback", [
        'setting_value' => \App\Models\Setting::get('mail_from_address'),
        'fallback_value' => $fromAddress,
    ]);
}

if (empty($fromName)) {
    $fromName = config('mail.from.name');
}
```

## Impact

- ✅ Emails will now send successfully even if `mail_from_address` setting is empty
- ✅ System falls back to `config('mail.from.address')` (from `.env` or `config/mail.php`)
- ✅ Administrators are warned via logs if their settings are invalid
- ✅ All email notifications (ticket created, assigned, updated, etc.) will work correctly

## Next Steps

1. **Check Settings**: Review the `settings` table and ensure `mail_from_address` has a valid email address
2. **Update Settings**: If empty, update it via the admin panel or directly in the database
3. **Verify Config**: Ensure `.env` has `MAIL_FROM_ADDRESS` set, or `config/mail.php` has a valid default

## Testing

To verify the fix:
1. Create a new ticket
2. Check logs - should see successful email sending or warnings about invalid settings
3. Verify emails are received with correct "from" address

