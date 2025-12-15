# Real-World Department Roles: How It Works

## 🎯 Your Question

In real-world, each department has its own:
- **IT Department**: IT HOD, IT DHOD, IT LM, IT DLM
- **Architecture Department**: Arch HOD, Arch DHOD, Arch LM, Arch DLM  
- **Procurement Department**: Procurement HOD, Procurement DHOD, Procurement LM, Procurement DLM
- **HR Department**: HR HOD, HR DHOD, HR LM, HR DLM
- **Finance Department**: Finance HOD, Finance DHOD, Finance LM, Finance DLM

**But currently, the system has generic roles!**

---

## ✅ Good News: Your System Already Supports This!

### How It Currently Works:

**Generic Roles:**
- "Head of Department" (generic name)
- "Line Manager" (generic name)

**Department-Aware Selection:**
- System finds HOD/LM **within the specific department**
- Each department can have its own HOD/LM users
- Works automatically based on `department_id`

### Example:

```
IT Department:
- John: Role = "Head of Department", Department = IT
  → Effectively: "IT Head of Department" ✅

HR Department:
- Bob: Role = "Head of Department", Department = HR
  → Effectively: "HR Head of Department" ✅

Architecture Department:
- Mike: Role = "Head of Department", Department = Architecture
  → Effectively: "Architecture Head of Department" ✅
```

**The system already finds the right person for each department!**

---

## 📊 Current Implementation

### How `findHOD()` Works:

```php
// Priority 1: Find HOD in assigned team/department
if ($ticket->assigned_team_id) {
    $hod = User::where('department_id', $ticket->assigned_team_id) // ← Department-specific!
        ->whereHas('roles', function ($query) {
            $query->whereIn('name', ['Head of Department', 'HOD']);
        })
        ->first();
}
```

**This means:**
- IT ticket → Finds HOD in IT Department → "IT HOD" ✅
- HR ticket → Finds HOD in HR Department → "HR HOD" ✅
- Arch ticket → Finds HOD in Architecture Department → "Arch HOD" ✅

### How `findLineManager()` Works:

```php
// Find manager in requester's department
if ($ticket->requester && $ticket->requester->department_id) {
    $manager = User::where('department_id', $ticket->requester->department_id) // ← Department-specific!
        ->whereHas('roles', function ($query) {
            $query->whereIn('name', RoleConstants::getApprovalRoles());
        })
        ->first();
}
```

**This means:**
- IT employee → Finds LM in IT Department → "IT LM" ✅
- HR employee → Finds LM in HR Department → "HR LM" ✅
- Arch employee → Finds LM in Architecture Department → "Arch LM" ✅

---

## 🎯 Real-World Structure in Your System

### IT Department:
```
Users:
- John: Role = "Head of Department", Department = IT
  → IT HOD ✅
- Jane: Role = "Line Manager", Department = IT
  → IT LM ✅
```

### Architecture Department:
```
Users:
- Mike: Role = "Head of Department", Department = Architecture
  → Arch HOD ✅
- Sarah: Role = "Line Manager", Department = Architecture
  → Arch LM ✅
```

### Procurement Department:
```
Users:
- Tom: Role = "Head of Department", Department = Procurement
  → Procurement HOD ✅
- Lisa: Role = "Line Manager", Department = Procurement
  → Procurement LM ✅
```

### HR Department:
```
Users:
- Bob: Role = "Head of Department", Department = HR
  → HR HOD ✅
- Alice: Role = "Line Manager", Department = HR
  → HR LM ✅
```

---

## 💡 Making It More Explicit (Optional)

If you want **explicit department names in role names**, you can:

### Option 1: Add Display Name in Metadata

```php
// When creating roles, add department info to metadata
Role::create([
    'name' => 'Head of Department',
    'metadata' => [
        'approval_limit' => 10000,
        'department_scope' => 'own_department',
        'display_name_template' => '{department} Head of Department', // For UI
    ]
]);
```

### Option 2: Create Department-Specific Roles (If Needed)

If you really want explicit role names like "IT Head of Department":

```php
// In RolePermissionSeeder, create department-specific roles
$departments = [
    'IT' => 'IT',
    'Architecture' => 'Arch',
    'Procurement' => 'Procurement',
    'HR' => 'HR',
    'Finance' => 'Finance',
];

foreach ($departments as $deptName => $deptCode) {
    // HOD
    Role::firstOrCreate([
        'name' => "{$deptName} Head of Department",
        'hierarchy_level' => 7,
        'metadata' => [
            'approval_limit' => 10000,
            'department_code' => $deptCode,
        ]
    ]);
    
    // LM
    Role::firstOrCreate([
        'name' => "{$deptName} Line Manager",
        'hierarchy_level' => 5,
        'metadata' => [
            'approval_limit' => 1000,
            'department_code' => $deptCode,
        ]
    ]);
}
```

**Then update approver selection:**
```php
// Find department-specific HOD
$department = Department::find($departmentId);
$hod = User::where('department_id', $departmentId)
    ->whereHas('roles', function ($query) use ($department) {
        $query->where('name', "{$department->name} Head of Department");
    })
    ->first();
```

---

## ✅ Recommendation

### Keep Current System (Generic Roles) ✅

**Why:**
1. ✅ Already department-aware
2. ✅ Simpler to manage
3. ✅ Works automatically
4. ✅ Flexible (users can move departments)
5. ✅ Less roles to maintain

**How it works:**
- Generic role: "Head of Department"
- Department assignment: User's `department_id`
- System finds: HOD within specific department
- Result: "IT HOD" (implicitly, based on department)

**Example Flow:**
```
1. IT ticket created
2. System looks for "Head of Department" role
3. Within IT Department (department_id = IT)
4. Finds: John (HOD role + IT department)
5. Result: "IT Head of Department" approves ✅
```

---

## 📋 Summary

### Current System: ✅ Already Works!

**Generic Roles:**
- "Head of Department" (works for all departments)
- "Line Manager" (works for all departments)

**Department-Aware:**
- System finds HOD/LM **within the specific department**
- Each department has its own HOD/LM users
- Works automatically based on `department_id`

**Result:**
- IT Department → IT HOD, IT LM ✅
- HR Department → HR HOD, HR LM ✅
- Architecture Department → Arch HOD, Arch LM ✅
- Procurement Department → Procurement HOD, Procurement LM ✅

**Your system is already structured correctly for real-world use!** 🎉

The role name is generic, but the **functionality is department-specific** through `department_id` assignment.
