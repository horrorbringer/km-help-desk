# KM Help Desk

A Laravel-based help desk application with Docker support.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)

**Note:** The Docker containers use PHP 8.3. You don't need PHP installed locally, but your `composer.lock` file requires PHP 8.3+ for dev dependencies.

To verify your installation:

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd km-help-desk
```

### 2. Create Docker Configuration Files

The project requires Docker configuration files. Create them:

```bash
# Create necessary directories
mkdir -p docker/nginx docker/php docker/mysql
```

#### Create Nginx Configuration

```bash
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

#### Create PHP Configuration

```bash
cat > docker/php/local.ini << 'EOF'
upload_max_filesize=40M
post_max_size=40M
memory_limit=256M
max_execution_time=300
max_input_time=300
EOF
```

#### Create MySQL Configuration

```bash
cat > docker/mysql/my.cnf << 'EOF'
[mysqld]
max_allowed_packet=256M
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
sql_mode=STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
EOF
```

### 3. Create Environment File

```bash
# Copy .env.example if it exists, or create a new .env file
cp .env.example .env 2>/dev/null || touch .env
```

Edit the `.env` file and add/update the following configuration:

```env
APP_NAME="KM Help Desk"
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

### 4. Build and Start Docker Containers

```bash
# Build Docker images (first time takes ~5-10 minutes)
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 5. Install PHP Dependencies

Since the local directory is mounted as a volume, you need to install Composer dependencies inside the container:

```bash
# Install PHP dependencies
docker-compose exec app composer install

# If you get git ownership warnings, you can ignore them or fix with:
docker-compose exec app git config --global --add safe.directory /var/www/html
```

### 6. Generate Application Key

```bash
# Generate Laravel application key
docker-compose exec app php artisan key:generate
```

### 7. Run Database Migrations

```bash
# Wait for database to be ready (about 10-15 seconds)
sleep 15

# Run migrations
docker-compose exec app php artisan migrate

# Run seeders (optional, for initial data)
docker-compose exec app php artisan db:seed
```

### 8. Set Permissions

```bash
# Set proper permissions
docker-compose exec app chmod -R 755 storage bootstrap/cache

# Create storage link
docker-compose exec app php artisan storage:link
```

### 9. Access the Application

Open your browser and navigate to:

**http://localhost:8080**

## Docker Services

The application consists of the following Docker services:

- **app** - PHP-FPM service (Laravel application)
- **nginx** - Nginx web server
- **db** - MySQL 8.0 database
- **redis** - Redis cache and queue
- **queue** - Queue worker
- **scheduler** - Laravel scheduler (cron)

## Common Commands

### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f db
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### Start Services

```bash
# Start all services
docker-compose up -d

# Start and view logs
docker-compose up
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Rebuild After Changes

```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild and start
docker-compose up -d --build
```

### Run Artisan Commands

```bash
# Run any Laravel artisan command
docker-compose exec app php artisan <command>

# Examples:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
```

### Access Container Shell

```bash
# Access app container shell
docker-compose exec app bash

# Access database
docker-compose exec db mysql -u kimmix_user -pkimmix_password kimmix_cms
```

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, you can change it by editing `docker-compose.yml`:

```yaml
nginx:
    ports:
        - '8081:80' # Change 8080 to 8081
```

Or set the `APP_PORT` environment variable in your `.env` file:

```env
APP_PORT=8081
```

### Database Connection Error

If you get database connection errors:

1. Wait a bit longer for the database to initialize:

    ```bash
    sleep 20
    docker-compose exec app php artisan migrate
    ```

2. Check if the database container is running:

    ```bash
    docker-compose ps db
    ```

3. Check database logs:
    ```bash
    docker-compose logs db
    ```

### Permission Errors

If you encounter permission errors:

```bash
docker-compose exec app chmod -R 755 storage bootstrap/cache
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
```

### Clear Cache

```bash
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear
```

### Rebuild Everything from Scratch

If you need to start completely fresh:

```bash
# Stop and remove everything including volumes
docker-compose down -v

# Remove all images (optional)
docker system prune -a

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

## Documentation

### 📋 Quick Reference

- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Complete setup and usage guide
- [DOCKER_COMMANDS.md](DOCKER_COMMANDS.md) - Docker and Laravel command reference
- [PRODUCTION_DOCKER_GUIDE.md](PRODUCTION_DOCKER_GUIDE.md) - Production deployment guide
- [PRODUCTION_COMMANDS.md](PRODUCTION_COMMANDS.md) - Production Docker commands
- [LARAVEL_LOGS.md](LARAVEL_LOGS.md) - Laravel log management guide

## Development

### Running Tests

```bash
docker-compose exec app php artisan test
```

### Watching Assets (if developing frontend)

The frontend assets are built during the Docker build process. For development with hot-reload, you may need to run Vite separately (this would require additional configuration).

## Production Deployment

### Traditional Server Setup (Recommended for Performance)

For deploying without Docker on a traditional LEMP stack:

- `PRODUCTION_SERVER_DEPLOYMENT.md` - Complete traditional server deployment guide
- `PRODUCTION_SERVER_QUICK_START.md` - Quick reference for server deployment

**Quick Setup:**

```bash
sudo ./setup-server.sh  # Initial server setup
# Then follow PRODUCTION_SERVER_QUICK_START.md
```

### Docker Setup

For Docker-based deployment:

- `PRODUCTION_DEPLOYMENT.md` - Complete Docker production deployment guide
- `PRODUCTION_QUICK_START.md` - Quick reference for Docker deployment

**Quick Setup:**

1. Copy environment template: `cp env.production.template .env`
2. Configure SSL certificates: `./setup-ssl.sh your-domain.com`
3. Deploy: `./deploy.sh`

## Additional Documentation

- `QUICK_START_WSL.md` - Quick start guide for WSL users
- `WSL_DEPLOYMENT_GUIDE.md` - Complete deployment guide for WSL
- `DOCKER_BUILD_FIX.md` - Information about Docker build fixes
- `PRODUCTION_DEPLOYMENT.md` - Production deployment guide
- `PRODUCTION_QUICK_START.md` - Production quick start reference

## Support

For issues and questions, please refer to the project's issue tracker.
