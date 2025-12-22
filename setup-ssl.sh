#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SSL Certificate Setup${NC}"
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <domain> [www.domain.com]${NC}"
    echo "Example: $0 example.com www.example.com"
    exit 1
fi

DOMAIN=$1
WWW_DOMAIN=$2

# Create SSL directory
mkdir -p docker/nginx/ssl

echo -e "${YELLOW}Choose SSL certificate type:${NC}"
echo "1) Let's Encrypt (Recommended for production)"
echo "2) Self-signed (For testing only)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Setting up Let's Encrypt certificate...${NC}"
        
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            echo -e "${YELLOW}Installing certbot...${NC}"
            sudo apt-get update
            sudo apt-get install -y certbot
        fi
        
        # Generate certificate
        if [ -z "$WWW_DOMAIN" ]; then
            sudo certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
        else
            sudo certbot certonly --standalone -d "$DOMAIN" -d "$WWW_DOMAIN" --non-interactive --agree-tos --email admin@$DOMAIN
        fi
        
        # Copy certificates
        echo -e "${YELLOW}Copying certificates...${NC}"
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem docker/nginx/ssl/cert.pem
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem docker/nginx/ssl/key.pem
        
        # Set permissions
        sudo chown $USER:$USER docker/nginx/ssl/*.pem
        chmod 600 docker/nginx/ssl/*.pem
        
        echo -e "${GREEN}✓ Let's Encrypt certificate installed successfully!${NC}"
        echo -e "${YELLOW}Note: Certificates expire in 90 days. Set up auto-renewal with:${NC}"
        echo "  sudo certbot renew --dry-run"
        ;;
    2)
        echo -e "${YELLOW}Generating self-signed certificate...${NC}"
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout docker/nginx/ssl/key.pem \
            -out docker/nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
        
        chmod 600 docker/nginx/ssl/*.pem
        
        echo -e "${GREEN}✓ Self-signed certificate generated!${NC}"
        echo -e "${YELLOW}Warning: Self-signed certificates are for testing only.${NC}"
        echo -e "${YELLOW}Browsers will show security warnings.${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}SSL setup complete!${NC}"
echo -e "${YELLOW}Certificates are located in: docker/nginx/ssl/${NC}"
