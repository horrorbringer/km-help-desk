# Department Roles Guide: What Roles Should Each Department Have?

## 🎯 Overview

This guide explains what roles should be assigned to each department in your system, and how the current role structure supports department-specific management.

---

## 📊 Current Role Structure

### Generic Department Leadership Roles (All Departments)
These roles work across all departments and are **department-aware**:

1. **Head of Department (HOD)**
   - Department leader
   - Highest authority within department
   - Can approve high-value requests
   - Hierarchy Level: 7

2. **Deputy Head of Department (DHOD)**
   - Acts as HOD when HOD is unavailable
   - Same authority as HOD (fallback)
   - Hierarchy Level: 6.5

3. **Line Manager (LM)**
   - Direct supervisor for employees
   - First-level approval authority
   - Manages team members
   - Hierarchy Level: 5

4. **Deputy Line Manager (DLM)**
   - Acts as LM when LM is unavailable
   - Same authority as LM (fallback)
   - Hierarchy Level: 4.5

### Department-Specific Manager Roles
These are specialized managers for specific departments:

- **IT Manager** - For IT Department
- **Operations Manager** - For Operations Department
- **Finance Manager** - For Finance Department
- **HR Manager** - For HR Department
- **Procurement Manager** - For Procurement Department
- **Safety Manager** - For Safety Department

---

## 🏢 Recommended Roles Per Department

### 1. **IT Department** (Focus for V1 Launch)

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional but recommended)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional but recommended)
- ✅ **IT Manager** - 1 person (can be same as HOD or separate)
- ✅ **IT Administrator** - 1-3 people (technical staff)
- ✅ **Senior Agent** - 2-5 people (support staff)
- ✅ **Agent** - 3-10 people (support staff)
- ✅ **Requester** - All other IT employees

**Example Structure:**
```
IT Department:
├── HOD: John (Head of Department role, Department = IT)
├── DHOD: Sarah (Deputy Head of Department role, Department = IT)
├── LM: Mike (Line Manager role, Department = IT)
├── DLM: Lisa (Deputy Line Manager role, Department = IT)
├── IT Manager: John (IT Manager role, Department = IT) [can be same as HOD]
├── IT Admin: Tom (IT Administrator role, Department = IT)
├── Senior Agents: Alice, Bob (Senior Agent role, Department = IT)
├── Agents: Charlie, Diana, Eve (Agent role, Department = IT)
└── Requesters: All other IT staff (Requester role, Department = IT)
```

**Workflow:**
- Employee creates ticket → HOD gets notification → LM/DLM approves → Routes to IT team → LM/DLM receives ticket

---

### 2. **Architecture Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **Manager** or **Operations Manager** - 1 person
- ✅ **Requester** - All other Architecture employees

**Example Structure:**
```
Architecture Department:
├── HOD: David (Head of Department role, Department = Architecture)
├── DHOD: Emma (Deputy Head of Department role, Department = Architecture)
├── LM: Frank (Line Manager role, Department = Architecture)
├── DLM: Grace (Deputy Line Manager role, Department = Architecture)
└── Requesters: All other Architecture staff
```

---

### 3. **Procurement Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **Procurement Manager** - 1 person (can be same as HOD)
- ✅ **Requester** - All other Procurement employees

**Example Structure:**
```
Procurement Department:
├── HOD: Henry (Head of Department role, Department = Procurement)
├── DHOD: Ivy (Deputy Head of Department role, Department = Procurement)
├── LM: Jack (Line Manager role, Department = Procurement)
├── DLM: Kate (Deputy Line Manager role, Department = Procurement)
├── Procurement Manager: Henry (Procurement Manager role, Department = Procurement)
└── Requesters: All other Procurement staff
```

---

### 4. **HR Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **HR Manager** - 1 person (can be same as HOD)
- ✅ **Requester** - All other HR employees

**Example Structure:**
```
HR Department:
├── HOD: Laura (Head of Department role, Department = HR)
├── DHOD: Mark (Deputy Head of Department role, Department = HR)
├── LM: Nancy (Line Manager role, Department = HR)
├── DLM: Oscar (Deputy Line Manager role, Department = HR)
├── HR Manager: Laura (HR Manager role, Department = HR)
└── Requesters: All other HR staff
```

---

### 5. **Finance Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **Finance Manager** - 1 person (can be same as HOD)
- ✅ **Requester** - All other Finance employees

**Example Structure:**
```
Finance Department:
├── HOD: Paul (Head of Department role, Department = Finance)
├── DHOD: Quinn (Deputy Head of Department role, Department = Finance)
├── LM: Rachel (Line Manager role, Department = Finance)
├── DLM: Steve (Deputy Line Manager role, Department = Finance)
├── Finance Manager: Paul (Finance Manager role, Department = Finance)
└── Requesters: All other Finance staff
```

---

### 6. **Operations Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **Operations Manager** - 1 person (can be same as HOD)
- ✅ **Requester** - All other Operations employees

---

### 7. **Safety Department**

**Required Roles:**
- ✅ **Head of Department (HOD)** - 1 person
- ✅ **Deputy Head of Department (DHOD)** - 1 person (optional)
- ✅ **Line Manager (LM)** - 1-2 people
- ✅ **Deputy Line Manager (DLM)** - 1-2 people (optional)
- ✅ **Safety Manager** - 1 person (can be same as HOD)
- ✅ **Requester** - All other Safety employees

---

## 🔄 How It Works: Department-Aware Role Selection

### Current System Behavior

The system uses **generic role names** but finds the right person **within the department**:

```php
// When finding HOD for a ticket:
$hod = User::where('department_id', $ticket->assigned_team_id) // ← Department filter!
    ->whereHas('roles', function ($query) {
        $query->whereIn('name', ['Head of Department']);
    })
    ->first();
```

**Result:**
- IT ticket → Finds HOD in IT Department → "IT HOD" ✅
- HR ticket → Finds HOD in HR Department → "HR HOD" ✅
- Architecture ticket → Finds HOD in Architecture Department → "Arch HOD" ✅

### Fallback Logic

The system has intelligent fallback:

1. **For HOD:**
   - Try: Head of Department (in department)
   - Fallback: Deputy Head of Department (in department)
   - Fallback: Director
   - Fallback: Super Admin

2. **For LM:**
   - Try: Line Manager (in department)
   - Fallback: Deputy Line Manager (in department)
   - Fallback: Manager
   - Fallback: Super Admin

---

## 📋 Role Assignment Checklist

### For Each Department, You Need:

#### Minimum Required (Essential):
- [ ] 1x **Head of Department** (HOD)
- [ ] 1x **Line Manager** (LM)
- [ ] Multiple **Requesters** (all employees)

#### Recommended (Best Practice):
- [ ] 1x **Deputy Head of Department** (DHOD) - for HOD backup
- [ ] 1x **Deputy Line Manager** (DLM) - for LM backup
- [ ] 1x **Department-Specific Manager** (if applicable: IT Manager, HR Manager, etc.)

#### Optional (Based on Department Size):
- [ ] Multiple **Line Managers** (if department has multiple teams)
- [ ] **Agents** or **Senior Agents** (for support departments like IT)
- [ ] **IT Administrator** (for IT Department only)

---

## 🎯 V1 Launch Focus: IT Department

For your V1 launch focusing on IT tickets, ensure IT Department has:

### Essential Roles:
1. ✅ **HOD** - 1 person
2. ✅ **DHOD** - 1 person (recommended)
3. ✅ **LM** - 1-2 people
4. ✅ **DLM** - 1-2 people (recommended)
5. ✅ **IT Manager** - 1 person
6. ✅ **IT Administrator** - 1-3 people
7. ✅ **Senior Agent** - 2-5 people
8. ✅ **Agent** - 3-10 people
9. ✅ **Requester** - All other IT employees

### Workflow Example:
```
Employee (Requester) creates "Computer Fix Request"
  ↓
HOD receives notification (notification only, no approval needed)
  ↓
LM or DLM approves the ticket
  ↓
Ticket routes to IT Department team
  ↓
LM or DLM receives the ticket (assignment notification)
```

---

## 💡 Key Points

1. **Generic Roles Work**: The system uses generic role names ("Head of Department") but finds the right person within each department automatically.

2. **Department Assignment is Key**: The `department_id` on the User model determines which HOD/LM is found.

3. **Fallback Support**: Deputy roles (DHOD/DLM) automatically act as backups when primary roles are unavailable.

4. **One Person Can Have Multiple Roles**: A person can be both HOD and IT Manager (same person, different roles).

5. **Department-Specific Managers**: Roles like "IT Manager" are department-specific but work alongside generic HOD/LM roles.

---

## 🚀 Next Steps

1. **Assign Roles to Users**: Go to Users → Edit → Assign roles and department
2. **Verify Department Assignment**: Ensure each user has correct `department_id`
3. **Test Workflow**: Create a test ticket and verify routing works correctly
4. **Add More Departments**: As you expand, add HOD/LM for each new department

---

## ❓ Common Questions

**Q: Can one person be HOD for multiple departments?**
A: Technically yes (same role, different departments), but typically each department has its own HOD.

**Q: Do I need both HOD and IT Manager?**
A: Not required. You can have:
- HOD only (simpler)
- IT Manager only (if you don't want HOD)
- Both (if HOD manages multiple departments and IT Manager manages IT specifically)

**Q: How many LMs should a department have?**
A: Depends on department size:
- Small (< 10 people): 1 LM
- Medium (10-30 people): 1-2 LMs
- Large (> 30 people): Multiple LMs (one per team/group)

**Q: Is DHOD/DLM required?**
A: Not required, but **highly recommended** for continuity when primary HOD/LM is unavailable.

---

## 📝 Summary

**Every department should have:**
- ✅ At least 1 HOD
- ✅ At least 1 LM
- ✅ All employees as Requesters

**Recommended for all departments:**
- ✅ 1 DHOD (backup for HOD)
- ✅ 1 DLM (backup for LM)

**Department-specific:**
- ✅ IT Department: IT Manager, IT Administrator, Agents
- ✅ Other departments: Department-specific Manager (if applicable)

The system automatically finds the right person within each department, so you don't need department-specific role names!
