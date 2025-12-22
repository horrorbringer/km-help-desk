#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/makara/km-help-desk"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

echo -e "${GREEN}Starting production deployment...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: $ENV_FILE file not found!${NC}"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}Pulling latest code from repository...${NC}"
git fetch origin
git reset --hard origin/main
git clean -fd

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" build --no-cache

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down

# Start containers
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 15

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan migrate --force

# Clear and cache configuration
echo -e "${YELLOW}Optimizing application...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan config:cache
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan route:cache
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan view:cache
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan event:cache

# Clear application cache
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan cache:clear

# Set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
docker-compose -f "$COMPOSE_FILE" exec -T app chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
docker-compose -f "$COMPOSE_FILE" exec -T app chmod -R 755 /var/www/html/storage /var/www/html/bootstrap/cache

# Create storage link if it doesn't exist
docker-compose -f "$COMPOSE_FILE" exec -T app php artisan storage:link || true

# Restart queue and scheduler
echo -e "${YELLOW}Restarting queue and scheduler...${NC}"
docker-compose -f "$COMPOSE_FILE" restart queue scheduler

# Show container status
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${YELLOW}Container status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo -e "${GREEN}✓ Production deployment successful!${NC}"
