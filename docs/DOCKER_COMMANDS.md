# Docker Commands Cheat Sheet

## Port Configuration Notes

- **App:** http://localhost:8080 (nginx on port 8080)
- **Database:** External port 3307 (internal port 3306)
- **Redis:** Port 6379
- **Note:** Check `docker-compose ps` for exact port mappings

## Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## Laravel Commands

```bash
# Run artisan commands
docker-compose exec app php artisan <command>

# Common ones:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan queue:work
```

## Database Access

```bash
# External access (from host) - Port from docker-compose.yml
mysql -h localhost -P 3307 -u kimmix_user -pkimmix_password kimmix_cms

# Container access (internal)
docker-compose exec db mysql -u kimmix_user -pkimmix_password kimmix_cms

# Check current port mapping
docker-compose ps --format "table {{.Names}}\t{{.Ports}}" | grep db
```

## Container Shell Access

```bash
# App container
docker-compose exec app bash

# Database container
docker-compose exec db bash

# Redis CLI
docker-compose exec redis redis-cli
```

## Rebuild & Reset

```bash
# Rebuild after code changes
docker-compose up -d --build

# Reset everything (WARNING: loses data)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

```bash
# Check container health
docker-compose ps

# View specific service logs
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app

# Validate compose configuration
docker-compose config
```
