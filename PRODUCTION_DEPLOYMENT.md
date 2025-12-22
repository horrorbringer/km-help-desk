# Production Deployment Guide

This guide covers deploying KM Help Desk to a production environment.

## Prerequisites

- Server with Docker and Docker Compose installed
- Domain name configured to point to your server
- SSL certificates (Let's Encrypt recommended)
- SSH access to the server
- Git repository access

## Server Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ recommended
- **Storage**: 20GB+ available space
- **OS**: Ubuntu 20.04+ or similar Linux distribution

## Step 1: Server Setup

### Install Docker and Docker Compose

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group (replace $USER with your username)
sudo usermod -aG docker $USER
```

### Create Project Directory

```bash
# Create project directory
sudo mkdir -p /home/makara/km-help-desk
sudo chown $USER:$USER /home/makara/km-help-desk
cd /home/makara/km-help-desk
```

## Step 2: Clone Repository

```bash
# Clone the repository
git clone <your-repository-url> .

# Or if repository already exists, pull latest
git pull origin main
```

## Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

### Required Environment Variables

Update the following in your `.env` file:

```env
APP_NAME="KM Help Desk"
APP_ENV=production
APP_KEY=                    # Generate with: php artisan key:generate
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=daily
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=km_help_desk
DB_USERNAME=km_help_desk_user
DB_PASSWORD=STRONG_PASSWORD_HERE

REDIS_HOST=redis
REDIS_PASSWORD=STRONG_REDIS_PASSWORD_HERE
REDIS_PORT=6379

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

DB_ROOT_PASSWORD=STRONG_ROOT_PASSWORD_HERE

# Mail Configuration
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
# Generate Laravel application key
docker-compose -f docker-compose.prod.yml exec app php artisan key:generate
```

## Step 4: SSL Certificates Setup

### Option A: Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot

# Generate certificates (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Create SSL directory
mkdir -p docker/nginx/ssl

# Copy certificates (adjust paths as needed)
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# Set proper permissions
sudo chown $USER:$USER docker/nginx/ssl/*.pem
chmod 600 docker/nginx/ssl/*.pem
```

### Option B: Self-Signed Certificate (Testing Only)

```bash
# Create SSL directory
mkdir -p docker/nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

## Step 5: Build and Start Services

```bash
# Build Docker images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## Step 6: Initialize Database

```bash
# Wait for database to be ready
sleep 15

# Run migrations
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force

# (Optional) Run seeders
docker-compose -f docker-compose.prod.yml exec app php artisan db:seed
```

## Step 7: Set Permissions

```bash
# Set proper permissions
docker-compose -f docker-compose.prod.yml exec app chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
docker-compose -f docker-compose.prod.yml exec app chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Create storage link
docker-compose -f docker-compose.prod.yml exec app php artisan storage:link
```

## Step 8: Optimize Application

```bash
# Cache configuration
docker-compose -f docker-compose.prod.yml exec app php artisan config:cache
docker-compose -f docker-compose.prod.yml exec app php artisan route:cache
docker-compose -f docker-compose.prod.yml exec app php artisan view:cache
docker-compose -f docker-compose.prod.yml exec app php artisan event:cache

# Clear application cache
docker-compose -f docker-compose.prod.yml exec app php artisan cache:clear
```

## Step 9: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 10: Setup Automated Deployment

### Make Deployment Script Executable

```bash
chmod +x deploy.sh
```

### Configure GitHub Actions (Already configured)

The GitHub Actions workflow will automatically deploy when you push to the `main` branch. Ensure these secrets are configured in your GitHub repository:

- `SERVER_HOST` - Your server IP or domain
- `SERVER_USER` - SSH username (e.g., `makara`)
- `SSH_PRIVATE_KEY` - Private SSH key for server access

### Manual Deployment

To deploy manually, run:

```bash
./deploy.sh
```

## Maintenance Commands

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f app
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f queue
```

### Restart Services

```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart app
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec app php artisan migrate --force

# Clear caches
docker-compose -f docker-compose.prod.yml exec app php artisan config:cache
docker-compose -f docker-compose.prod.yml exec app php artisan route:cache
docker-compose -f docker-compose.prod.yml exec app php artisan view:cache
```

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose -f docker-compose.prod.yml exec -T db mysql -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} < backup_file.sql
```

### Clear Caches

```bash
docker-compose -f docker-compose.prod.yml exec app php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec app php artisan config:clear
docker-compose -f docker-compose.prod.yml exec app php artisan route:clear
docker-compose -f docker-compose.prod.yml exec app php artisan view:clear
```

## Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] Strong database passwords
- [ ] Strong Redis password
- [ ] SSL certificates configured
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Application key generated
- [ ] Environment file not committed to git
- [ ] File permissions set correctly
- [ ] Rate limiting enabled in nginx

## Monitoring

### Health Check

The application includes a health check endpoint:

```bash
curl https://your-domain.com/health
```

### Container Health

```bash
# Check container health
docker-compose -f docker-compose.prod.yml ps

# Check resource usage
docker stats
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test database connection
docker-compose -f docker-compose.prod.yml exec app php artisan tinker
# Then run: DB::connection()->getPdo();
```

### Permission Issues

```bash
# Fix permissions
docker-compose -f docker-compose.prod.yml exec app chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
docker-compose -f docker-compose.prod.yml exec app chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache
```

### Queue Not Processing

```bash
# Check queue logs
docker-compose -f docker-compose.prod.yml logs queue

# Restart queue worker
docker-compose -f docker-compose.prod.yml restart queue
```

### SSL Certificate Renewal (Let's Encrypt)

```bash
# Renew certificates
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Support

For issues and questions, please refer to the project's issue tracker.
