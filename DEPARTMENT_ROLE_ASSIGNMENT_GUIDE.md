# Department Role Assignment Guide

## 🎯 Quick Start: Assigning Roles to Users

This guide shows you how to assign roles to users for each department, with a focus on IT Department for V1 launch.

---

## 📋 IT Department Structure (V1 Focus)

### Required Roles for IT Department:

```php
// In UserSeeder.php or via Admin UI:

// 1. Head of Department (HOD)
User: Sokuntha
Role: "Head of Department"
Department: IT Service Desk (IT-SD)
→ Receives notifications for IT tickets

// 2. Deputy Head of Department (DHOD) - RECOMMENDED
User: IT Deputy HOD
Role: "Deputy Head of Department"
Department: IT Service Desk (IT-SD)
→ Acts as backup when HOD is unavailable

// 3. Line Manager (LM) - REQUIRED for approval
User: IT Line Manager
Role: "Line Manager"
Department: IT Service Desk (IT-SD)
→ Approves IT tickets in workflow

// 4. Deputy Line Manager (DLM) - RECOMMENDED
User: IT Deputy LM
Role: "Deputy Line Manager"
Department: IT Service Desk (IT-SD)
→ Acts as backup when LM is unavailable

// 5. IT Manager (Optional - can be same as HOD)
User: IT Manager
Role: "IT Manager"
Department: IT Service Desk (IT-SD)
→ Department-specific management

// 6. IT Administrator
User: IT Administrator
Role: "IT Administrator"
Department: IT Service Desk (IT-SD)
→ Technical staff

// 7. Senior Agents
User: Senior Agent
Role: "Senior Agent"
Department: IT Service Desk (IT-SD)
→ Support staff

// 8. Agents
User: Sokha, Sunwukhong
Role: "Agent"
Department: IT Service Desk (IT-SD)
→ Support staff

// 9. Requesters (All other IT employees)
User: Chanthou, etc.
Role: "Requester"
Department: IT Service Desk (IT-SD)
→ Regular employees who create tickets
```

---

## 🔧 How to Assign Roles

### Method 1: Via Admin UI (Recommended)

1. Go to **Users** → **Create User** or **Edit User**
2. Fill in user details:
   - Name
   - Email
   - Employee ID
   - Phone
   - **Department** (select from dropdown)
3. **Assign Role(s)**:
   - Select role(s) from the roles list
   - User can have multiple roles if needed
4. Save

### Method 2: Via UserSeeder (For Initial Setup)

The `UserSeeder.php` file contains examples. Update it with your actual users:

```php
[
    'name' => 'John Doe',
    'email' => 'john.doe@kimmix.com',
    'department_code' => 'IT-SD',  // Must match Department code
    'employee_id' => 'EMP-1234',
    'phone' => '+855 12 345 678',
    'role_key' => 'hod',  // See role_key mappings below
],
```

**Available role_key values:**
- `super_admin` → Super Admin
- `ceo` → CEO
- `director` → Director
- `hod` → Head of Department
- `dhod` → Deputy Head of Department
- `line_manager` → Line Manager
- `dlm` → Deputy Line Manager
- `it_manager` → IT Manager
- `operations_manager` → Operations Manager
- `finance_manager` → Finance Manager
- `hr_manager` → HR Manager
- `procurement_manager` → Procurement Manager
- `safety_manager` → Safety Manager
- `project_manager` → Project Manager
- `it_administrator` → IT Administrator
- `senior_agent` → Senior Agent
- `agent` → Agent
- `requester` → Requester
- `contractor` → Contractor

### Method 3: Via Database (Advanced)

```sql
-- Find user ID
SELECT id, name, email FROM users WHERE email = 'john.doe@kimmix.com';

-- Find role ID
SELECT id, name FROM roles WHERE name = 'Head of Department';

-- Assign role (using Spatie Permission)
-- Note: This requires using Laravel's model syncRoles() method
-- Better to use Admin UI or Seeder
```

---

## 📊 Department Role Checklist

### For IT Department (V1 Launch):

- [ ] **HOD** - 1 person assigned
- [ ] **DHOD** - 1 person assigned (recommended)
- [ ] **LM** - 1-2 people assigned (REQUIRED for workflow)
- [ ] **DLM** - 1-2 people assigned (recommended)
- [ ] **IT Manager** - 1 person assigned (optional)
- [ ] **IT Administrator** - 1-3 people assigned
- [ ] **Senior Agent** - 2-5 people assigned
- [ ] **Agent** - 3-10 people assigned
- [ ] **Requester** - All other IT employees

### For Other Departments:

- [ ] **HOD** - 1 person assigned
- [ ] **DHOD** - 1 person assigned (optional but recommended)
- [ ] **LM** - 1-2 people assigned
- [ ] **DLM** - 1-2 people assigned (optional but recommended)
- [ ] **Department Manager** - 1 person assigned (if applicable)
- [ ] **Requester** - All other employees

---

## 🎯 Workflow Example: IT Ticket Flow

### Current Setup (from UserSeeder):

```
1. Employee (Requester) creates ticket
   → User: Chanthou (Requester, IT-SD)

2. HOD receives notification (notification only)
   → User: Sokuntha (HOD, IT-SD)
   → If unavailable: IT Deputy HOD (DHOD, IT-SD)

3. LM approves ticket
   → User: IT Line Manager (LM, IT-SD)
   → If unavailable: IT Deputy LM (DLM, IT-SD)

4. Ticket routes to IT team
   → Assigned to IT Service Desk department

5. LM/DLM receives ticket (assignment notification)
   → User: IT Line Manager or IT Deputy LM
```

---

## ✅ Verification Steps

After assigning roles, verify:

1. **Check User Department Assignment:**
   ```php
   // In Laravel Tinker or check Admin UI
   $user = User::where('email', 'kmhodsokun@outlook.com')->first();
   echo $user->department->name; // Should show "IT Service Desk"
   ```

2. **Check User Roles:**
   ```php
   $user = User::where('email', 'kmhodsokun@outlook.com')->first();
   $user->roles->pluck('name'); // Should show ["Head of Department"]
   ```

3. **Test Workflow:**
   - Create a test ticket as a Requester
   - Verify HOD receives notification
   - Verify LM can approve
   - Verify ticket routes to IT team

---

## 🔄 Updating Existing Users

### To Add a Role:
1. Go to **Users** → **Edit User**
2. Check additional role(s) in the roles list
3. Save

### To Change Department:
1. Go to **Users** → **Edit User**
2. Change **Department** dropdown
3. Save

### To Remove a Role:
1. Go to **Users** → **Edit User**
2. Uncheck the role
3. Save

---

## 📝 Example: Complete IT Department Setup

```php
// In UserSeeder.php or Admin UI:

// Leadership
[
    'name' => 'Sokuntha',
    'email' => 'kmhodsokun@outlook.com',
    'department_code' => 'IT-SD',
    'role_key' => 'hod',  // HOD
],
[
    'name' => 'IT Deputy HOD',
    'email' => 'it.dhod@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'dhod',  // DHOD (backup)
],
[
    'name' => 'IT Line Manager',
    'email' => 'it.lm@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'line_manager',  // LM (approves)
],
[
    'name' => 'IT Deputy LM',
    'email' => 'it.dlm@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'dlm',  // DLM (backup)
],

// Management
[
    'name' => 'IT Manager',
    'email' => 'it.manager@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'it_manager',
],

// Technical Staff
[
    'name' => 'IT Administrator',
    'email' => 'it.admin@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'it_administrator',
],
[
    'name' => 'Senior Agent',
    'email' => 'senior.agent@kimmix.com',
    'department_code' => 'IT-SD',
    'role_key' => 'senior_agent',
],

// Support Staff
[
    'name' => 'Sokha',
    'email' => 'sokha6338@outlook.com',
    'department_code' => 'IT-SD',
    'role_key' => 'agent',
],
[
    'name' => 'Sunwukhong',
    'email' => 'sunwukhongking@gmail.com',
    'department_code' => 'IT-SD',
    'role_key' => 'agent',
],

// Employees (Requesters)
[
    'name' => 'Chanthou',
    'email' => 'chanthou121@outlook.com',
    'department_code' => 'IT-SD',
    'role_key' => 'requester',
],
```

---

## 🚨 Important Notes

1. **Department Code Must Match:**
   - Use exact department code from `DepartmentSeeder.php`
   - IT Department code: `IT-SD`
   - Other codes: `FIELD-ENG`, `PROC`, `HSE`, `FIN`, `HR`, `FACILITIES`

2. **One User Can Have Multiple Roles:**
   - Example: Same person can be both HOD and IT Manager
   - Just assign both roles in Admin UI

3. **Department Assignment is Critical:**
   - The system finds HOD/LM **within the department**
   - If user has wrong department, workflow won't work correctly

4. **Fallback Logic:**
   - If HOD unavailable → System uses DHOD
   - If LM unavailable → System uses DLM
   - Make sure backups are assigned!

5. **For V1 Launch:**
   - **Minimum**: HOD + LM for IT Department
   - **Recommended**: HOD + DHOD + LM + DLM for IT Department
   - This ensures workflow works even if someone is unavailable

---

## 🎯 Quick Reference: Department Codes

From `DepartmentSeeder.php`:

- `IT-SD` → IT Service Desk
- `FIELD-ENG` → Field Engineering
- `PROC` → Procurement
- `HSE` → Health & Safety
- `FIN` → Finance & Accounts
- `HR` → Human Resources
- `FACILITIES` → Facilities & Maintenance

---

## ✅ Next Steps

1. **Update UserSeeder** with your actual users
2. **Run seeder**: `php artisan db:seed --class=UserSeeder`
3. **Or use Admin UI** to assign roles manually
4. **Verify** by checking Users list
5. **Test workflow** by creating a test ticket

---

## 📞 Need Help?

- Check `DEPARTMENT_ROLES_GUIDE.md` for role structure details
- Check `V1_LAUNCH_SETUP.md` for V1 launch checklist
- Check `UserSeeder.php` for code examples
