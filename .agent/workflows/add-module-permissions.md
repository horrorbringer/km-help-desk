---
description: How to add a new module with role-based permissions
---

# Adding a New Module with Permissions

This workflow guides you through adding a new module with full role-based permissions.

## Prerequisites
- The module has a controller in `app/Http/Controllers/Admin/`
- The module has frontend pages in `resources/js/pages/Admin/`

---

## Step 1: Add Permissions to Config

Edit `config/roles.php` and add your module to `permissions_map`:

```php
'permissions_map' => [
    // ... existing modules
    'your-module' => ['view', 'create', 'edit', 'delete'],
],
```

**Common permission actions:**
- `view` - View list and details
- `create` - Create new records
- `edit` - Edit existing records
- `delete` - Delete records
- Custom actions like `export`, `import`, `approve`, etc.

---

## Step 2: Assign Permissions to Roles

In the same `config/roles.php`, add permissions to relevant roles in the `structure` section:

```php
'Super Admin' => [
    // ... already has ['*'] which includes all permissions
],

'IT Manager' => [
    'permissions' => [
        // ... existing
        'your-module.*',  // Wildcard for all your-module permissions
    ],
],

'Agent' => [
    'permissions' => [
        // ... existing
        'your-module.view',  // Only view permission
    ],
],
```

---

## Step 3: Add Route Middleware (Backend Authorization)

Edit `routes/web.php` and add permission middleware to your routes:

```php
// Your Module (with permission middleware)
// IMPORTANT: Put 'create' route BEFORE parameter routes to avoid conflicts
Route::middleware('permission:your-module.create')->group(function () {
    Route::get('your-module/create', [YourModuleController::class, 'create'])
        ->name('admin.your-module.create');
    Route::post('your-module', [YourModuleController::class, 'store'])
        ->name('admin.your-module.store');
});
Route::middleware('permission:your-module.view')->group(function () {
    Route::get('your-module', [YourModuleController::class, 'index'])
        ->name('admin.your-module.index');
    Route::get('your-module/{yourModule}', [YourModuleController::class, 'show'])
        ->name('admin.your-module.show');
});
Route::middleware('permission:your-module.edit')->group(function () {
    Route::get('your-module/{yourModule}/edit', [YourModuleController::class, 'edit'])
        ->name('admin.your-module.edit');
    Route::put('your-module/{yourModule}', [YourModuleController::class, 'update'])
        ->name('admin.your-module.update');
    Route::patch('your-module/{yourModule}', [YourModuleController::class, 'update']);
});
Route::middleware('permission:your-module.delete')->group(function () {
    Route::delete('your-module/{yourModule}', [YourModuleController::class, 'destroy'])
        ->name('admin.your-module.destroy');
});
```

---

## Step 4: Add Frontend Permission Config

Edit `resources/js/config/permissions.ts` and add your module:

```typescript
'your-module': {
    id: 'your-module',
    view: { permission: 'your-module.view' },
    create: { permission: 'your-module.create' },
    edit: { permission: 'your-module.edit' },
    delete: { permission: 'your-module.delete' },
    custom: {
        // Add custom actions if needed
        export: { permission: 'your-module.export' },
    },
},
```

---

## Step 5: Use Permissions in Frontend Components

In your React/TSX page, use the `useModulePermissions` hook:

```tsx
import { useModulePermissions } from '@/hooks/use-module-permissions';

export default function YourModuleIndex() {
    const { canView, canCreate, canEdit, canDelete, canCustom } = useModulePermissions('your-module');

    return (
        <>
            {canCreate && (
                <Link href={route('admin.your-module.create')}>
                    <Button>Create New</Button>
                </Link>
            )}

            {canEdit && (
                <Button onClick={handleEdit}>Edit</Button>
            )}

            {canDelete && (
                <Button onClick={handleDelete}>Delete</Button>
            )}

            {canCustom('export') && (
                <Button onClick={handleExport}>Export</Button>
            )}
        </>
    );
}
```

---

## Step 6: Add to Navigation (Optional)

Edit `resources/js/config/navigation.ts` to add your module to the sidebar:

```typescript
{
    id: 'your-module',
    title: 'Your Module',
    routeName: 'admin.your-module.index',
    icon: YourIcon,
    permission: 'your-module.view',
},
```

---

## Step 7: Run the Seeder

// turbo
```bash
php artisan db:seed --class=RolePermissionSeeder
```

This creates the permissions and syncs them to roles.

---

## Step 8: Clear Caches

// turbo
```bash
php artisan permission:cache-reset && php artisan config:clear && php artisan route:clear
```

---

## Quick Checklist

| Step | File | Action |
|------|------|--------|
| 1 | `config/roles.php` | Add to `permissions_map` |
| 2 | `config/roles.php` | Assign to roles in `structure` |
| 3 | `routes/web.php` | Add route middleware |
| 4 | `resources/js/config/permissions.ts` | Add frontend config |
| 5 | Your page component | Use `useModulePermissions` hook |
| 6 | `resources/js/config/navigation.ts` | Add to sidebar (optional) |
| 7 | Terminal | Run `RolePermissionSeeder` |
| 8 | Terminal | Clear caches |

---

## Example: Adding "Inventory" Module

1. **config/roles.php**:
   ```php
   'inventory' => ['view', 'create', 'edit', 'delete', 'export'],
   ```

2. **routes/web.php**: Add middleware-protected routes

3. **permissions.ts**:
   ```typescript
   'inventory': {
       id: 'inventory',
       view: { permission: 'inventory.view' },
       create: { permission: 'inventory.create' },
       edit: { permission: 'inventory.edit' },
       delete: { permission: 'inventory.delete' },
       custom: {
           export: { permission: 'inventory.export' },
       },
   },
   ```

4. **Run seeder**: `php artisan db:seed --class=RolePermissionSeeder`

5. **Clear cache**: `php artisan permission:cache-reset`

Done! 🎉
