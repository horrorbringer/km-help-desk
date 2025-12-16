FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    nodejs \
    npm \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Copy application files (as root first)
COPY . /var/www/html

# Set proper ownership
RUN chown -R www-data:www-data /var/www/html

# Install PHP dependencies (as root, but files owned by www-data)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Install Node dependencies and build assets (as root)
# Fix npm cache permissions by using a temp cache location and cleaning up
RUN npm ci --cache /tmp/.npm --prefer-offline --no-audit && \
    npm run build && \
    rm -rf /tmp/.npm && \
    rm -rf /var/www/.npm 2>/dev/null || true

# Set proper permissions for storage and cache
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Expose port 9000 for PHP-FPM
EXPOSE 9000

# Start PHP-FPM
CMD ["php-fpm"]
