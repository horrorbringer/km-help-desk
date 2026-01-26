#!/bin/bash
# Script to create nginx config in Portainer volume
# Run this if you have terminal/SSH access

echo "🔧 Setting up nginx configuration..."

# Detect volume name (Portainer/Docker Compose adds stack prefix)
VOLUME_NAME=$(docker inspect km-help-desk-nginx 2>/dev/null | grep -oP '"Name": "\K[^"]*nginx-config[^"]*' | head -1)

if [ -z "$VOLUME_NAME" ]; then
    # Try default name
    VOLUME_NAME="km-help-desk-nginx-config"
    echo "⚠️  Could not detect volume name, trying: $VOLUME_NAME"
fi

# Check if volume exists
if ! docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
    echo "❌ Volume '$VOLUME_NAME' does not exist."
    echo "💡 Deploy your stack first, then run this script."
    echo "💡 Or specify volume name: $0 <volume-name>"
    exit 1
fi

echo "✅ Using volume: $VOLUME_NAME"

# Create nginx config
docker run --rm \
  -v "$VOLUME_NAME":/config \
  alpine:latest sh -c "cat > /config/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html/public;
    index index.php index.html;
    client_max_body_size 100M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass app:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    location /health {
        access_log off;
        return 200 \"healthy\n\";
        add_header Content-Type text/plain;
    }
}
EOF
echo '✅ Nginx config created successfully!'
ls -la /config/
cat /config/default.conf"

echo ""
echo "✅ Done! Now restart the nginx container in Portainer."
echo "📝 Steps:"
echo "   1. Go to Containers → km-help-desk-nginx"
echo "   2. Click 'Restart'"
echo "   3. Wait a few seconds"
echo "   4. Visit http://localhost:8080"

