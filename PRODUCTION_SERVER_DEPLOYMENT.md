# Production Deployment Guide - Traditional Server Setup

This guide covers deploying KM Help Desk to a production server without Docker, using a traditional LEMP stack (Linux, Nginx, MySQL, PHP-FPM).

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Root or sudo access
- Domain name configured to point to your server IP
- Minimum 2GB RAM, 2 CPU cores, 20GB storage

## Step 1: Initial Server Setup

### Run Automated Setup Script

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/your-repo/km-help-desk/main/setup-server.sh
# Or copy from your local machine:
# scp setup-server.sh root@your-server:/root/
chmod +x setup-server.sh
sudo ./setup-server.sh
```

This script will install:
- Nginx web server
- PHP 8.3 FPM with required extensions
- MySQL 8.0
- Redis
- Node.js 20.x
- Composer
- Certbot (for SSL)

### Manual Installation (Alternative)

If you prefer manual installation, see the script contents for step-by-step commands.

## Step 2: Create Project Directory

```bash
# Create project directory
sudo mkdir -p /var/www/km-help-desk
sudo chown -R www-data:www-data /var/www/km-help-desk

# Clone repository
cd /var/www
sudo -u www-data git clone <your-repository-url> km-help-desk
cd km-help-desk
```

## Step 3: Install Application Dependencies

```bash
cd /var/www/km-help-desk

# Install PHP dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader

# Install Node dependencies and build assets
sudo -u www-data npm ci --production
sudo -u www-data npm run build
```

## Step 4: Configure Environment

```bash
# Copy environment template
sudo -u www-data cp env.production.template .env

# Edit environment file
sudo nano .env
```

### Required Environment Variables

```env
APP_NAME="KM Help Desk"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=km_help_desk
DB_USERNAME=km_help_desk_user
DB_PASSWORD=STRONG_PASSWORD_HERE

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=your_redis_password_from_setup
REDIS_PORT=6379

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-smtp-username
MAIL_PASSWORD=your-smtp-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@your-domain.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Generate Application Key

```bash
sudo -u www-data php artisan key:generate
```

## Step 5: Setup Database

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE km_help_desk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'km_help_desk_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON km_help_desk.* TO 'km_help_desk_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Migrations

```bash
cd /var/www/km-help-desk
sudo -u www-data php artisan migrate --force

# Optional: Run seeders
sudo -u www-data php artisan db:seed
```

## Step 6: Configure Nginx

### Copy Nginx Configuration

```bash
cd /var/www/km-help-desk
sudo cp docker/nginx/production-server.conf /etc/nginx/sites-available/km-help-desk

# Edit the configuration
sudo nano /etc/nginx/sites-available/km-help-desk
```

Update the following in the config file:
- `server_name your-domain.com www.your-domain.com;` - Replace with your domain
- SSL certificate paths (if not using Let's Encrypt)

### Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/km-help-desk /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Setup SSL Certificates

### Using Let's Encrypt (Recommended)

```bash
# Obtain certificate (will also configure Nginx)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL Configuration

If you have your own certificates, update the SSL paths in the Nginx configuration file.

## Step 8: Set Permissions

```bash
cd /var/www/km-help-desk

# Set ownership
sudo chown -R www-data:www-data .

# Set directory permissions
sudo find . -type d -exec chmod 755 {} \;

# Set file permissions
sudo find . -type f -exec chmod 644 {} \;

# Set special permissions for storage and cache
sudo chmod -R 775 storage bootstrap/cache

# Create storage symlink
sudo -u www-data php artisan storage:link
```

## Step 9: Setup Queue Worker

```bash
# Copy systemd service file
sudo cp systemd/km-help-desk-queue.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable km-help-desk-queue
sudo systemctl start km-help-desk-queue

# Check status
sudo systemctl status km-help-desk-queue
```

## Step 10: Setup Scheduler

```bash
# Copy systemd service file
sudo cp systemd/km-help-desk-scheduler.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable km-help-desk-scheduler
sudo systemctl start km-help-desk-scheduler

# Check status
sudo systemctl status km-help-desk-scheduler
```

## Step 11: Optimize Application

```bash
cd /var/www/km-help-desk

# Cache configuration
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
sudo -u www-data php artisan event:cache

# Clear application cache
sudo -u www-data php artisan cache:clear
```

## Step 12: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 13: Verify Deployment

### Test Health Endpoint

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00+00:00",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Check Services

```bash
# Check all services
sudo systemctl status nginx
sudo systemctl status php8.3-fpm
sudo systemctl status mysql
sudo systemctl status redis-server
sudo systemctl status km-help-desk-queue
sudo systemctl status km-help-desk-scheduler
```

## Deployment Workflow

### Automated Deployment

After initial setup, use the deployment script:

```bash
cd /var/www/km-help-desk
sudo -u www-data ./deploy-server.sh
```

The script will:
- Pull latest code
- Install dependencies
- Build assets
- Run migrations
- Optimize application
- Restart services

### Manual Deployment Steps

```bash
cd /var/www/km-help-desk

# Enable maintenance mode
sudo -u www-data php artisan down

# Pull latest code
sudo -u www-data git pull origin main

# Install dependencies
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data npm ci --production
sudo -u www-data npm run build

# Run migrations
sudo -u www-data php artisan migrate --force

# Optimize
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache

# Restart services
sudo systemctl restart php8.3-fpm
sudo systemctl restart km-help-desk-queue
sudo systemctl restart km-help-desk-scheduler

# Disable maintenance mode
sudo -u www-data php artisan up
```

## Maintenance Commands

### View Logs

```bash
# Application logs
sudo tail -f /var/www/km-help-desk/storage/logs/laravel.log

# Nginx logs
sudo tail -f /var/log/nginx/km-help-desk-access.log
sudo tail -f /var/log/nginx/km-help-desk-error.log

# Service logs
sudo journalctl -u km-help-desk-queue -f
sudo journalctl -u km-help-desk-scheduler -f
sudo journalctl -u php8.3-fpm -f
```

### Restart Services

```bash
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm
sudo systemctl restart km-help-desk-queue
sudo systemctl restart km-help-desk-scheduler
sudo systemctl restart mysql
sudo systemctl restart redis-server
```

### Clear Caches

```bash
cd /var/www/km-help-desk
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan view:clear
```

### Backup Database

```bash
# Create backup
mysqldump -u km_help_desk_user -p km_help_desk > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
mysql -u km_help_desk_user -p km_help_desk < backup_file.sql
```

## Performance Optimization

### PHP-FPM Tuning

Edit `/etc/php/8.3/fpm/pool.d/www.conf`:

```ini
pm = dynamic
pm.max_children = 25
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500
```

Then restart:
```bash
sudo systemctl restart php8.3-fpm
```

### MySQL Tuning

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_allowed_packet = 256M
```

Then restart:
```bash
sudo systemctl restart mysql
```

### Redis Tuning

Edit `/etc/redis/redis.conf`:

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Then restart:
```bash
sudo systemctl restart redis-server
```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSL certificates installed
- [ ] `APP_DEBUG=false` in production
- [ ] Strong database passwords
- [ ] Strong Redis password
- [ ] File permissions set correctly
- [ ] Nginx security headers enabled
- [ ] Rate limiting configured
- [ ] Regular backups scheduled
- [ ] System updates automated

## Troubleshooting

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/km-help-desk
sudo chmod -R 755 /var/www/km-help-desk
sudo chmod -R 775 /var/www/km-help-desk/storage /var/www/km-help-desk/bootstrap/cache
```

### Database Connection Issues

```bash
# Test connection
mysql -u km_help_desk_user -p km_help_desk

# Check MySQL status
sudo systemctl status mysql
sudo tail -f /var/log/mysql/error.log
```

### Queue Not Processing

```bash
# Check queue worker status
sudo systemctl status km-help-desk-queue

# View queue logs
sudo journalctl -u km-help-desk-queue -f

# Restart queue worker
sudo systemctl restart km-help-desk-queue
```

### 502 Bad Gateway

```bash
# Check PHP-FPM status
sudo systemctl status php8.3-fpm

# Check PHP-FPM logs
sudo tail -f /var/log/php8.3-fpm.log

# Restart PHP-FPM
sudo systemctl restart php8.3-fpm
```

## Monitoring

### Setup Log Rotation

Create `/etc/logrotate.d/km-help-desk`:

```
/var/www/km-help-desk/storage/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload php8.3-fpm > /dev/null 2>&1 || true
    endscript
}
```

### Health Monitoring

The application includes a health check endpoint:
- URL: `https://your-domain.com/health`
- Use with monitoring tools like Nagios, Zabbix, or UptimeRobot

## Support

For issues and questions, please refer to the project's issue tracker.
