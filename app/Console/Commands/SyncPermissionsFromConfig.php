<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class SyncPermissionsFromConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permissions:sync {--dry-run : Show what would be created without actually creating}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync permissions from config/roles.php permissions_map to database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $config = config('roles');

        if (!$config || !isset($config['permissions_map'])) {
            $this->error('Config file config/roles.php not found or permissions_map is missing!');

            return self::FAILURE;
        }

        $isDryRun = $this->option('dry-run');

        if (!$isDryRun) {
            // Reset cached permissions
            app()[PermissionRegistrar::class]->forgetCachedPermissions();
        }

        $this->info('');
        $this->info('📦 Syncing permissions from config/roles.php...');
        $this->info('');

        $permissionsMap = $config['permissions_map'];
        $created = 0;
        $existing = 0;
        $allPermissions = [];

        foreach ($permissionsMap as $group => $actions) {
            $this->line("  📁 <comment>{$group}</comment>");

            foreach ($actions as $action) {
                $permissionName = "{$group}.{$action}";
                $allPermissions[] = $permissionName;

                if ($isDryRun) {
                    $exists = Permission::where('name', $permissionName)->exists();
                    if ($exists) {
                        $this->line("      <fg=gray>✓ {$permissionName} (exists)</>");
                        $existing++;
                    } else {
                        $this->line("      <fg=green>+ {$permissionName} (would create)</>");
                        $created++;
                    }
                } else {
                    $permission = Permission::firstOrCreate(['name' => $permissionName]);
                    if ($permission->wasRecentlyCreated) {
                        $this->line("      <fg=green>+ {$permissionName} (created)</>");
                        $created++;
                    } else {
                        $this->line("      <fg=gray>✓ {$permissionName} (exists)</>");
                        $existing++;
                    }
                }
            }
        }

        $this->info('');
        $this->info('─────────────────────────────────────────');
        $this->info('');

        if ($isDryRun) {
            $this->info("  🏃 <fg=yellow>DRY RUN</> - No changes made");
            $this->info("  📊 Would create: <fg=green>{$created}</> permission(s)");
            $this->info("  📊 Already exist: <fg=gray>{$existing}</> permission(s)");
        } else {
            $this->info("  ✅ Created: <fg=green>{$created}</> new permission(s)");
            $this->info("  📚 Existing: <fg=gray>{$existing}</> permission(s)");
        }

        $total = count($allPermissions);
        $this->info("  📦 Total: <fg=white>{$total}</> permission(s)");
        $this->info('');

        // Show orphaned permissions (in DB but not in config)
        $dbPermissions = Permission::pluck('name')->toArray();
        $orphaned = array_diff($dbPermissions, $allPermissions);

        if (count($orphaned) > 0) {
            $this->warn('  ⚠️  Orphaned permissions (in DB but not in config):');
            foreach ($orphaned as $permission) {
                $this->line("      <fg=yellow>- {$permission}</>");
            }
            $this->info('');
            $this->info('  Run with --prune flag to remove orphaned permissions');
        }

        return self::SUCCESS;
    }
}
