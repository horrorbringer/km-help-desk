# Outlook/Microsoft 365 Email Configuration Guide

This guide explains how to configure the Kimmex Help Desk System to send emails through Outlook/Microsoft 365.

## Configuration Options

### Option 1: Microsoft 365 SMTP (Recommended)

This is the standard SMTP configuration for Microsoft 365/Outlook.com accounts.

#### Step 1: Update your `.env` file

Add or update the following environment variables:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USERNAME=your-email@yourdomain.com
MAIL_PASSWORD=your-app-password-or-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@yourdomain.com
MAIL_FROM_NAME="Kimmex Help Desk"
```

#### Step 2: Enable SMTP Authentication

For Microsoft 365, you need to:

1. **Use App Password (Recommended for Security)**
   - Go to https://account.microsoft.com/security
   - Enable two-factor authentication (if not already enabled)
   - Generate an "App Password" for this application
   - Use this app password in `MAIL_PASSWORD`

2. **Or Use Regular Password (Less Secure)**
   - Use your regular Microsoft 365 password
   - Note: This may require enabling "Less secure app access" which is not recommended

#### Step 3: Update mail.php configuration

The default `config/mail.php` already supports SMTP. You may need to add encryption settings:

```php
'smtp' => [
    'transport' => 'smtp',
    'host' => env('MAIL_HOST', 'smtp.office365.com'),
    'port' => env('MAIL_PORT', 587),
    'encryption' => env('MAIL_ENCRYPTION', 'tls'),
    'username' => env('MAIL_USERNAME'),
    'password' => env('MAIL_PASSWORD'),
    'timeout' => null,
    'local_domain' => env('MAIL_EHLO_DOMAIN'),
],
```

### Option 2: Outlook.com Personal Account

For personal Outlook.com accounts:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=your-email@outlook.com
MAIL_FROM_NAME="Kimmex Help Desk"
```

### Option 3: Microsoft 365 with OAuth2 (Advanced)

For enterprise environments, you can use OAuth2 authentication instead of passwords. This requires additional setup with Microsoft Graph API.

## SMTP Settings Summary

### Microsoft 365 / Office 365
- **Host:** `smtp.office365.com`
- **Port:** `587` (TLS) or `465` (SSL)
- **Encryption:** `tls` (for port 587) or `ssl` (for port 465)
- **Authentication:** Required
- **Username:** Your full email address
- **Password:** App Password (recommended) or account password

### Outlook.com (Personal)
- **Host:** `smtp-mail.outlook.com`
- **Port:** `587`
- **Encryption:** `tls`
- **Authentication:** Required

## Testing Email Configuration

### Method 1: Using Laravel Tinker

```bash
php artisan tinker
```

Then run:

```php
Mail::raw('Test email from Kimmex Help Desk', function ($message) {
    $message->to('test@example.com')
            ->subject('Test Email');
});
```

### Method 2: Create a Test Route

Create a temporary test route in `routes/web.php`:

```php
Route::get('/test-email', function () {
    try {
        Mail::raw('This is a test email from Kimmex Help Desk', function ($message) {
            $message->to('your-email@example.com')
                    ->subject('Test Email from Kimmex');
        });
        return 'Email sent successfully!';
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage();
    }
})->middleware('auth');
```

### Method 3: Test via Ticket Creation

1. Create a test ticket in the system
2. Check if the email notification is sent to the requester
3. Check application logs: `storage/logs/laravel.log`

## Troubleshooting

### Common Issues

1. **"Connection timeout" or "Could not connect to host"**
   - Check firewall settings
   - Verify SMTP host and port are correct
   - Ensure your server can reach `smtp.office365.com` on port 587

2. **"Authentication failed"**
   - Verify username is the full email address
   - For Microsoft 365, use an App Password instead of regular password
   - Check if two-factor authentication is enabled (requires App Password)

3. **"Relay access denied"**
   - Your account may not have permission to send emails
   - Contact your IT administrator

4. **"SSL/TLS connection error"**
   - Verify `MAIL_ENCRYPTION=tls` for port 587
   - Or use `MAIL_ENCRYPTION=ssl` with port 465

### Enable Debugging

Add to your `.env`:

```env
MAIL_LOG_CHANNEL=daily
```

Then check logs in `storage/logs/` for detailed error messages.

## Security Best Practices

1. **Use App Passwords**: Never use your main account password. Generate an App Password specifically for this application.

2. **Environment Variables**: Never commit `.env` file to version control. Keep credentials secure.

3. **TLS Encryption**: Always use TLS (port 587) or SSL (port 465) for encrypted connections.

4. **Restrict Access**: Limit which email addresses can send emails from your application.

## Configuration in Application Settings

The application also supports configuring email settings through the admin panel:

1. Navigate to **Admin → Settings**
2. Find the **Mail Configuration** section
3. Update:
   - `mail_enabled`: Enable/disable email notifications
   - `mail_from_address`: Default sender email
   - `mail_from_name`: Default sender name

Note: SMTP credentials must still be configured in `.env` file for security.

## Example .env Configuration

```env
# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=smtp.office365.com
MAIL_PORT=587
MAIL_USERNAME=support@kimmix.com
MAIL_PASSWORD=your-app-password-here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=support@kimmix.com
MAIL_FROM_NAME="Kimmex Help Desk System"
```

## After Configuration

1. Clear configuration cache:
   ```bash
   php artisan config:clear
   ```

2. Test email sending using one of the methods above

3. Monitor logs for any errors:
   ```bash
   tail -f storage/logs/laravel.log
   ```

## Additional Resources

- [Microsoft 365 SMTP Settings](https://docs.microsoft.com/en-us/exchange/mail-flow-best-practices/how-to-set-up-a-multifunction-device-or-application-to-send-email-using-microsoft-365-or-office-365)
- [Laravel Mail Documentation](https://laravel.com/docs/mail)
- [Create App Password for Microsoft Account](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed5b-4263-681f-dea8-7e3fe4c6ac3a)

