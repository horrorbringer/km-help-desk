# 🚀 Quick Start - WSL Deployment Testing

## ⚡ Fast Setup (5 Minutes)

### Step 1: Open WSL

```bash
# Open WSL from Windows
wsl

# Or open Ubuntu directly
ubuntu
```

### Step 2: Navigate to Project

```bash
# If project is in Windows D: drive
cd /mnt/d/projects/kimmix-cms

# Or if cloned in WSL home
cd ~/kimmix-cms
```

### Step 3: Run Setup Script (Optional)

```bash
# Make script executable
chmod +x wsl-setup.sh

# Run setup
./wsl-setup.sh
```

**Or install manually:**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Step 4: Create Docker Config Files

```bash
# Create directories
mkdir -p docker/nginx docker/php docker/mysql

# Create Nginx config (copy from WSL_DEPLOYMENT_GUIDE.md)
# Or use the files already in your project
```

### Step 5: Configure Environment

```bash
# Copy .env.example or create new
cp .env.example .env

# Edit .env
nano .env
```

**Update these in `.env`:**
```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=kimmix_cms
DB_USERNAME=kimmix_user
DB_PASSWORD=kimmix_password

REDIS_HOST=redis
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

### Step 6: Build and Start

```bash
# Build images (first time takes ~5-10 minutes)
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 7: Setup Laravel

```bash
# Generate app key
docker-compose exec app php artisan key:generate

# Wait for database (15 seconds)
sleep 15

# Run migrations
docker-compose exec app php artisan migrate

# Run seeders (optional)
docker-compose exec app php artisan db:seed

# Set permissions
docker-compose exec app chmod -R 755 storage bootstrap/cache

# Create storage link
docker-compose exec app php artisan storage:link
```

### Step 8: Access Application

**Open browser:** `http://localhost:8080`

---

## 🎯 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop all
docker-compose down

# Start all
docker-compose up -d

# Restart
docker-compose restart

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Checklist

- [ ] WSL installed
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Project in WSL
- [ ] `.env` configured
- [ ] Docker files created
- [ ] Images built
- [ ] Services started
- [ ] Migrations run
- [ ] App accessible at `http://localhost:8080`

---

## 🆘 Troubleshooting

**Docker not found?**
```bash
newgrp docker
# Or restart WSL
```

**Port 8080 in use?**
```bash
# Change APP_PORT in docker-compose.yml
```

**Database connection error?**
```bash
# Wait longer
sleep 20
docker-compose exec app php artisan migrate
```

**Permission errors?**
```bash
docker-compose exec app chmod -R 755 storage bootstrap/cache
```

---

## 📚 Full Guide

See `WSL_DEPLOYMENT_GUIDE.md` for complete detailed instructions.

---

**Ready? Start with Step 1! 🚀**
