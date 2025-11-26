# Deployment Checklist for Ubuntu Server

## Pre-Deployment Checks ✅

### 1. Build Error Fixed
- ✅ Removed `resources/js/pages/dashboard.tsx` (unused file causing build error)
- ✅ Build should now complete successfully

### 2. Server Requirements

#### PHP Requirements
- PHP >= 8.2
- Required PHP Extensions:
  - BCMath
  - Ctype
  - cURL
  - DOM
  - Fileinfo
  - JSON
  - Mbstring
  - OpenSSL
  - PCRE
  - PDO
  - Tokenizer
  - XML

#### Database
- MySQL 8.0+ or MariaDB 10.3+
- Create database and user before deployment

#### Web Server
- Nginx (recommended) or Apache
- Node.js 18+ (for building assets)
- Composer 2.x

### 3. Environment Configuration

Create `.env` file on server with these critical settings:

```env
APP_NAME="Kimmix CMS"
APP_ENV=production
APP_KEY=                    # Generate with: php artisan key:generate
APP_DEBUG=false            # MUST be false in production
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Cache & Session
CACHE_DRIVER=redis         # or 'file' if Redis not available
SESSION_DRIVER=redis       # or 'file' if Redis not available
QUEUE_CONNECTION=redis     # or 'sync' if Redis not available

# Mail Configuration
MAIL_MAILER=smtp
MAIL_HOST=your_smtp_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="${APP_NAME}"

# Filesystem
FILESYSTEM_DISK=local      # or 's3' for cloud storage

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=error            # Use 'error' in production
```

### 4. Deployment Steps

#### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install PHP 8.2 and extensions
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-xml \
    php8.2-mbstring php8.2-curl php8.2-zip php8.2-bcmath php8.2-gd

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install MySQL/MariaDB
sudo apt install -y mysql-server
```

#### Step 2: Clone and Setup Application
```bash
# Clone repository
cd /var/www
sudo git clone your-repo-url kimmix-cms
sudo chown -R $USER:www-data kimmix-cms
cd kimmix-cms

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env file with your settings
nano .env

# Create storage symlink
php artisan storage:link

# Run migrations
php artisan migrate --force

# Seed database (optional)
php artisan db:seed --class=RolePermissionSeeder

# Install Node dependencies
npm ci

# Build assets for production
npm run build
```

#### Step 3: Set Permissions
```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/kimmix-cms
sudo chmod -R 755 /var/www/kimmix-cms
sudo chmod -R 775 /var/www/kimmix-cms/storage
sudo chmod -R 775 /var/www/kimmix-cms/bootstrap/cache
```

#### Step 4: Optimize for Production
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

#### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/kimmix-cms`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/kimmix-cms/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/kimmix-cms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 6: Setup SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Step 7: Setup Queue Worker (if using queues)
```bash
# Create systemd service
sudo nano /etc/systemd/system/kimmix-queue.service
```

Add:
```ini
[Unit]
Description=Kimmix CMS Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/kimmix-cms/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable kimmix-queue
sudo systemctl start kimmix-queue
```

#### Step 8: Setup Scheduled Tasks (Cron)
```bash
sudo crontab -e -u www-data
```

Add:
```
* * * * * cd /var/www/kimmix-cms && php artisan schedule:run >> /dev/null 2>&1
```

### 5. Security Checklist

- [ ] `APP_DEBUG=false` in `.env`
- [ ] `APP_ENV=production` in `.env`
- [ ] Strong database password
- [ ] SSL certificate installed
- [ ] Firewall configured (UFW)
- [ ] File permissions set correctly
- [ ] `.env` file not accessible via web
- [ ] Storage directory permissions (775)
- [ ] Bootstrap cache permissions (775)
- [ ] Regular backups configured

### 6. Performance Optimization

- [ ] Redis installed and configured (optional but recommended)
- [ ] Opcache enabled in PHP
- [ ] Nginx gzip compression enabled
- [ ] Static asset caching configured
- [ ] Database indexes optimized
- [ ] Queue workers running (if using queues)

### 7. Post-Deployment Verification

```bash
# Test application
curl -I https://yourdomain.com

# Check logs
tail -f /var/www/kimmix-cms/storage/logs/laravel.log

# Verify permissions
ls -la /var/www/kimmix-cms/storage
ls -la /var/www/kimmix-cms/bootstrap/cache

# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Clear all caches
php artisan optimize:clear
php artisan optimize
```

### 8. Common Issues & Solutions

#### Issue: 500 Internal Server Error
- Check file permissions
- Check `.env` file exists and is configured
- Check `APP_KEY` is set
- Check storage and bootstrap/cache permissions
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

#### Issue: Assets not loading
- Run `npm run build` again
- Check `public/build` directory exists
- Verify Nginx can serve static files
- Clear browser cache

#### Issue: Database connection error
- Verify database credentials in `.env`
- Check MySQL service is running: `sudo systemctl status mysql`
- Verify database exists
- Check user permissions

#### Issue: Permission denied errors
- Run: `sudo chown -R www-data:www-data /var/www/kimmix-cms`
- Run: `sudo chmod -R 775 storage bootstrap/cache`

### 9. Backup Strategy

```bash
# Database backup script
#!/bin/bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Files backup
tar -czf backup_files_$(date +%Y%m%d_%H%M%S).tar.gz /var/www/kimmix-cms
```

### 10. Monitoring

- Setup log rotation
- Monitor disk space
- Monitor database size
- Setup uptime monitoring
- Monitor queue workers

## Quick Deployment Script

Save as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci

# Build assets
npm run build

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
sudo systemctl reload php8.2-fpm
sudo systemctl restart kimmix-queue

echo "Deployment complete!"
```

Make executable: `chmod +x deploy.sh`

