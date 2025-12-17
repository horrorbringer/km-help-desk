# Docker Build Fix - npm Permission Error

## ✅ Fixed: npm EACCES Permission Error

The issue was that npm was trying to write to `/var/www/.npm` but didn't have permission when running as `www-data` user.

## 🔧 Solution Applied

The Dockerfile has been updated to:
1. Run npm commands as **root** (not www-data)
2. Use a temporary cache location (`/tmp/.npm`)
3. Clean up npm cache after build
4. Remove any existing problematic cache directories

## 🚀 Rebuild Your Images

After the fix, rebuild your Docker images:

```bash
# Stop existing containers
docker-compose down

# Rebuild without cache (to ensure clean build)
docker-compose build --no-cache

# Start services
docker-compose up -d
```

## 📝 What Changed

**Before (Problematic):**
```dockerfile
USER www-data
RUN npm ci && npm run build  # ❌ Permission error
```

**After (Fixed):**
```dockerfile
# Stay as root
RUN npm ci --cache /tmp/.npm --prefer-offline --no-audit && \
    npm run build && \
    rm -rf /tmp/.npm && \
    rm -rf /var/www/.npm 2>/dev/null || true  # ✅ Works as root
```

## ✅ Verification

After rebuild, check that:
1. Build completes without errors
2. All containers start successfully
3. Application is accessible at `http://localhost:8080`

## 🆘 If Still Having Issues

If you still get permission errors:

```bash
# Clean everything and rebuild
docker-compose down -v
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

**The fix is already in your Dockerfile. Just rebuild! 🚀**
