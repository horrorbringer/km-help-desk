# Production Docker Commands Quick Reference

## Basic Operations

```bash
# Use production compose file
export COMPOSE_FILE=docker-compose.production.yml

# Start production services
docker-compose -f docker-compose.production.yml up -d

# Stop production services
docker-compose -f docker-compose.production.yml down

# View production logs
docker-compose -f docker-compose.production.yml logs -f

# Check production status
docker-compose -f docker-compose.production.yml ps
```

## Laravel Commands (Production)

```bash
# Run artisan commands in production
docker-compose -f docker-compose.production.yml exec app php artisan <command>

# Database operations
docker-compose -f docker-compose.production.yml exec app php artisan migrate --force
docker-compose -f docker-compose.production.yml exec app php artisan db:seed --force

# Cache management
docker-compose -f docker-compose.production.yml exec app php artisan cache:clear
docker-compose -f docker-compose.production.yml exec app php artisan config:clear
docker-compose -f docker-compose.production.yml exec app php artisan route:clear
```

## Database Management

```bash
# Access production database
docker-compose -f docker-compose.production.yml exec db mysql -u root -p"$MYSQL_ROOT_PASSWORD" kimmix_cms

# Backup production database
docker-compose -f docker-compose.production.yml exec db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" kimmix_cms > prod_backup_$(date +%Y%m%d).sql

# Restore database
docker-compose -f docker-compose.production.yml exec -T db mysql -u root -p"$MYSQL_ROOT_PASSWORD" kimmix_cms < prod_backup.sql
```

## Container Access

```bash
# Production app shell
docker-compose -f docker-compose.production.yml exec app bash

# Production database shell
docker-compose -f docker-compose.production.yml exec db bash

# Production redis CLI
docker-compose -f docker-compose.production.yml exec redis redis-cli
```

## Updates & Maintenance

```bash
# Update production images
docker-compose -f docker-compose.production.yml pull

# Restart production services
docker-compose -f docker-compose.production.yml restart

# Rebuild production (after Dockerfile changes)
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Clean up old images
docker image prune -f
```

## Monitoring

```bash
# Monitor all production services
docker-compose -f docker-compose.production.yml ps

# Monitor specific service logs
docker-compose -f docker-compose.production.yml logs -f app
docker-compose -f docker-compose.production.yml logs -f nginx
docker-compose -f docker-compose.production.yml logs -f db

# Check application health
curl -f http://your-domain.com/health
```

## Emergency Operations

```bash
# Emergency stop all services
docker-compose -f docker-compose.production.yml down

# Force remove containers (if stuck)
docker-compose -f docker-compose.production.yml down --remove-orphans

# Reset production environment (WARNING: loses data)
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d
```

## Environment Management

```bash
# Check environment variables
docker-compose -f docker-compose.production.yml exec app env | grep -E "(APP|DB|REDIS)"

# Reload environment (restart required)
docker-compose -f docker-compose.production.yml restart app

# Validate configuration
docker-compose -f docker-compose.production.yml config
```

## Scaling (Advanced)

```bash
# Scale queue workers
docker-compose -f docker-compose.production.yml up -d --scale queue=3

# Scale app instances (requires load balancer)
docker-compose -f docker-compose.production.yml up -d --scale app=3
```

## SSL/TLS with Reverse Proxy

```bash
# Example: Using nginx-proxy with Let's Encrypt
docker run -d -p 80:80 -p 443:443 \
  --name nginx-proxy \
  -v /path/to/certs:/etc/nginx/certs:ro \
  -v /var/run/docker.sock:/tmp/docker.sock:ro \
  jwilder/nginx-proxy

# Add VIRTUAL_HOST and LETSENCRYPT_HOST env vars to your services
```
