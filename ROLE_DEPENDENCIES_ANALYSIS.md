# Role Dependencies Analysis

## ⚠️ CRITICAL: System Impact of Role Changes

This document identifies all hardcoded role names in the system and the potential impact of deleting or renaming roles.

---

## 🔴 Critical Roles (DO NOT DELETE)

### 1. **Super Admin**
**Impact if deleted:** System-wide access control will break

**Used in:**
- `app/Http/Controllers/Admin/RoleController.php:131` - Protected from deletion
- `app/Http/Controllers/Admin/SavedSearchController.php:65` - Can access all saved searches
- `app/Services/ApprovalWorkflowService.php:782` - Fallback approver
- `resources/js/hooks/use-permissions.ts:38,57,76` - Has all permissions
- `resources/js/pages/Admin/Roles/Index.tsx:90` - Protected in UI
- `resources/js/pages/Admin/Roles/Form.tsx:127,129,206` - Cannot be edited/deleted

**Risk Level:** 🔴 **CRITICAL** - System will break

---

## 🟠 High-Risk Roles (Major Impact)

### 2. **Line Manager**
**Impact if deleted/renamed:** Approval workflow will break

**Used in:**
- `app/Services/ApprovalWorkflowService.php:649,663,675` - Approval workflow logic
- `app/Http/Controllers/Admin/TicketController.php:1158` - Ticket creation permissions
- `app/Http/Requests/TicketRequest.php:93` - Ticket validation
- `resources/js/components/app-sidebar.tsx:84` - Sidebar visibility (DEPARTMENTS menu)

**Risk Level:** 🟠 **HIGH** - Approval system will fail

### 3. **Manager**
**Impact if deleted/renamed:** Multiple features will break

**Used in:**
- `app/Services/SearchService.php:216,227` - Ticket visibility filters
- `app/Http/Controllers/Admin/TicketController.php:1159,1595` - Ticket assignment logic
- `app/Services/ApprovalWorkflowService.php:649,663,675` - Approval workflow

**Risk Level:** 🟠 **HIGH** - Multiple features affected

### 4. **Agent / Senior Agent**
**Impact if deleted/renamed:** Ticket assignment and visibility will break

**Used in:**
- `app/Http/Controllers/Admin/TicketController.php:1126,1208,1583` - Agent filtering
- `app/Services/SearchService.php:216` - Ticket visibility

**Risk Level:** 🟠 **HIGH** - Core ticket functionality

### 5. **Head of Department**
**Impact if deleted/renamed:** HOD approval workflow will break

**Used in:**
- `app/Http/Controllers/Admin/TicketController.php:1157` - HOD check
- `app/Http/Requests/TicketRequest.php:92` - Ticket validation

**Risk Level:** 🟠 **HIGH** - Approval workflow

---

## 🟡 Medium-Risk Roles

### 6. **CEO, Director, Admin**
**Used in:**
- `app/Http/Controllers/Admin/UserController.php:44,78,88,363` - User management permissions
- `app/Http/Controllers/Admin/TicketController.php:1167,1170` - Executive permissions
- `app/Http/Requests/TicketRequest.php:102,105` - Ticket creation permissions

**Risk Level:** 🟡 **MEDIUM** - Some features may break

### 7. **Project Manager**
**Used in:**
- `app/Http/Controllers/Admin/TicketController.php:1172` - Project permissions
- `app/Http/Controllers/Admin/UserController.php:44,78,88,363` - User management
- `app/Http/Requests/TicketRequest.php:107` - Ticket validation

**Risk Level:** 🟡 **MEDIUM** - Project-related features

---

## 📋 Complete List of Hardcoded Roles

| Role Name | Files Affected | Risk Level |
|-----------|---------------|------------|
| Super Admin | 6 files | 🔴 CRITICAL |
| Line Manager | 4 files | 🟠 HIGH |
| Manager | 3 files | 🟠 HIGH |
| Agent | 3 files | 🟠 HIGH |
| Senior Agent | 2 files | 🟠 HIGH |
| Head of Department | 2 files | 🟠 HIGH |
| CEO | 3 files | 🟡 MEDIUM |
| Director | 3 files | 🟡 MEDIUM |
| Admin | 3 files | 🟡 MEDIUM |
| Project Manager | 3 files | 🟡 MEDIUM |

---

## 🛡️ Recommendations

### 1. **Create Role Constants**
Create a `RoleConstants` class to centralize role names:

```php
// app/Constants/RoleConstants.php
class RoleConstants {
    const SUPER_ADMIN = 'Super Admin';
    const LINE_MANAGER = 'Line Manager';
    const MANAGER = 'Manager';
    const AGENT = 'Agent';
    const SENIOR_AGENT = 'Senior Agent';
    const HOD = 'Head of Department';
    // ... etc
}
```

### 2. **Add Role Protection**
- Prevent deletion of critical roles in `RoleController`
- Add database constraints or soft-delete protection
- Add validation before role deletion

### 3. **Use Permissions Instead of Roles**
- Replace role checks with permission checks where possible
- Example: Instead of `hasRole('Manager')`, use `can('tickets.assign')`

### 4. **Add Role Migration Checks**
- Before deleting a role, check if any users have it
- Warn administrators about system impact
- Provide migration path (reassign users to new role)

### 5. **Document Role Dependencies**
- Keep this document updated
- Add comments in code referencing role dependencies
- Create unit tests that fail if critical roles are missing

---

## 🔧 Immediate Actions Needed

1. ✅ **FIXED:** Sidebar bug - Changed 'LM' to 'Line Manager' in `app-sidebar.tsx`
2. ⚠️ **TODO:** Add role deletion protection in `RoleController`
3. ⚠️ **TODO:** Create `RoleConstants` class
4. ⚠️ **TODO:** Add role dependency checks before deletion
5. ⚠️ **TODO:** Replace hardcoded role names with constants

---

## 📝 Notes

- **Frontend:** Uses string matching (`userRoles.includes('Line Manager')`) - fragile
- **Backend:** Uses Spatie Permission's `hasRole()` - more robust but still hardcoded
- **Database:** Roles are stored as strings, no foreign key constraints
- **Seeding:** Roles are created in `RolePermissionSeeder.php` - if roles are deleted, re-seeding will recreate them

---

## 🚨 Breaking Changes Scenarios

### Scenario 1: Delete "Line Manager" Role
- ❌ Approval workflow will fail (no Line Manager found)
- ❌ Departments menu may not show for some users
- ❌ Ticket creation validation may fail

### Scenario 2: Rename "Super Admin" to "System Admin"
- ❌ All permission checks will fail
- ❌ Role protection will not work
- ❌ Users will lose all permissions

### Scenario 3: Delete "Agent" Role
- ❌ Agent filtering in ticket assignment will break
- ❌ Ticket visibility filters will fail
- ❌ Form options may not load correctly

---

**Last Updated:** 2025-01-XX
**Status:** ✅ **IMPLEMENTED** - Role constants created and hardcoded strings replaced

---

## ✅ Implementation Status

### Completed:
1. ✅ **RoleConstants class created** (`app/Constants/RoleConstants.php`)
   - All role names centralized
   - Helper methods for role groups
   - Protection checking methods

2. ✅ **Frontend constants created** (`resources/js/constants/roles.ts`)
   - TypeScript constants for all roles
   - Helper functions for role checking

3. ✅ **Backend files updated to use constants:**
   - ✅ `RoleController.php` - Uses `RoleConstants::isProtected()`
   - ✅ `TicketController.php` - All hardcoded roles replaced
   - ✅ `TicketRequest.php` - All hardcoded roles replaced
   - ✅ `UserController.php` - All hardcoded roles replaced
   - ✅ `SearchService.php` - All hardcoded roles replaced
   - ✅ `ApprovalWorkflowService.php` - All hardcoded roles replaced
   - ✅ `SavedSearchController.php` - Uses `RoleConstants::SUPER_ADMIN`

4. ✅ **Frontend files updated:**
   - ✅ `app-sidebar.tsx` - Uses `LINE_MANAGER` constant
   - ✅ `use-permissions.ts` - Uses `SUPER_ADMIN` constant
   - ⚠️ `Roles/Index.tsx` - TODO: Replace hardcoded 'Super Admin' string
   - ⚠️ `Roles/Form.tsx` - TODO: Replace hardcoded 'Super Admin' string

5. ✅ **Unit tests created** (`tests/Unit/RoleConstantsTest.php`)
   - Tests critical roles exist
   - Tests protection logic
   - Tests role constant validity

### Remaining TODOs:
- ⚠️ Replace remaining hardcoded 'Super Admin' strings in frontend role forms
- ⚠️ Consider adding database constraints to prevent role deletion
- ⚠️ Add integration tests for role-based functionality

### Benefits:
- ✅ Single source of truth for role names
- ✅ Type safety (TypeScript constants)
- ✅ Easier refactoring (change in one place)
- ✅ Protection against accidental role deletion/renaming
- ✅ Unit tests catch missing roles early

