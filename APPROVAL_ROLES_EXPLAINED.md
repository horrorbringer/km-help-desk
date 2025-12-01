# Approval Roles Explained: LM and HOD

## Overview

In the ticket approval workflow system, there are two main approval levels:

## 1. **LM - Line Manager** 👔

### Full Name
**Line Manager** (also called Direct Manager or Department Manager)

### Role
- **First level approver** in the approval workflow
- Direct supervisor of the ticket requester
- Typically manages a team or department

### Responsibilities
- ✅ Review and approve/reject tickets created by their team members
- ✅ Ensure tickets align with department policies and budgets
- ✅ Route approved tickets to appropriate teams (e.g., IT Department)
- ✅ Provide comments explaining approval/rejection decisions

### When LM Approval is Required
- **Always** - Every ticket goes through LM approval first (unless category is configured to skip approval)
- Created automatically when a ticket is submitted
- Must be completed before ticket can proceed

### How LM is Determined
The system finds the Line Manager using this logic:
1. **Requester's Department Manager** - Manager of the ticket creator's department
2. **Assigned Team Manager** - Manager of the team the ticket is assigned to
3. **Fallback** - First active manager found in the system

### Example
- Employee "John" (in IT Department) creates a ticket
- System finds "Sarah" (IT Department Manager) as the Line Manager
- Ticket is sent to Sarah for approval
- Sarah can approve → routes to IT Department for processing
- OR Sarah can reject → ticket is cancelled

---

## 2. **HOD - Head of Department** 👑

### Full Name
**Head of Department** (also called Department Head, Director, or Senior Manager)

### Role
- **Second level approver** in the approval workflow
- Higher authority than Line Manager
- Typically oversees multiple departments or the entire organization

### Responsibilities
- ✅ Review high-value or high-priority tickets
- ✅ Make final approval decisions for significant requests
- ✅ Route tickets to final destinations or mark as resolved
- ✅ Provide strategic oversight for major ticket requests

### When HOD Approval is Required
HOD approval is **conditionally required** based on:

1. **Ticket Priority**
   - High priority tickets
   - Critical priority tickets

2. **Ticket Category Settings**
   - Categories with `requires_hod_approval = true`
   - Categories with cost thresholds (`hod_approval_threshold`)

3. **Ticket Value/Cost**
   - If ticket cost exceeds the category's `hod_approval_threshold`

### How HOD is Determined
The system finds the Head of Department using this logic:
1. **Users with HOD Role** - Users assigned the "Head of Department" or "Director" role
2. **First Active HOD** - First active HOD found in the system
3. **Fallback** - System administrator

### Example
- Ticket is approved by Line Manager
- Ticket has **High Priority** → HOD approval is automatically created
- System finds "Michael" (Head of IT Department) as the HOD
- Ticket is sent to Michael for final approval
- Michael can approve → routes to final destination or marks as resolved
- OR Michael can reject → ticket is cancelled

---

## Approval Workflow Flow

```
User Creates Ticket
    ↓
Line Manager (LM) Approval ← REQUIRED (First Level)
    ↓
    ├─→ REJECTED → Ticket Cancelled ❌
    │
    └─→ APPROVED → Routes to IT Department (ITD)
            ↓
        Check if HOD Approval Needed?
            ↓
            ├─→ NO → Process Ticket ✅
            │
            └─→ YES → Head of Department (HOD) Approval ← CONDITIONAL (Second Level)
                        ↓
                        ├─→ REJECTED → Ticket Cancelled ❌
                        │
                        └─→ APPROVED → Final Processing ✅
```

## Key Differences

| Aspect | LM (Line Manager) | HOD (Head of Department) |
|--------|------------------|---------------------------|
| **Level** | First level | Second level |
| **Required** | Always (unless category skips) | Conditional (priority/cost) |
| **Authority** | Department/Team level | Organization level |
| **Typical Role** | Manager, Supervisor | Director, Head, VP |
| **Decision Scope** | Department policies | Strategic/High-value decisions |
| **Sequence** | 1st (Sequence = 1) | 2nd (Sequence = 2) |

## Configuration

### Category Settings
Each ticket category can be configured with:
- `requires_approval` - Whether LM approval is needed (default: true)
- `requires_hod_approval` - Whether HOD approval is needed (default: false)
- `hod_approval_threshold` - Cost threshold for HOD approval (e.g., $1000)

### Example Category Configuration
```php
// IT Hardware category
'requires_approval' => true,           // LM approval required
'requires_hod_approval' => true,       // HOD approval also required
'hod_approval_threshold' => 500.00,    // HOD approval if cost > $500
```

## Real-World Example

**Scenario**: Employee requests a new laptop

1. **Employee** creates ticket: "Need new laptop for development work"
   - Priority: Medium
   - Category: IT Hardware
   - Estimated Cost: $1,200

2. **Line Manager (LM)** receives approval request
   - Reviews request
   - Checks budget
   - **Approves** → Routes to IT Department

3. **System checks** if HOD approval needed:
   - Category requires HOD approval: ✅ Yes
   - Cost ($1,200) > Threshold ($500): ✅ Yes
   - **HOD approval created**

4. **Head of Department (HOD)** receives approval request
   - Reviews high-value request
   - **Approves** → Routes to Procurement Team

5. **Ticket processed** → Laptop ordered

## In the System

### Approval Levels in Database
- `approval_level = 'lm'` → Line Manager approval
- `approval_level = 'hod'` → Head of Department approval

### Approval Sequence
- `sequence = 1` → First approval (LM)
- `sequence = 2` → Second approval (HOD)

### Finding Approvers
- **LM**: `findLineManager()` method
- **HOD**: `findHOD()` method

Both methods search for users with appropriate roles and assign them as approvers.

## Summary

- **LM (Line Manager)**: First-level approver, always required, manages team/department
- **HOD (Head of Department)**: Second-level approver, conditionally required, higher authority

The workflow ensures proper authorization and budget control before processing tickets.

