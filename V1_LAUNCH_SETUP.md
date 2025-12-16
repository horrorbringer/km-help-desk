# V1 Launch Setup - IT Employee Request System

## 🎯 System Focus: Employee Request Tickets → IT Issues

**V1 Goal:** Employees can request IT fixes (computer, printer) with proper approval workflow.

---

## ✅ What's Been Set Up

### 1. **Roles Structure** ✅

**HOD/DHOD Hierarchy:**
- `Head of Department` (Level 7) - Primary
- `Deputy Head of Department` (Level 6.5) - Fallback when HOD unavailable

**LM/DLM Hierarchy:**
- `Line Manager` (Level 5) - Primary
- `Deputy Line Manager` (Level 4.5) - Fallback when LM unavailable

**Fallback Logic:**
- System tries HOD first, then DHOD if HOD not available
- System tries LM first, then DLM if LM not available

---

### 2. **Workflow Template** ✅

**Template:** "IT Hardware Issue Workflow"

**Steps:**
1. **Notification** → HOD receives informational notification (no approval needed)
2. **Approval** → LM/DLM approves the ticket
3. **Routing** → Ticket routes to IT team
4. **Assignment** → Ticket assigned to LM/DLM who approved

**Location:** Seeded via `WorkflowTemplateSeeder`

---

### 3. **Ticket Templates** ✅

**Seeded Templates:**
1. **Computer Fix Request** - For computer issues
2. **Printer Fix Request** - For printer issues
3. **Hardware Issue Report** - General hardware issues
4. **Network/VPN Issue** - Network connectivity
5. **Application Access** - Software access requests
6. **Password Reset Request** - Password resets
7. **General IT Support** - Miscellaneous IT requests

**Location:** `TicketTemplateSeeder`

---

## 🔄 Workflow Scenario

### Employee Requests Computer/Printer Fix

**Step-by-Step Flow:**

1. **Employee Creates Ticket**
   - Selects "Computer Fix Request" or "Printer Fix Request" template
   - Fills in details
   - Submits ticket

2. **HOD Notification** (Informational Only)
   - HOD receives notification: "New Ticket: TKT-XXX"
   - **No approval required** - just informational
   - HOD is aware but doesn't need to act

3. **LM/DLM Approval**
   - System finds LM in employee's department
   - If LM unavailable → Finds DLM (fallback)
   - LM/DLM receives approval request
   - LM/DLM approves or rejects

4. **After Approval → Route to IT**
   - Ticket routes to IT team (category's default team)
   - Status changes to "assigned"

5. **Assign to LM/DLM**
   - Ticket assigned to the LM/DLM who approved
   - LM/DLM receives the ticket in their queue
   - LM/DLM can now work on the ticket

---

## 📋 Database Setup

### Run Migrations & Seeders

```bash
# Fresh setup
php artisan migrate:fresh --seed

# Or just seed roles and templates
php artisan db:seed --class=RolePermissionSeeder
php artisan db:seed --class=WorkflowTemplateSeeder
php artisan db:seed --class=TicketTemplateSeeder
```

### What Gets Created:

1. **Roles:**
   - Head of Department
   - Deputy Head of Department
   - Line Manager
   - Deputy Line Manager
   - (All other existing roles)

2. **Workflow Template:**
   - "IT Hardware Issue Workflow"
   - Applies to "Hardware Issues" category
   - Active and ready to use

3. **Ticket Templates:**
   - Computer Fix Request
   - Printer Fix Request
   - (Other IT templates)

---

## 🎯 How to Test

### 1. Assign Roles to Users

**Assign HOD:**
```php
$user = User::find(1);
$user->assignRole('Head of Department');
$user->department_id = 1; // Set department
```

**Assign DHOD:**
```php
$user = User::find(2);
$user->assignRole('Deputy Head of Department');
$user->department_id = 1;
```

**Assign LM:**
```php
$user = User::find(3);
$user->assignRole('Line Manager');
$user->department_id = 1;
```

**Assign DLM:**
```php
$user = User::find(4);
$user->assignRole('Deputy Line Manager');
$user->department_id = 1;
```

### 2. Create Test Ticket

1. Login as employee
2. Go to "Create Ticket"
3. Select "Computer Fix Request" template
4. Fill in details
5. Submit

### 3. Verify Workflow

1. **Check HOD Notification:**
   - HOD should receive notification (informational)
   - No approval request created

2. **Check LM Approval:**
   - LM should receive approval request
   - Approve the ticket

3. **Check Routing:**
   - Ticket should route to IT team
   - Status should be "assigned"

4. **Check Assignment:**
   - Ticket should be assigned to LM who approved
   - LM should see ticket in their queue

---

## 🔧 Configuration

### Category Setup

**Hardware Issues Category:**
- `requires_approval` = `true` (or use workflow template)
- `default_team_id` = IT Department ID
- Workflow template will override category settings

### Department Setup

**IT Department:**
- Code: `IT-SD` (or `IT`)
- Name: "IT Service Desk" (or similar)
- `is_support_team` = `true`

---

## 📝 Files Modified/Created

### Backend:
- ✅ `app/Constants/RoleConstants.php` - Added DHOD/DLM constants
- ✅ `database/seeders/RolePermissionSeeder.php` - Added DHOD/DLM roles
- ✅ `app/Services/ApprovalWorkflowService.php` - Added DHOD/DLM fallbacks
- ✅ `app/Services/WorkflowEngine.php` - Added notification & assignment steps
- ✅ `database/seeders/WorkflowTemplateSeeder.php` - Created IT workflow template
- ✅ `database/seeders/TicketTemplateSeeder.php` - Added computer/printer templates
- ✅ `database/seeders/DatabaseSeeder.php` - Added WorkflowTemplateSeeder

### Frontend:
- ✅ `resources/js/constants/roles.ts` - Added DHOD/DLM constants
- ✅ `resources/js/components/app-sidebar.tsx` - Added Workflow Templates link

---

## 🚀 Ready for V1 Launch!

**System is configured for:**
- ✅ Employee IT requests
- ✅ HOD notification (informational)
- ✅ LM/DLM approval with fallbacks
- ✅ Automatic routing to IT team
- ✅ Assignment to approver

**Next Steps:**
1. Run migrations and seeders
2. Assign roles to users
3. Test the workflow
4. Launch! 🎉
