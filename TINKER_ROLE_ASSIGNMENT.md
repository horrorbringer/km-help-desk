# Assign Super Admin Role via Laravel Tinker

## Quick Commands

### Method 1: Assign to Existing User by Email

```bash
php artisan tinker
```

Then run:
```php
// Find user by email
$user = \App\Models\User::where('email', 'your-email@example.com')->first();

// Assign Super Admin role
$user->assignRole('Super Admin');

// Verify assignment
$user->hasRole('Super Admin'); // Should return true
$user->roles; // View all roles
```

### Method 2: Assign to Existing User by ID

```php
// Find user by ID
$user = \App\Models\User::find(1);

// Assign Super Admin role
$user->assignRole('Super Admin');

// Verify
$user->refresh();
$user->hasRole('Super Admin');
```

### Method 3: Create User and Assign Role in One Go

```php
// Create new user with Super Admin role
$user = \App\Models\User::create([
    'name' => 'Super Admin',
    'email' => 'admin@example.com',
    'password' => \Illuminate\Support\Facades\Hash::make('your-secure-password'),
    'email_verified_at' => now(),
    'is_active' => true,
]);

// Assign Super Admin role
$user->assignRole('Super Admin');

// Verify
$user->hasRole('Super Admin');
```

### Method 4: Replace All Roles (Sync)

```php
$user = \App\Models\User::where('email', 'your-email@example.com')->first();

// Remove all existing roles and assign only Super Admin
$user->syncRoles(['Super Admin']);

// Verify
$user->roles->pluck('name');
```

## Useful Verification Commands

```php
// Check if user has Super Admin role
$user->hasRole('Super Admin');

// Check if user has any of multiple roles
$user->hasAnyRole(['Super Admin', 'Manager']);

// View all user roles
$user->roles->pluck('name');

// View all user permissions (Super Admin has all)
$user->getAllPermissions()->pluck('name');

// Check specific permission
$user->can('tickets.view');

// View user with roles
$user->load('roles');
$user->toArray();
```

## List All Available Roles

```php
// View all roles in the system
\Spatie\Permission\Models\Role::all()->pluck('name');

// Find Super Admin role
$superAdminRole = \Spatie\Permission\Models\Role::where('name', 'Super Admin')->first();
$superAdminRole->permissions->count(); // Should show all permissions
```

## Remove Super Admin Role

```php
$user = \App\Models\User::where('email', 'your-email@example.com')->first();

// Remove Super Admin role
$user->removeRole('Super Admin');

// Verify removal
$user->hasRole('Super Admin'); // Should return false
```

## Complete Example: Setup First Super Admin

```php
// Step 1: Ensure Super Admin role exists (if not seeded)
$role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Super Admin']);

// Step 2: Give all permissions to Super Admin role (if not already done)
$role->givePermissionTo(\Spatie\Permission\Models\Permission::all());

// Step 3: Find or create user
$user = \App\Models\User::firstOrCreate(
    ['email' => 'admin@example.com'],
    [
        'name' => 'Super Administrator',
        'password' => \Illuminate\Support\Facades\Hash::make('SecurePassword123!'),
        'email_verified_at' => now(),
        'is_active' => true,
    ]
);

// Step 4: Assign Super Admin role
$user->assignRole('Super Admin');

// Step 5: Verify everything
$user->refresh();
echo "User: " . $user->name . "\n";
echo "Email: " . $user->email . "\n";
echo "Has Super Admin: " . ($user->hasRole('Super Admin') ? 'Yes' : 'No') . "\n";
echo "Permissions: " . $user->getAllPermissions()->count() . "\n";
```

## Troubleshooting

### Clear Permission Cache
If roles/permissions aren't working, clear the cache:

```php
app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
```

Or via command:
```bash
php artisan permission:cache-reset
```

### Check User Model
Ensure User model uses HasRoles trait:
```php
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    // ...
}
```

## One-Liner Commands

```php
// Quick assign by email
\App\Models\User::where('email', 'admin@example.com')->first()->assignRole('Super Admin');

// Quick check
\App\Models\User::where('email', 'admin@example.com')->first()->hasRole('Super Admin');

// List all Super Admins
\App\Models\User::role('Super Admin')->get(['id', 'name', 'email']);
```

