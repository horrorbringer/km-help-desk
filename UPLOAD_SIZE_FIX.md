# Fix 413 Request Entity Too Large Error

The 413 error occurs when the web server (nginx/Apache) rejects file uploads before they reach Laravel. You need to increase the upload limits in multiple places.

## Current Laravel Limits
- **Per file**: 10MB (10240 KB)
- **Max files**: 10 files per upload

## Server Configuration Fixes

### 1. Nginx Configuration

Edit your nginx configuration file (usually `/etc/nginx/sites-available/your-site` or `/etc/nginx/nginx.conf`):

```nginx
server {
    # ... other configuration ...
    
    # Increase client body size limit (for file uploads)
    client_max_body_size 100M;  # Allow up to 100MB total upload
    
    # Optional: Increase timeouts for large uploads
    client_body_timeout 300s;
    client_header_timeout 300s;
    
    # ... rest of configuration ...
}
```

**After editing, restart nginx:**
```bash
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### 2. Apache Configuration

If using Apache, edit your virtual host configuration or `.htaccess`:

**Option A: In Virtual Host Configuration**
```apache
<VirtualHost *:80>
    # ... other configuration ...
    
    # Increase request body size limit
    LimitRequestBody 104857600  # 100MB in bytes
    
    # ... rest of configuration ...
</VirtualHost>
```

**Option B: In .htaccess (in public directory)**
```apache
# Increase upload size limit
php_value upload_max_filesize 50M
php_value post_max_size 100M
php_value max_execution_time 300
php_value max_input_time 300
```

**After editing, restart Apache:**
```bash
sudo apache2ctl configtest  # Test configuration
sudo systemctl restart apache2
```

### 3. PHP Configuration

Edit your PHP configuration file (usually `/etc/php/8.2/fpm/php.ini` or `/etc/php/8.2/apache2/php.ini`):

```ini
; Maximum allowed size for uploaded files
upload_max_filesize = 50M

; Maximum size of POST data
post_max_size = 100M

; Maximum number of files that can be uploaded
max_file_uploads = 20

; Maximum execution time (for large uploads)
max_execution_time = 300

; Maximum input time
max_input_time = 300

; Memory limit (should be higher than post_max_size)
memory_limit = 256M
```

**After editing, restart PHP-FPM:**
```bash
sudo systemctl restart php8.2-fpm
# or
sudo systemctl restart php-fpm
```

### 4. Verify PHP Settings

You can check current PHP settings by creating a temporary PHP file:

```php
<?php
phpinfo();
```

Look for:
- `upload_max_filesize`
- `post_max_size`
- `max_file_uploads`

Or run from command line:
```bash
php -i | grep -E "upload_max_filesize|post_max_size|max_file_uploads"
```

## Recommended Settings Summary

For a ticket system allowing up to 10 files of 10MB each (100MB total):

| Setting | Recommended Value | Location |
|---------|------------------|----------|
| `client_max_body_size` (nginx) | 100M | nginx config |
| `LimitRequestBody` (Apache) | 104857600 | Apache config |
| `upload_max_filesize` (PHP) | 50M | php.ini |
| `post_max_size` (PHP) | 100M | php.ini |
| `max_file_uploads` (PHP) | 20 | php.ini |
| `memory_limit` (PHP) | 256M | php.ini |

## Testing

After making changes:

1. **Restart services:**
   ```bash
   # Nginx
   sudo systemctl restart nginx
   
   # PHP-FPM
   sudo systemctl restart php8.2-fpm
   
   # Apache (if using)
   sudo systemctl restart apache2
   ```

2. **Test upload:**
   - Try uploading a file through the ticket form
   - Check browser console for errors
   - Check server logs: `tail -f /var/log/nginx/error.log` or `tail -f /var/log/apache2/error.log`

## Troubleshooting

If still getting 413 errors:

1. **Check which server you're using:**
   ```bash
   sudo systemctl status nginx
   sudo systemctl status apache2
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check PHP-FPM logs:**
   ```bash
   sudo tail -f /var/log/php8.2-fpm.log
   ```

4. **Verify settings are applied:**
   ```bash
   php -i | grep upload_max_filesize
   php -i | grep post_max_size
   ```

5. **Clear Laravel cache:**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

## Important Notes

- `post_max_size` must be **larger** than `upload_max_filesize`
- `client_max_body_size` (nginx) or `LimitRequestBody` (Apache) must be **larger** than `post_max_size`
- If using a reverse proxy (like Cloudflare), check their upload limits too
- Consider increasing limits gradually and testing

