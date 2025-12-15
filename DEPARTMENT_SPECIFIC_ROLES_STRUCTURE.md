# Department-Specific Roles Structure

## 🎯 Real-World Requirement

In reality, each department has its own:
- **HOD/DHOD** (Head of Department / Deputy Head of Department)
- **LM/DLM** (Line Manager / Deputy Line Manager)

**Examples:**
- **IT Department**: IT HOD, IT DHOD, IT LM, IT DLM
- **Architecture Department**: Arch HOD, Arch DHOD, Arch LM, Arch DLM
- **Procurement Department**: Procurement HOD, Procurement DHOD, Procurement LM, Procurement DLM
- **HR Department**: HR HOD, HR DHOD, HR LM, HR DLM
- **Finance Department**: Finance HOD, Finance DHOD, Finance LM, Finance DLM

---

## 📊 Current System vs Real-World

### Current System:
- Generic roles: "Head of Department", "Line Manager"
- System finds HOD/LM **within the department** (department-aware)
- Works but roles are not department-specific

### Real-World Need:
- Department-specific role names: "IT Head of Department", "HR Head of Department"
- Each department has its own HOD/DHOD and LM/DLM
- More explicit and clear

---

## 🏗️ Solution: Two Approaches

### Approach 1: Generic Roles + Department-Aware Selection (Current) ✅

**How it works:**
- Generic roles: "Head of Department", "Line Manager"
- System finds approver **within the specific department**
- User's `department_id` determines which HOD/LM is found

**Example:**
```
IT Ticket → Finds HOD in IT Department → "Head of Department" role in IT Dept
HR Ticket → Finds HOD in HR Department → "Head of Department" role in HR Dept
```

**Pros:**
- ✅ Simple role structure
- ✅ Already implemented
- ✅ Works automatically

**Cons:**
- ⚠️ Role names don't show department
- ⚠️ Less explicit

### Approach 2: Department-Specific Role Names ✅

**How it works:**
- Create roles like: "IT Head of Department", "HR Head of Department"
- Each department has its own HOD/LM roles
- More explicit but requires more roles

**Example:**
```
IT Ticket → Finds "IT Head of Department" role
HR Ticket → Finds "HR Head of Department" role
```

**Pros:**
- ✅ Explicit department in role name
- ✅ Clearer organizational structure
- ✅ Matches real-world naming

**Cons:**
- ⚠️ More roles to manage
- ⚠️ Need to create roles per department

---

## 🚀 Recommended: Hybrid Approach

**Best Solution:** Use **generic roles** but make them **department-aware** with better naming support.

### Structure:

```
Generic Roles (System Level):
- Head of Department (HOD)
- Deputy Head of Department (DHOD) - Optional
- Line Manager (LM)
- Deputy Line Manager (DLM) - Optional

Department-Specific Selection:
- System finds HOD/LM within the ticket's department
- Each department can have its own HOD/LM users
- Works automatically based on department_id
```

### How It Works:

1. **Role Assignment:**
   - User assigned to "Head of Department" role
   - User assigned to "IT Department" (department_id)
   - Result: User is "IT Head of Department" (implicitly)

2. **Approver Selection:**
   ```
   IT Ticket created
   → System looks for "Head of Department" role
   → Within IT Department (department_id = IT)
   → Finds: John (HOD role + IT department)
   → Result: "IT Head of Department" approves
   ```

3. **Multiple Departments:**
   ```
   IT Department:
   - John (HOD role) → IT HOD
   - Jane (LM role) → IT LM
   
   HR Department:
   - Bob (HOD role) → HR HOD
   - Alice (LM role) → HR LM
   ```

---

## 💡 Implementation: Enhanced Department-Aware Roles

### Option A: Keep Generic Roles (Recommended)

**Current system already works this way!**

The `findHOD()` and `findLineManager()` methods already:
- Look for HOD/LM **within the specific department**
- Each department can have its own HOD/LM users
- Works automatically

**No changes needed** - system is already department-aware!

### Option B: Add Department-Specific Role Names

If you want explicit department names in roles:

```php
// Create department-specific roles dynamically
$departments = Department::all();

foreach ($departments as $dept) {
    // Create HOD role for department
    Role::firstOrCreate([
        'name' => "{$dept->name} Head of Department",
        'hierarchy_level' => 7,
        'metadata' => [
            'department_id' => $dept->id,
            'approval_limit' => 10000,
            'department_scope' => 'own_department',
        ]
    ]);
    
    // Create LM role for department
    Role::firstOrCreate([
        'name' => "{$dept->name} Line Manager",
        'hierarchy_level' => 5,
        'metadata' => [
            'department_id' => $dept->id,
            'approval_limit' => 1000,
            'department_scope' => 'own_department',
        ]
    ]);
}
```

**Then update approver selection:**
```php
// Find HOD for specific department
$hod = User::where('department_id', $departmentId)
    ->whereHas('roles', function ($query) use ($department) {
        $query->where('name', "{$department->name} Head of Department");
    })
    ->first();
```

---

## 📋 Recommended Structure

### Keep Current System (Generic Roles) ✅

**Why:**
1. ✅ Already department-aware
2. ✅ Simpler to manage
3. ✅ Works automatically
4. ✅ Flexible (users can move departments)

**How it works:**
- Generic role: "Head of Department"
- Department assignment: User's `department_id`
- Result: "IT HOD" (implicitly, based on department)

**Example:**
```
User: John
Role: "Head of Department"
Department: IT Department
Result: John is effectively "IT Head of Department"
```

### Current Implementation Already Supports This! ✅

Your `findHOD()` and `findLineManager()` methods already:
- ✅ Find approvers within specific departments
- ✅ Each department can have its own HOD/LM
- ✅ Works automatically based on `department_id`

**No changes needed!** The system is already structured correctly.

---

## 🎯 Real-World Mapping

### IT Department:
```
- John: "Head of Department" role + IT Department → IT HOD ✅
- Jane: "Line Manager" role + IT Department → IT LM ✅
```

### HR Department:
```
- Bob: "Head of Department" role + HR Department → HR HOD ✅
- Alice: "Line Manager" role + HR Department → HR LM ✅
```

### Architecture Department:
```
- Mike: "Head of Department" role + Architecture Department → Arch HOD ✅
- Sarah: "Line Manager" role + Architecture Department → Arch LM ✅
```

### Procurement Department:
```
- Tom: "Head of Department" role + Procurement Department → Procurement HOD ✅
- Lisa: "Line Manager" role + Procurement Department → Procurement LM ✅
```

---

## ✅ Conclusion

**Your current system is already structured correctly!**

- ✅ Generic roles: "Head of Department", "Line Manager"
- ✅ Department-aware selection: Finds HOD/LM within specific department
- ✅ Each department can have its own HOD/LM users
- ✅ Works automatically based on `department_id`

**No changes needed** - the system already supports department-specific HOD/LM through:
1. Generic role names
2. Department assignment (`department_id`)
3. Department-aware approver selection

The role name is generic, but the **functionality is department-specific**! 🎉
