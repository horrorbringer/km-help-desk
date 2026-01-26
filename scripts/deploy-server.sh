#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/km-help-desk"
APP_USER="www-data"
APP_GROUP="www-data"

echo -e "${GREEN}Starting production deployment (Traditional Server)...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    exit 1
fi

# Switch to maintenance mode
echo -e "${YELLOW}Enabling maintenance mode...${NC}"
php artisan down || true

# Pull latest code
echo -e "${YELLOW}Pulling latest code from repository...${NC}"
git fetch origin
git reset --hard origin/main
git clean -fd

# Install/Update PHP dependencies
echo -e "${YELLOW}Installing PHP dependencies...${NC}"
composer install --no-dev --optimize-autoloader --no-interaction

# Install/Update Node dependencies and build assets
echo -e "${YELLOW}Building frontend assets...${NC}"
npm ci --production --prefer-offline --no-audit
npm run build

# Clear old caches
echo -e "${YELLOW}Clearing old caches...${NC}"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
php artisan migrate --force

# Optimize application
echo -e "${YELLOW}Optimizing application...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set proper permissions
echo -e "${YELLOW}Setting permissions...${NC}"
sudo chown -R $APP_USER:$APP_GROUP "$PROJECT_DIR"
sudo chmod -R 755 "$PROJECT_DIR"
sudo chmod -R 775 "$PROJECT_DIR/storage"
sudo chmod -R 775 "$PROJECT_DIR/bootstrap/cache"

# Create storage link if it doesn't exist
php artisan storage:link || true

# Restart services
echo -e "${YELLOW}Restarting services...${NC}"
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
sudo systemctl restart km-help-desk-queue || true
sudo systemctl restart km-help-desk-scheduler || true

# Clear application cache again
php artisan cache:clear

# Disable maintenance mode
echo -e "${YELLOW}Disabling maintenance mode...${NC}"
php artisan up

echo -e "${GREEN}✓ Production deployment successful!${NC}"
