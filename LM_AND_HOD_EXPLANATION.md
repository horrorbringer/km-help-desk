# LM and HOD Explained

This document explains who **LM (Line Manager)** and **HOD (Head of Department)** are in the ticket approval workflow system.

---

## 📋 Table of Contents
1. [What is LM (Line Manager)?](#what-is-lm-line-manager)
2. [What is HOD (Head of Department)?](#what-is-hod-head-of-department)
3. [How They Are Identified](#how-they-are-identified)
4. [Approval Workflow](#approval-workflow)
5. [Real-World Examples](#real-world-examples)

---

## 🎯 What is LM (Line Manager)?

**Line Manager (LM)** is the **first-level manager** who directly supervises the employee (requester) who creates a ticket. They are responsible for **first-level approval** of tickets submitted by their team members.

### Characteristics:
- **Role**: First-level supervisor/manager
- **Responsibility**: Approve or reject tickets from their direct reports
- **Level**: Department/Team level
- **Typical Roles**: `Manager`, `Line Manager`, or `Super Admin` (as fallback)

### Who Can Be LM?
Based on the system logic, an LM is identified by having one of these roles:
- ✅ **Manager** - General manager role
- ✅ **Line Manager** - Specific line manager role
- ✅ **Super Admin** - Only used as a fallback if no manager is found

---

## 👔 What is HOD (Head of Department)?

**Head of Department (HOD)** is a **senior executive** who oversees an entire department or division. They provide **second-level approval** for high-priority, high-cost, or critical tickets that require department-level authorization.

### Characteristics:
- **Role**: Department head/executive
- **Responsibility**: Approve or reject high-value/critical tickets
- **Level**: Department/Division level
- **Typical Roles**: `Head of Department` or `HOD` role

### Who Can Be HOD?
Based on the system logic, an HOD is identified by having one of these roles:
- ✅ **Head of Department** - Primary HOD role
- ✅ **HOD** - Alternative HOD role name
- ⚠️ **Director** - Used as fallback if no HOD found
- ⚠️ **Super Admin** - Last resort if no HOD/Director found

---

## 🔍 How They Are Identified

### LM (Line Manager) Selection Logic

The system finds the Line Manager using this priority order:

```php
Priority 1: Requester's Department Manager
├─ Looks for Manager/Line Manager in the requester's department
└─ Example: If requester is in "Field Engineering", finds Field Engineering Manager

Priority 2: Assigned Team Manager
├─ Looks for Manager/Line Manager in the ticket's assigned team
└─ Example: If ticket is assigned to "IT Service Desk", finds IT Service Desk Manager

Priority 3: Fallback
└─ Finds first active Manager/Line Manager/Super Admin in the system
```

**Code Reference**: `app/Services/ApprovalWorkflowService.php` → `findLineManager()` method (lines 611-648)

### HOD (Head of Department) Selection Logic

The system finds the Head of Department using this priority order:

```php
Priority 1: Ticket's Assigned Team HOD
├─ Looks for HOD in the ticket's assigned team/department
└─ Example: If ticket is assigned to "IT Service Desk", finds IT Service Desk HOD

Priority 1.5: Category's Default Team HOD
├─ Looks for HOD in the category's default team (if ticket not yet assigned)
└─ Example: If category is "IT Support", finds HOD in IT Support's default team

Priority 2: Requester's Department HOD
├─ Looks for HOD in the requester's department
└─ Example: If requester is in "Field Engineering", finds Field Engineering HOD

Priority 3: Any HOD in System
├─ Finds any active Head of Department (any department)
└─ Example: Finds any HOD regardless of department

Priority 4: Director (Fallback)
└─ Uses Director role if no HOD found

Priority 5: Super Admin (Last Resort)
└─ Uses Super Admin only if no HOD/Director found
```

**Code Reference**: `app/Services/ApprovalWorkflowService.php` → `findHOD()` method (lines 653-766)

---

## 🔄 Approval Workflow

### When is LM Approval Required?

LM approval is required when:
1. ✅ Category has `requires_approval = true`
2. ✅ Requester does NOT have `tickets.auto-approve` permission
3. ✅ Ticket is not a routine/low-priority ticket

### When is HOD Approval Required?

HOD approval is required when **ANY** of these conditions are met:

1. **Priority-Based**:
   - Priority is `high` or `critical`

2. **Cost-Based**:
   - Estimated cost exceeds category's `hod_approval_threshold`
   - Example: If threshold is $1,000 and ticket cost is $1,500 → HOD approval needed

3. **Category-Based**:
   - Category has `requires_hod_approval = true` (and no cost threshold set)

### Approval Flow Sequence

```
1. Ticket Created
   ↓
2. LM Approval Required? 
   ├─ NO → Route directly to team
   └─ YES → Create LM Approval Request
       ↓
3. Line Manager Reviews
   ├─ REJECT → Ticket cancelled, can resubmit (max 3 times)
   └─ APPROVE → Check if HOD approval needed
       ↓
4. HOD Approval Required?
   ├─ NO → Route to team (Status: ASSIGNED)
   └─ YES → Create HOD Approval Request
       ↓
5. Head of Department Reviews
   ├─ REJECT → Ticket cancelled, can resubmit (max 3 times)
   └─ APPROVE → Route to team (Status: ASSIGNED)
       ↓
6. Team Assigned → Agent Works → Ticket Resolved
```

---

## 💼 Real-World Examples

### Example 1: IT Hardware Request

**Scenario**: Employee requests a new laptop ($1,200)

**Flow**:
1. **Employee** creates ticket → Status: `pending`
2. **LM Approval**: Employee's Line Manager (e.g., Field Engineering Manager) approves
3. **HOD Approval**: Since cost ($1,200) > threshold ($1,000), HOD approval needed
4. **HOD**: Head of Department (e.g., IT HOD) approves
5. **Routing**: Ticket routed to IT Service Desk team
6. **Agent**: IT agent assigns ticket and fulfills request

**Who is LM?**: Field Engineering Manager (employee's direct manager)  
**Who is HOD?**: IT Department Head (department overseeing IT requests)

---

### Example 2: Routine IT Support Request

**Scenario**: Employee reports printer not working (no cost, low priority)

**Flow**:
1. **Employee** creates ticket → Status: `pending`
2. **LM Approval**: Employee's Line Manager approves
3. **HOD Approval**: NOT required (low priority, no cost)
4. **Routing**: Ticket routed directly to IT Service Desk after LM approval
5. **Agent**: IT agent fixes printer issue

**Who is LM?**: Employee's direct manager  
**Who is HOD?**: Not involved (routing happens after LM approval)

---

### Example 3: High-Priority Safety Equipment Request

**Scenario**: Safety team requests emergency safety equipment ($800, HIGH priority)

**Flow**:
1. **Safety Team** creates ticket → Status: `pending`
2. **LM Approval**: Safety Manager approves
3. **HOD Approval**: Required because priority is HIGH (even though cost < threshold)
4. **HOD**: Head of Department approves
5. **Routing**: Ticket routed to Procurement team
6. **Agent**: Procurement agent processes purchase

**Who is LM?**: Safety Manager  
**Who is HOD?**: Department Head (could be Operations HOD or Safety HOD)

---

## 📊 Summary Table

| Aspect | LM (Line Manager) | HOD (Head of Department) |
|--------|------------------|---------------------------|
| **Full Name** | Line Manager | Head of Department |
| **Level** | First-level supervisor | Department/Division head |
| **Approval Level** | First approval | Second approval (if needed) |
| **Typical Roles** | Manager, Line Manager | Head of Department, HOD |
| **When Required** | Most tickets (if category requires) | High priority, high cost, or critical tickets |
| **Selection Priority** | 1. Requester's dept manager<br>2. Assigned team manager<br>3. Any manager | 1. Assigned team HOD<br>2. Category team HOD<br>3. Requester's dept HOD<br>4. Any HOD<br>5. Director (fallback)<br>6. Super Admin (last resort) |
| **Can Reject?** | ✅ Yes | ✅ Yes |
| **Resubmission Limit** | Max 3 resubmissions | Max 3 resubmissions |

---

## 🔑 Key Points to Remember

1. **LM comes first**: Line Manager approval is always the first step (if required)
2. **HOD is conditional**: HOD approval is only needed for high-priority, high-cost, or critical tickets
3. **Department-based**: Both LM and HOD are typically found based on department/team relationships
4. **Fallback logic**: System has multiple fallback options to ensure approvals can always be assigned
5. **Resubmission limit**: Both LM and HOD can reject tickets, and rejected tickets can be resubmitted up to 3 times

---

## 📝 Code References

- **LM Finding Logic**: `app/Services/ApprovalWorkflowService.php` → `findLineManager()` (line 611)
- **HOD Finding Logic**: `app/Services/ApprovalWorkflowService.php` → `findHOD()` (line 653)
- **HOD Requirement Check**: `app/Services/ApprovalWorkflowService.php` → `requiresHODApproval()` (line 545)
- **Role Definitions**: `database/seeders/RolePermissionSeeder.php`
- **User Examples**: `database/seeders/UserSeeder.php`

---

## ❓ Common Questions

### Q: Can one person be both LM and HOD?
**A**: Yes, if a user has both roles assigned, they could theoretically be selected for both approvals, but this is rare in practice.

### Q: What happens if no LM is found?
**A**: The system falls back to finding any active Manager/Line Manager/Super Admin in the system.

### Q: What happens if no HOD is found?
**A**: The system tries Director role, then Super Admin as last resort. A warning is logged.

### Q: Can LM skip HOD approval?
**A**: No, LM cannot skip HOD approval. The system automatically checks if HOD approval is needed based on priority, cost, and category settings.

### Q: Can tickets bypass LM approval?
**A**: Yes, if:
- Category has `requires_approval = false`, OR
- Requester has `tickets.auto-approve` permission

---

---

## 🏢 Do LM and HOD Need to Be in Each Department?

### Short Answer: **NO, but it's RECOMMENDED**

The system has **fallback mechanisms** that allow it to work even if a department doesn't have its own LM or HOD. However, for proper organizational structure and workflow, it's **best practice** to have them in each department.

---

### LM (Line Manager) Requirements

**❌ NOT Required in Each Department**

The system will find an LM using fallbacks:

```
✅ Priority 1: Requester's Department Manager
   └─ If found → Use this LM
   
✅ Priority 2: Assigned Team Manager  
   └─ If found → Use this LM
   
✅ Priority 3: Fallback - ANY Manager in System
   └─ Uses first active Manager/Line Manager/Super Admin found
```

**Example Scenario:**
- **Field Engineering Department** has no Manager
- Employee from Field Engineering creates a ticket
- System tries to find Field Engineering Manager → **Not found**
- System tries Assigned Team Manager → **Not found**
- System falls back to **IT Manager** (any manager in system) → **Uses this**

**⚠️ Warning**: A warning is logged if no LM is found in the requester's department, but the system continues with fallback.

---

### HOD (Head of Department) Requirements

**❌ NOT Required in Each Department**

The system will find an HOD using multiple fallbacks:

```
✅ Priority 1: Assigned Team HOD
   └─ If found → Use this HOD
   
✅ Priority 1.5: Category Default Team HOD
   └─ If found → Use this HOD
   
✅ Priority 2: Requester's Department HOD
   └─ If found → Use this HOD
   
✅ Priority 3: ANY HOD in System
   └─ Uses any active Head of Department found
   
✅ Priority 4: Director (Fallback)
   └─ Uses Director role if no HOD found
   
✅ Priority 5: Super Admin (Last Resort)
   └─ Uses Super Admin only if no HOD/Director found
```

**Example Scenario:**
- **Finance Department** has no HOD
- Finance employee creates high-priority ticket requiring HOD approval
- System tries Finance HOD → **Not found**
- System tries Category Team HOD → **Not found**
- System tries Requester's Department HOD → **Not found**
- System finds **IT HOD** (any HOD in system) → **Uses this**
- If no HOD found → Uses **Director**
- If no Director → Uses **Super Admin** (with warning logged)

**⚠️ Warning**: Warnings are logged when fallbacks are used, indicating that HOD users should be properly configured.

---

### Best Practice Recommendations

#### ✅ **Recommended Setup:**

1. **Each Department Should Have:**
   - ✅ At least **1 Line Manager** (Manager or Line Manager role)
   - ✅ At least **1 Head of Department** (HOD role) - for larger departments

2. **Small Departments Can Share:**
   - Small departments can share an HOD with related departments
   - Example: HR and Finance might share one HOD

3. **Minimum System Requirements:**
   - ✅ At least **1 Manager/Line Manager** in the entire system (for LM fallback)
   - ✅ At least **1 Head of Department** in the entire system (for HOD fallback)
   - ✅ At least **1 Director** or **1 Super Admin** (for final fallback)

#### ⚠️ **What Happens Without Department-Specific LM/HOD:**

**Without Department LM:**
- System uses fallback manager from another department
- Approval workflow still works
- ⚠️ May cause confusion (wrong manager approving)
- ⚠️ Warning logged in system logs

**Without Department HOD:**
- System uses HOD from another department
- Approval workflow still works
- ⚠️ May cause confusion (wrong HOD approving)
- ⚠️ Warning logged in system logs
- ⚠️ Super Admin used as last resort (not ideal)

---

### Real-World Example: Small Company Setup

**Scenario**: Small company with 3 departments

```
Department 1: IT Department
├─ Manager: IT Manager ✅
└─ HOD: IT HOD ✅

Department 2: Finance Department  
├─ Manager: Finance Manager ✅
└─ HOD: (None) ❌

Department 3: HR Department
├─ Manager: (None) ❌
└─ HOD: (None) ❌
```

**How System Handles:**

1. **Finance Ticket (needs HOD approval):**
   - Finance has no HOD
   - System finds IT HOD → Uses IT HOD ✅
   - Works, but IT HOD approves Finance tickets

2. **HR Ticket (needs LM approval):**
   - HR has no Manager
   - System finds Finance Manager → Uses Finance Manager ✅
   - Works, but Finance Manager approves HR tickets

3. **HR Ticket (needs HOD approval):**
   - HR has no HOD
   - System finds IT HOD → Uses IT HOD ✅
   - Works, but IT HOD approves HR tickets

**Result**: System works, but approvals go to managers/HODs from other departments.

---

### Code Evidence

**LM Fallback Logic** (`app/Services/ApprovalWorkflowService.php` line 642-647):
```php
// Fallback: First active manager
return User::whereHas('roles', function ($query) {
    $query->whereIn('name', ['Manager', 'Line Manager', 'Super Admin']);
})
->where('is_active', true)
->first();
```

**HOD Fallback Logic** (`app/Services/ApprovalWorkflowService.php` line 716-765):
```php
// Priority 3: Find any Head of Department
$hod = User::whereHas('roles', function ($query) {
    $query->whereIn('name', ['Head of Department', 'HOD']);
})
->where('is_active', true)
->first();

// Priority 4: Fallback to Director
// Priority 5: Last resort - Super Admin
```

---

### Summary

| Question | Answer |
|----------|--------|
| **Must LM be in each department?** | ❌ No - System has fallbacks |
| **Must HOD be in each department?** | ❌ No - System has fallbacks |
| **Recommended to have LM in each dept?** | ✅ Yes - For proper workflow |
| **Recommended to have HOD in each dept?** | ✅ Yes - For proper workflow |
| **Minimum system requirement?** | ✅ At least 1 LM and 1 HOD in entire system |
| **What if none found?** | ⚠️ System uses Super Admin (with warnings) |

---

**Last Updated**: Based on current codebase implementation

