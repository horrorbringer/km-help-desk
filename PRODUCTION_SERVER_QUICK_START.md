# Production Server Deployment - Quick Start

Quick reference for deploying to a traditional server (non-Docker).

## Initial Server Setup

```bash
# Run automated setup
sudo ./setup-server.sh
```

## Deploy Application

### 1. Clone Repository

```bash
sudo mkdir -p /var/www/km-help-desk
cd /var/www
sudo -u www-data git clone <repo-url> km-help-desk
cd km-help-desk
```

### 2. Install Dependencies

```bash
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data npm ci --production
sudo -u www-data npm run build
```

### 3. Configure Environment

```bash
sudo -u www-data cp env.production.template .env
sudo nano .env  # Update all values
sudo -u www-data php artisan key:generate
```

### 4. Setup Database

```bash
sudo mysql -u root -p
# CREATE DATABASE km_help_desk;
# CREATE USER 'km_help_desk_user'@'localhost' IDENTIFIED BY 'password';
# GRANT ALL ON km_help_desk.* TO 'km_help_desk_user'@'localhost';
# FLUSH PRIVILEGES;
# EXIT;

sudo -u www-data php artisan migrate --force
```

### 5. Configure Nginx

```bash
sudo cp docker/nginx/production-server.conf /etc/nginx/sites-available/km-help-desk
sudo nano /etc/nginx/sites-available/km-help-desk  # Update server_name
sudo ln -s /etc/nginx/sites-available/km-help-desk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 7. Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/km-help-desk
sudo chmod -R 775 /var/www/km-help-desk/storage /var/www/km-help-desk/bootstrap/cache
sudo -u www-data php artisan storage:link
```

### 8. Setup Queue & Scheduler

```bash
sudo cp systemd/km-help-desk-queue.service /etc/systemd/system/
sudo cp systemd/km-help-desk-scheduler.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now km-help-desk-queue
sudo systemctl enable --now km-help-desk-scheduler
```

### 9. Optimize

```bash
sudo -u www-data php artisan config:cache
sudo -u www-data php artisan route:cache
sudo -u www-data php artisan view:cache
```

## Deployment Updates

Use the deployment script:

```bash
cd /var/www/km-help-desk
sudo -u www-data ./deploy-server.sh
```

Or manually:

```bash
sudo -u www-data php artisan down
sudo -u www-data git pull
sudo -u www-data composer install --no-dev --optimize-autoloader
sudo -u www-data npm ci --production && sudo -u www-data npm run build
sudo -u www-data php artisan migrate --force
sudo -u www-data php artisan config:cache
sudo systemctl restart php8.3-fpm km-help-desk-queue km-help-desk-scheduler
sudo -u www-data php artisan up
```

## Common Commands

### Services

```bash
sudo systemctl status nginx php8.3-fpm mysql redis-server km-help-desk-queue km-help-desk-scheduler
sudo systemctl restart <service-name>
```

### Logs

```bash
# Application
sudo tail -f /var/www/km-help-desk/storage/logs/laravel.log

# Nginx
sudo tail -f /var/log/nginx/km-help-desk-*.log

# Services
sudo journalctl -u km-help-desk-queue -f
```

### Cache

```bash
cd /var/www/km-help-desk
sudo -u www-data php artisan cache:clear
sudo -u www-data php artisan config:cache
```

### Backup

```bash
mysqldump -u km_help_desk_user -p km_help_desk > backup_$(date +%Y%m%d).sql
```

## Environment Variables

**Critical:**
- `APP_KEY` - Run: `php artisan key:generate`
- `APP_URL` - Your domain (https://your-domain.com)
- `DB_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password (check `/etc/redis/redis.conf`)

**Security:**
- `APP_ENV=production`
- `APP_DEBUG=false`

## Troubleshooting

**Permission errors:**
```bash
sudo chown -R www-data:www-data /var/www/km-help-desk
sudo chmod -R 775 storage bootstrap/cache
```

**502 Bad Gateway:**
```bash
sudo systemctl restart php8.3-fpm
sudo tail -f /var/log/php8.3-fpm.log
```

**Queue not working:**
```bash
sudo systemctl restart km-help-desk-queue
sudo journalctl -u km-help-desk-queue -f
```

For detailed information, see `PRODUCTION_SERVER_DEPLOYMENT.md`.
