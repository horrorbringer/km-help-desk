#!/bin/bash
set -e

# Configuration
DOCKER_USERNAME="vanny3333"
IMAGE_NAME="km-help-desk"
VERSION=${1:-latest}

echo "🔨 Building Docker image..."
echo "   Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

# Build with BuildKit for better performance
DOCKER_BUILDKIT=1 docker build \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
  .

echo ""
echo "✅ Build complete!"
echo ""
echo "📤 Pushing to Docker Hub..."

# Check if logged in
if ! docker info | grep -q "Username"; then
  echo "⚠️  Not logged in to Docker Hub. Please run: docker login"
  exit 1
fi

# Push both tags
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo ""
echo "✅ Build and push complete!"
echo ""
echo "📦 Image: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "📦 Latest: ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "🌐 View on Docker Hub: https://hub.docker.com/r/${DOCKER_USERNAME}/${IMAGE_NAME}"

