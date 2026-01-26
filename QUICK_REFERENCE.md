# KM Help Desk - Quick Setup Notes

## Current Status

✅ **Application is running and ready**

- URL: http://localhost:8080
- All services healthy (app, db, nginx, redis, queue, scheduler)
- Database seeded with sample data

## Default Login Credentials

Check your database seeders for exact credentials, typically:

- **Email:** admin@example.com
- **Password:** password

## Project Structure

```
/km-help-desk/
├── app/                 # Laravel application code
├── resources/           # Views, assets
├── routes/             # Route definitions
├── database/           # Migrations, seeders
├── docker/             # Docker configurations
│   ├── nginx/         # Web server configs
│   ├── php/           # PHP configs
│   └── mysql/         # Database configs
├── storage/            # File uploads, logs
├── public/             # Web root
├── docker-compose.yml  # Development setup
├── docker-compose.production.yml  # Production setup
└── Dockerfile          # Application container
```

## Development Workflow

### Logging & Debugging

- **View Laravel logs:** `tail -f storage/logs/laravel.log`
- **Search errors:** `grep "ERROR" storage/logs/laravel.log`
- **Detailed logging guide:** See [LARAVEL_LOGS.md](LARAVEL_LOGS.md)

### Start/Stop Services

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Run Laravel Commands

```bash
# Run artisan commands
docker-compose exec app php artisan <command>

# Common commands:
docker-compose exec app php artisan migrate
docker-compose exec app php artisan db:seed
docker-compose exec app php artisan cache:clear
```

### Database Access

```bash
# Connect to MySQL (external)
mysql -h localhost -P 3307 -u kimmix_user -pkimmix_password kimmix_cms

# Or from container
docker-compose exec db mysql -u kimmix_user -pkimmix_password kimmix_cms
```

### Frontend Development

```bash
# Install Node dependencies (if needed)
docker-compose exec app npm install

# Build assets (already done in Dockerfile)
docker-compose exec app npm run build
```

## Key Features

- **Ticket Management:** Create, assign, track support tickets
- **User Roles:** Admin, Agent, User permissions
- **Departments & Categories:** Organize tickets
- **Workflow Templates:** Automated ticket processing
- **Knowledge Base:** Self-service articles
- **Time Tracking:** Log work on tickets
- **Approvals:** Multi-level ticket approval system
- **Email Templates:** Customizable notifications
- **Reports & Analytics:** Dashboard insights

## Environment Configuration

### Important `.env` Settings

```env
APP_NAME="KM Help Desk"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8080

DB_CONNECTION=mysql
DB_HOST=db          # Container hostname
DB_PORT=3306        # Internal port
DB_DATABASE=kimmix_cms
DB_USERNAME=kimmix_user
DB_PASSWORD=kimmix_password

REDIS_HOST=redis
QUEUE_CONNECTION=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

## Troubleshooting

### Common Issues

1. **Port conflicts:** Change `DB_PORT` in docker-compose.yml if 3307 is in use
2. **Database connection:** Ensure DB_HOST=db (not localhost)
3. **Permission errors:** Run `docker-compose exec app chmod -R 755 storage`
4. **Assets not loading:** Run `docker-compose exec app php artisan storage:link`

### Reset Everything

```bash
# Stop and remove all data
docker-compose down -v

# Clean rebuild
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### Option 1: Docker Production

```bash
# Use production compose file
docker-compose -f docker-compose.production.yml up -d

# Or build and push your own image
docker build -t your-registry/km-help-desk:latest .
```

### Option 2: Traditional Server

Follow `PRODUCTION_SERVER_QUICK_START.md` for LEMP stack deployment.

## Development Notes

- Hot reload enabled for Laravel files (mounted volume)
- Frontend assets built during Docker build
- Redis used for cache, sessions, and queues
- Queue worker processes jobs in background
- Scheduler runs every minute for automated tasks

## Next Steps

1. **Explore the interface** at http://localhost:8080
2. **Create test tickets** and workflows
3. **Configure email settings** for notifications
4. **Set up SSL** for production
5. **Customize branding** and settings

For detailed documentation, see the full `README.md` file.
