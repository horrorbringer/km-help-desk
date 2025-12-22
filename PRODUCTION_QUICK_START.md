# Production Deployment - Quick Start

## Quick Deployment Checklist

### 1. Server Setup
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo usermod -aG docker $USER
```

### 2. Clone Repository
```bash
cd /home/makara
git clone <repository-url> km-help-desk
cd km-help-desk
```

### 3. Configure Environment
```bash
cp env.production.template .env
nano .env  # Update all values, especially passwords and APP_URL
```

### 4. Setup SSL Certificates
```bash
# Option A: Let's Encrypt (Recommended)
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
mkdir -p docker/nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem docker/nginx/ssl/key.pem
sudo chown $USER:$USER docker/nginx/ssl/*.pem
chmod 600 docker/nginx/ssl/*.pem

# Option B: Self-signed (Testing only)
mkdir -p docker/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 5. Deploy
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 6. Verify
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl https://your-domain.com/health

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Important Environment Variables

**Required:**
- `APP_KEY` - Generate with: `docker-compose -f docker-compose.prod.yml exec app php artisan key:generate`
- `APP_URL` - Your production domain (https://your-domain.com)
- `DB_PASSWORD` - Strong database password
- `DB_ROOT_PASSWORD` - Strong MySQL root password
- `REDIS_PASSWORD` - Strong Redis password

**Security:**
- `APP_DEBUG=false` - Must be false in production
- `APP_ENV=production` - Must be production

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Restart services
docker-compose -f docker-compose.prod.yml restart [service]

# Update application
git pull && ./deploy.sh

# Backup database
docker-compose -f docker-compose.prod.yml exec db mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_DATABASE} > backup.sql

# Clear caches
docker-compose -f docker-compose.prod.yml exec app php artisan cache:clear
docker-compose -f docker-compose.prod.yml exec app php artisan config:cache
```

## GitHub Actions Setup

Configure these secrets in your GitHub repository:
- `SERVER_HOST` - Server IP or domain
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - Private SSH key

After setup, pushes to `main` branch will auto-deploy.

## Troubleshooting

**Database connection issues:**
```bash
docker-compose -f docker-compose.prod.yml logs db
```

**Permission issues:**
```bash
docker-compose -f docker-compose.prod.yml exec app chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
```

**Queue not processing:**
```bash
docker-compose -f docker-compose.prod.yml logs queue
docker-compose -f docker-compose.prod.yml restart queue
```

For detailed information, see `PRODUCTION_DEPLOYMENT.md`.
