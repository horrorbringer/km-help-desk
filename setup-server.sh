#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}KM Help Desk - Server Setup Script${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install basic utilities
echo -e "${YELLOW}Installing basic utilities...${NC}"
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt-get install -y nginx

# Install PHP 8.3 and extensions
echo -e "${YELLOW}Installing PHP 8.3 and extensions...${NC}"
add-apt-repository ppa:ondrej/php -y
apt-get update
apt-get install -y php8.3-fpm php8.3-cli php8.3-common php8.3-mysql php8.3-zip php8.3-gd php8.3-mbstring php8.3-curl php8.3-xml php8.3-bcmath php8.3-redis php8.3-intl php8.3-pcntl php8.3-exif

# Install MySQL
echo -e "${YELLOW}Installing MySQL...${NC}"
DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server

# Install Redis
echo -e "${YELLOW}Installing Redis...${NC}"
apt-get install -y redis-server

# Install Node.js 20.x
echo -e "${YELLOW}Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Composer
echo -e "${YELLOW}Installing Composer...${NC}"
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Certbot for SSL
echo -e "${YELLOW}Installing Certbot...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Configure PHP-FPM
echo -e "${YELLOW}Configuring PHP-FPM...${NC}"
PHP_INI="/etc/php/8.3/fpm/php.ini"
sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 40M/' $PHP_INI
sed -i 's/post_max_size = 8M/post_max_size = 40M/' $PHP_INI
sed -i 's/memory_limit = 128M/memory_limit = 256M/' $PHP_INI
sed -i 's/max_execution_time = 30/max_execution_time = 300/' $PHP_INI
sed -i 's/max_input_time = 60/max_input_time = 300/' $PHP_INI

# Configure PHP-FPM pool
echo -e "${YELLOW}Configuring PHP-FPM pool...${NC}"
POOL_FILE="/etc/php/8.3/fpm/pool.d/www.conf"
sed -i 's/;pm.max_requests = 500/pm.max_requests = 500/' $POOL_FILE
sed -i 's/pm.max_children = 5/pm.max_children = 25/' $POOL_FILE
sed -i 's/pm.start_servers = 2/pm.start_servers = 5/' $POOL_FILE
sed -i 's/pm.min_spare_servers = 1/pm.min_spare_servers = 3/' $POOL_FILE
sed -i 's/pm.max_spare_servers = 3/pm.max_spare_servers = 10/' $POOL_FILE

# Secure Redis
echo -e "${YELLOW}Securing Redis...${NC}"
REDIS_CONF="/etc/redis/redis.conf"
if ! grep -q "requirepass" $REDIS_CONF; then
    REDIS_PASSWORD=$(openssl rand -base64 32)
    echo "requirepass $REDIS_PASSWORD" >> $REDIS_CONF
    echo -e "${GREEN}Redis password set: $REDIS_PASSWORD${NC}"
    echo -e "${YELLOW}Save this password for your .env file!${NC}"
fi
sed -i 's/^# bind 127.0.0.1/bind 127.0.0.1/' $REDIS_CONF

# Secure MySQL
echo -e "${YELLOW}Securing MySQL...${NC}"
mysql_secure_installation <<EOF

y
0
$MYSQL_ROOT_PASSWORD
$MYSQL_ROOT_PASSWORD
y
y
y
y
y
EOF

# Start and enable services
echo -e "${YELLOW}Starting and enabling services...${NC}"
systemctl enable nginx
systemctl enable php8.3-fpm
systemctl enable mysql
systemctl enable redis-server

systemctl start nginx
systemctl start php8.3-fpm
systemctl start mysql
systemctl start redis-server

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow OpenSSH
    ufw --force enable
fi

echo ""
echo -e "${GREEN}✓ Server setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create project directory: sudo mkdir -p /var/www/km-help-desk"
echo "2. Clone repository: cd /var/www && sudo git clone <repo-url> km-help-desk"
echo "3. Set ownership: sudo chown -R www-data:www-data /var/www/km-help-desk"
echo "4. Copy Nginx config: sudo cp docker/nginx/production-server.conf /etc/nginx/sites-available/km-help-desk"
echo "5. Edit Nginx config and update server_name"
echo "6. Enable site: sudo ln -s /etc/nginx/sites-available/km-help-desk /etc/nginx/sites-enabled/"
echo "7. Test Nginx: sudo nginx -t"
echo "8. Reload Nginx: sudo systemctl reload nginx"
echo "9. Setup SSL: sudo certbot --nginx -d your-domain.com"
echo "10. Configure .env file"
echo "11. Run: php artisan key:generate"
echo "12. Run: php artisan migrate"
