#!/bin/bash

# WSL Quick Setup Script for Kimmix CMS
# This script helps you set up Docker and prepare for deployment testing

set -e

echo "🚀 Kimmix CMS - WSL Setup Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running in WSL
if ! grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null ; then
    echo -e "${YELLOW}⚠️  Warning: This doesn't appear to be WSL${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Update system
echo -e "${GREEN}📦 Step 1: Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

# Step 2: Install Docker
echo -e "${GREEN}🐳 Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker already installed${NC}"
fi

# Step 3: Add user to docker group
echo -e "${GREEN}👤 Step 3: Adding user to docker group...${NC}"
sudo usermod -aG docker $USER
echo -e "${GREEN}✅ User added to docker group${NC}"
echo -e "${YELLOW}⚠️  You may need to log out and back in for this to take effect${NC}"

# Step 4: Install Docker Compose
echo -e "${GREEN}🔧 Step 4: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose already installed${NC}"
fi

# Step 5: Create Docker directories
echo -e "${GREEN}📁 Step 5: Creating Docker directories...${NC}"
mkdir -p docker/nginx
mkdir -p docker/php
mkdir -p docker/mysql
echo -e "${GREEN}✅ Directories created${NC}"

# Step 6: Verify installation
echo -e "${GREEN}✅ Step 6: Verifying installation...${NC}"
echo ""
echo "Docker version:"
docker --version || echo -e "${RED}❌ Docker not found${NC}"
echo ""
echo "Docker Compose version:"
docker-compose --version || echo -e "${RED}❌ Docker Compose not found${NC}"
echo ""

# Step 7: Test Docker
echo -e "${GREEN}🧪 Step 7: Testing Docker...${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✅ Docker is working!${NC}"
else
    echo -e "${YELLOW}⚠️  Docker test failed. You may need to:${NC}"
    echo "   1. Log out and back in"
    echo "   2. Or run: newgrp docker"
    echo "   3. Or restart WSL"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Make sure you're in the project directory"
echo "2. Configure .env file"
echo "3. Run: docker-compose build"
echo "4. Run: docker-compose up -d"
echo ""
echo "See WSL_DEPLOYMENT_GUIDE.md for detailed instructions"
