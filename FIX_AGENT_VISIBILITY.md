# Fix: Agent Visibility Issue

## Problem
Agents were seeing ALL tickets instead of only tickets assigned to them or their team.

## Root Cause
The Agent role had the `tickets.assign` permission, which grants access to see ALL tickets in the visibility filter logic.

## Solution
Removed `tickets.assign` permission from the Agent role in `RolePermissionSeeder.php`.

## Changes Made

### 1. RolePermissionSeeder.php
- **Removed**: `'tickets.assign'` from Agent role permissions
- **Result**: Agents now only see tickets:
  - Assigned to them
  - Assigned to their team/department
  - They created (as requester)
  - They're watching

### 2. Permission Structure

**Before:**
- Agent: `tickets.view`, `tickets.create`, `tickets.edit`, `tickets.assign` ❌
- Manager: `tickets.view`, `tickets.create`, `tickets.edit`, `tickets.assign` ✅
- Admin: All permissions ✅

**After:**
- Agent: `tickets.view`, `tickets.create`, `tickets.edit` (NO `tickets.assign`) ✅
- Manager: `tickets.view`, `tickets.create`, `tickets.edit`, `tickets.assign` ✅
- Admin: All permissions ✅

## How to Apply the Fix

### Option 1: Update Existing Agent Role (Recommended)
Run this command to remove the permission from existing Agent roles:

```bash
php artisan tinker
```

Then run:
```php
$agentRole = \Spatie\Permission\Models\Role::where('name', 'Agent')->first();
$agentRole->revokePermissionTo('tickets.assign');
echo "Removed tickets.assign from Agent role\n";
```

### Option 2: Re-seed Roles (Will reset all role permissions)
```bash
php artisan db:seed --class=RolePermissionSeeder
```

**Warning**: This will reset ALL role permissions to defaults.

### Option 3: Manual Database Update
```sql
DELETE FROM role_has_permissions 
WHERE role_id = (SELECT id FROM roles WHERE name = 'Agent')
AND permission_id = (SELECT id FROM permissions WHERE name = 'tickets.assign');
```

## Verification

After applying the fix, verify:

1. **Agent should see:**
   - ✅ Tickets assigned to them
   - ✅ Tickets in their department
   - ✅ Tickets they created
   - ✅ Tickets they're watching
   - ❌ Tickets in other departments (unless watching)

2. **Manager/Admin should see:**
   - ✅ ALL tickets (they have `tickets.assign`)

## Testing

1. Login as an Agent user
2. Go to Tickets page
3. Verify you only see:
   - Your assigned tickets
   - Tickets in your department
   - Tickets you created
4. Verify you DON'T see tickets from other departments

## Notes

- The visibility filter logic in `SearchService::applyVisibilityFilters()` is correct
- The issue was the permission assignment, not the filter logic
- Agents can still edit and resolve tickets assigned to them
- Agents just can't see ALL tickets system-wide

