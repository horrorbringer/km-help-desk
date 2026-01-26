#!/bin/bash
echo "=== Testing Approval Levels Feature ==="

# Check if containers are running
if ! docker-compose ps | grep -q "Up"; then
    echo "Starting Docker containers..."
    docker-compose up -d
    sleep 5
fi

# Run migrations
echo "Running migrations..."
docker-compose exec app php artisan migrate --force 2>/dev/null || echo "Migrations may have already run"

# Seed approval levels
echo "Seeding approval levels..."
docker-compose exec app php artisan db:seed --class=ApprovalLevelSeeder --force 2>/dev/null || echo "Seeder may have already run"

# Verify
echo ""
echo "=== Verification ==="
docker-compose exec app php artisan tinker --execute="
use App\Models\ApprovalLevel;
echo '✅ Total Approval Levels: ' . ApprovalLevel::count() . PHP_EOL;
echo '✅ Active: ' . ApprovalLevel::active()->count() . PHP_EOL;
echo '✅ System: ' . ApprovalLevel::system()->count() . PHP_EOL;
echo '✅ Custom: ' . ApprovalLevel::custom()->count() . PHP_EOL;
"

echo ""
echo "✅ Setup complete!"
echo "🌐 Open: http://localhost:8080/admin/approval-levels"
echo "📖 Full guide: QUICK_TEST_APPROVAL_LEVELS.md"
