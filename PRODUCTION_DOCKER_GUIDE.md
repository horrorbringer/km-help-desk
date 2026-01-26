# Production Docker Setup Guide

## Overview

This production Docker configuration uses pre-built images from Docker Hub and is optimized for production deployment with proper security, performance, and scalability considerations.

## Architecture

### Services Overview

```
┌─────────────────┐    ┌─────────────┐    ┌─────────────────┐
│   Nginx (80)    │────│   App (PHP) │────│   Database      │
│                 │    │   Laravel   │    │   MySQL 8.0     │
│   - Static files│    │             │    │                 │
│   - SSL/TLS     │    │   - FPM      │    │   - Persistent  │
│   - Caching     │    │   - Artisan  │    │   - Optimized   │
└─────────────────┘    └─────────────┘    └─────────────────┘
         │                       │                │
         └───────────────────────┼────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │     Redis (Cache)      │
                    │                        │
                    │   - Sessions           │
                    │   - Cache              │
                    │   - Queues             │
                    └─────────────────────────┘
```

## Services Configuration

### 1. Application Service (`app`)

```yaml
image: vanny3333/km-help-desk:latest # Pre-built production image
restart: unless-stopped
working_dir: /var/www/html
```

**Features:**

- Uses pre-built Docker Hub image
- Production environment (`APP_ENV=production`)
- Debug disabled (`APP_DEBUG=false`)
- Redis for cache, sessions, and queues
- Health checks enabled

**Volumes:**

- `./.env` - Read-only environment config
- `./storage` - Persistent file storage
- `./bootstrap/cache` - Laravel compiled views

### 2. Nginx Web Server (`nginx`)

```yaml
image: nginx:alpine
ports:
    - '${APP_PORT:-80}:80'
```

**Features:**

- Lightweight Alpine Linux
- Production-optimized config with security headers
- Rate limiting and caching
- SSL/TLS ready (HTTP only by default)

**Volumes:**

- `./docker/nginx/production.conf` - Nginx config
- `./public` - Static assets
- `./storage/app/public` - User uploads

### 3. Database Service (`db`)

```yaml
image: mysql:8.0
restart: unless-stopped
```

**Features:**

- MySQL 8.0 for performance
- Persistent data with named volumes
- Custom MySQL configuration

**Environment Variables:**

- `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD` for admin access

### 4. Redis Service (`redis`)

```yaml
image: redis:alpine
command: redis-server --appendonly yes
```

**Features:**

- Lightweight Alpine image
- Append-only file persistence
- Used for cache, sessions, and queues

### 5. Queue Worker (`queue`)

```yaml
image: vanny3333/km-help-desk:latest
command: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
```

**Features:**

- Dedicated queue processing
- Redis queue driver
- Automatic restarts on failure
- Configurable retry and timeout settings

### 6. Scheduler (`scheduler`)

```yaml
image: vanny3333/km-help-desk:latest
command: sh -c "while true; do php artisan schedule:run --verbose --no-interaction & sleep 60; done"
```

**Features:**

- Runs Laravel scheduler every minute
- Handles cron jobs like notifications, cleanup
- Background processing

## Environment Configuration

### Required Environment Variables

```env
# Application
APP_ENV=production
APP_DEBUG=false
APP_PORT=80

# Database
DB_CONNECTION=mysql
DB_HOST=db
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password
MYSQL_ROOT_PASSWORD=your_root_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Laravel Services
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

## Deployment Steps

### 1. Prepare Environment

```bash
# Copy and configure environment
cp env.production.template .env
# Edit .env with your production values
```

### 2. Deploy with Docker

```bash
# Pull latest images
docker-compose -f docker-compose.production.yml pull

# Start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 3. Run Migrations (First Time)

```bash
# Run database migrations
docker-compose -f docker-compose.production.yml exec app php artisan migrate --force

# Seed initial data (optional)
docker-compose -f docker-compose.production.yml exec app php artisan db:seed --force
```

### 4. Create Storage Link

```bash
docker-compose -f docker-compose.production.yml exec app php artisan storage:link
```

## Production Optimizations

### Security

- ✅ Production environment variables
- ✅ No debug information exposed
- ✅ Secure Redis configuration
- ✅ Nginx security headers
- ✅ Rate limiting enabled

### Performance

- ✅ Redis caching for sessions and data
- ✅ Optimized Nginx configuration
- ✅ Queue processing for background jobs
- ✅ Compressed static assets
- ✅ Database connection pooling

### Reliability

- ✅ Health checks on app container
- ✅ Automatic service restarts
- ✅ Persistent data volumes
- ✅ Graceful shutdown handling

## Monitoring & Maintenance

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f app
```

### Access Containers

```bash
# Application shell
docker-compose -f docker-compose.production.yml exec app bash

# Database shell
docker-compose -f docker-compose.production.yml exec db mysql -u root -p
```

### Backup Database

```bash
docker-compose -f docker-compose.production.yml exec db mysqldump -u root -p kimmix_cms > backup.sql
```

### Update Deployment

```bash
# Pull latest image
docker-compose -f docker-compose.production.yml pull

# Restart with zero downtime
docker-compose -f docker-compose.production.yml up -d

# Clean old images
docker image prune -f
```

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

- Load balancer in front of multiple app instances
- Separate Redis cluster
- Database read replicas

### Vertical Scaling

- Increase container resource limits
- Use larger instance types
- Optimize database configuration

## Troubleshooting

### Common Issues

1. **Port conflicts:** Change `APP_PORT` if 80 is in use
2. **Database connection:** Verify environment variables
3. **Permission errors:** Check volume mounts
4. **SSL issues:** Use reverse proxy (nginx-proxy, traefik)

### Health Checks

```bash
# Check all services
docker-compose -f docker-compose.production.yml ps

# Test application
curl -f http://localhost/health

# Test database
docker-compose -f docker-compose.production.yml exec app php artisan db:monitor
```

## SSL/TLS Setup

For HTTPS, use a reverse proxy like:

- **Traefik** (recommended for Docker)
- **nginx-proxy** with Let's Encrypt
- **Caddy** for automatic SSL

Example with Traefik:

```yaml
# Add to docker-compose.production.yml
services:
    traefik:
        image: traefik:v2.5
        command:
            - '--api.insecure=true'
            - '--providers.docker=true'
            - '--providers.docker.exposedbydefault=false'
            - '--entrypoints.websecure.address=:443'
            - '--certificatesresolvers.myresolver.acme.httpchallenge=true'
            - '--certificatesresolvers.myresolver.acme.httpchallenge.entrypoint=web'
            - '--certificatesresolvers.myresolver.acme.email=your@email.com'
        ports:
            - '443:443'
        volumes:
            - /var/run/docker.sock:/var/run/docker.sock
            - traefik-certificates:/certificates

    # Add labels to nginx service
    nginx:
        labels:
            - 'traefik.enable=true'
            - 'traefik.http.routers.nginx.rule=Host(`your-domain.com`)'
            - 'traefik.http.routers.nginx.tls.certresolver=myresolver'
```

## Backup Strategy

### Automated Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.production.yml exec db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" kimmix_cms > "backup_$DATE.sql"
docker-compose -f docker-compose.production.yml exec app tar czf "storage_$DATE.tar.gz" storage/
```

### Volume Backups

```bash
# Backup named volumes
docker run --rm -v km-help-desk_db_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz -C /data .
```

This production setup provides a robust, scalable, and secure deployment for your help desk application.
