# WSL Deployment Guide - Test Before Production

## 🎯 Complete Guide to Test Deployment in WSL

This guide will help you test your Docker deployment in WSL (Windows Subsystem for Linux) before deploying to production.

---

## 📋 Prerequisites

### 1. Install WSL (if not already installed)

**Windows 10/11:**
```powershell
# Open PowerShell as Administrator
wsl --install

# Or install specific distribution
wsl --install -d Ubuntu-22.04
```

**Verify Installation:**
```bash
wsl --list --verbose
```

### 2. Install Docker in WSL

```bash
# Open WSL (Ubuntu)
wsl

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to avoid sudo)
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

**Alternative: Use Docker Desktop for Windows**
- Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Enable WSL 2 integration in Docker Desktop settings
- Select your WSL distribution

---

## 🚀 Step-by-Step Deployment in WSL

### Step 1: Access Your Project in WSL

```bash
# Open WSL
wsl

# Navigate to your project
# Option 1: If project is in Windows
cd /mnt/d/projects/kimmix-cms

# Option 2: If you cloned in WSL
cd ~/projects/kimmix-cms
# or
cd /home/yourusername/kimmix-cms
```

**Tip:** Access Windows files from WSL:
- Windows `D:\projects\kimmix-cms` → WSL `/mnt/d/projects/kimmix-cms`
- Windows `C:\Users\...` → WSL `/mnt/c/Users/...`

### Step 2: Create Docker Configuration Files

The files are already created, but verify they exist:

```bash
# Check files
ls -la Dockerfile docker-compose.yml

# If missing, they should be in your project root
```

### Step 3: Create Docker Directories

```bash
# Create necessary directories
mkdir -p docker/nginx
mkdir -p docker/php
mkdir -p docker/mysql
```

### Step 4: Create Nginx Configuration

```bash
# Create Nginx config
cat > docker/nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html/public;
    index index.php index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Main location block
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM configuration
    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to storage and bootstrap
    location ~ ^/(storage|bootstrap)/ {
        deny all;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
}
EOF
```

### Step 5: Create PHP Configuration

```bash
# Create PHP config
cat > docker/php/local.ini << 'EOF'
upload_max_filesize=40M
post_max_size=40M
memory_limit=256M
max_execution_time=300
max_input_time=300
EOF
```

### Step 6: Create MySQL Configuration

```bash
# Create MySQL config
cat > docker/mysql/my.cnf << 'EOF'
[mysqld]
max_allowed_packet=256M
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
EOF
```

### Step 7: Configure Environment File

```bash
# Copy .env.example if exists, or create new .env
cp .env.example .env 2>/dev/null || touch .env

# Edit .env file
nano .env
```

**Add/Update these settings in `.env`:**

```env
APP_NAME="Kimmix CMS"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8080

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=kimmix_cms
DB_USERNAME=kimmix_user
DB_PASSWORD=kimmix_password

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Docker specific
APP_PORT=8080
DB_PORT=3307
REDIS_PORT=6379
DB_ROOT_PASSWORD=root_password
```

### Step 8: Build Docker Images

```bash
# Build all images
docker-compose build

# This will take a few minutes the first time
# Subsequent builds will be faster
```

### Step 9: Start All Services

```bash
# Start all containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 10: Generate Application Key

```bash
# Generate Laravel application key
docker-compose exec app php artisan key:generate

# Or if key already exists, just copy it
docker-compose exec app php artisan key:generate --show
```

### Step 11: Run Migrations

```bash
# Wait for database to be ready (about 10-15 seconds)
sleep 15

# Run migrations
docker-compose exec app php artisan migrate

# Run seeders (optional, for initial data)
docker-compose exec app php artisan db:seed
```

### Step 12: Set Permissions

```bash
# Set proper permissions
docker-compose exec app chown -R www-data:www-data /var/www/html
docker-compose exec app chmod -R 755 /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/bootstrap/cache

# Create storage link
docker-compose exec app php artisan storage:link
```

### Step 13: Clear and Cache

```bash
# Clear all caches
docker-compose exec app php artisan optimize:clear

# Cache config, routes, views
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan route:cache
docker-compose exec app php artisan view:cache
```

### Step 14: Access Your Application

```bash
# Check if containers are running
docker-compose ps

# You should see:
# - kimmix-cms-app (running)
# - kimmix-cms-nginx (running)
# - kimmix-cms-db (running)
# - kimmix-cms-redis (running)
# - kimmix-cms-queue (running)
# - kimmix-cms-scheduler (running)
```

**Access your application:**
- Open browser: `http://localhost:8080`
- Or from Windows: `http://localhost:8080`

---

## 🧪 Testing Your Deployment

### Test 1: Check All Services

```bash
# Check all containers are running
docker-compose ps

# Check logs
docker-compose logs app
docker-compose logs nginx
docker-compose logs db
```

### Test 2: Database Connection

```bash
# Test database connection
docker-compose exec app php artisan tinker
# Then in tinker:
DB::connection()->getPdo();
# Should return: PDO object
```

### Test 3: Redis Connection

```bash
# Test Redis
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Test 4: Access Application

1. Open browser: `http://localhost:8080`
2. You should see your Laravel application
3. Try logging in
4. Test creating a ticket

---

## 🔧 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Restart a specific service
docker-compose restart app
docker-compose restart nginx
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 app
```

### Execute Commands

```bash
# Run artisan commands
docker-compose exec app php artisan migrate
docker-compose exec app php artisan tinker
docker-compose exec app php artisan queue:work

# Access container shell
docker-compose exec app bash
docker-compose exec db bash

# Run composer
docker-compose exec app composer install

# Run npm
docker-compose exec app npm install
```

### Database Operations

```bash
# Access MySQL
docker-compose exec db mysql -u kimmix_user -pkimmix_password kimmix_cms

# Backup database
docker-compose exec db mysqldump -u kimmix_user -pkimmix_password kimmix_cms > backup.sql

# Restore database
docker-compose exec -T db mysql -u kimmix_user -pkimmix_password kimmix_cms < backup.sql
```

---

## 🐛 Troubleshooting

### Problem: Containers won't start

```bash
# Check logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problem: Permission errors

```bash
# Fix permissions
docker-compose exec app chown -R www-data:www-data /var/www/html
docker-compose exec app chmod -R 755 /var/www/html/storage
docker-compose exec app chmod -R 755 /var/www/html/bootstrap/cache
```

### Problem: Database connection error

```bash
# Wait for database to be ready
sleep 20

# Check database is running
docker-compose ps db

# Test connection
docker-compose exec app php artisan tinker
# DB::connection()->getPdo();
```

### Problem: Port already in use

```bash
# Change port in docker-compose.yml
# Change APP_PORT from 8080 to 8081
# Or stop the service using the port
```

### Problem: Out of memory

```bash
# Check memory usage
docker stats

# Increase WSL memory limit
# Edit: %UserProfile%\.wslconfig
# Add:
[wsl2]
memory=4GB
```

### Problem: Can't access from Windows browser

```bash
# Get WSL IP address
hostname -I

# Access using WSL IP: http://<WSL_IP>:8080
# Or use localhost:8080 (should work)
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune
```

### Check Application Health

```bash
# Check application logs
docker-compose logs app | tail -50

# Check queue worker
docker-compose logs queue | tail -50

# Check scheduler
docker-compose logs scheduler | tail -50
```

---

## ✅ Deployment Checklist

- [ ] WSL installed and configured
- [ ] Docker installed in WSL
- [ ] Docker Compose installed
- [ ] Project files in WSL
- [ ] Docker configuration files created
- [ ] `.env` file configured
- [ ] Docker images built
- [ ] Containers started
- [ ] Application key generated
- [ ] Migrations run
- [ ] Seeders run (optional)
- [ ] Permissions set
- [ ] Application accessible at `http://localhost:8080`
- [ ] All services running
- [ ] Database connection working
- [ ] Redis connection working

---

## 🚀 Next Steps

Once everything works in WSL:

1. **Test all features** - Create tickets, test workflows, etc.
2. **Check performance** - Monitor resource usage
3. **Test updates** - Pull new code, rebuild, restart
4. **Prepare for production** - Update `.env` for production
5. **Deploy to server** - Use same Docker setup on production server

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [WSL Documentation](https://docs.microsoft.com/en-us/windows/wsl/)
- [Laravel Deployment](https://laravel.com/docs/deployment)

---

## 🎉 You're Ready!

Your application should now be running in WSL. Test everything thoroughly before deploying to production!

**Access your app:** `http://localhost:8080`
