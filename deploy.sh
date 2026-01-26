#!/bin/bash
set -e

echo "🚀 KM Help Desk Deployment Script"
echo "================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Configuration
DOCKER_USERNAME="vanny3333"
IMAGE_NAME="km-help-desk"
IMAGE_TAG=${1:-latest}
FULL_IMAGE="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "📦 Pulling latest image: ${FULL_IMAGE}"
docker pull ${FULL_IMAGE}

echo ""
echo "🔄 Starting services..."
docker-compose -f docker-compose.production.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "📊 Checking service status..."
docker-compose -f docker-compose.production.yml ps

echo ""
echo "🔑 Generating application key (if needed)..."
docker-compose -f docker-compose.production.yml exec -T app php artisan key:generate --force 2>/dev/null || echo "App key already exists"

echo ""
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.production.yml exec -T app php artisan migrate --force

echo ""
echo "🔗 Creating storage link..."
docker-compose -f docker-compose.production.yml exec -T app php artisan storage:link 2>/dev/null || echo "Storage link already exists"

echo ""
echo "⚡ Optimizing application..."
docker-compose -f docker-compose.production.yml exec -T app php artisan optimize

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   - Check logs: docker-compose -f docker-compose.production.yml logs -f"
echo "   - Run seeders (optional): docker-compose -f docker-compose.production.yml exec app php artisan db:seed --force"
echo "   - Access application at: http://localhost (or your configured port)"
echo ""
