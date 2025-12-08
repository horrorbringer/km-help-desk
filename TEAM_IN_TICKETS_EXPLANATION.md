# Team in Tickets - Complete Explanation

This document explains what **"Team"** means in the ticket system and how it's used throughout the workflow.

---

## 📋 Table of Contents
1. [What is a Team?](#what-is-a-team)
2. [Team vs Agent](#team-vs-agent)
3. [How Teams Are Assigned](#how-teams-are-assigned)
4. [Team Assignment Flow](#team-assignment-flow)
5. [Team and Category Relationship](#team-and-category-relationship)
6. [Real-World Examples](#real-world-examples)
7. [Common Questions](#common-questions)

---

## 🎯 What is a Team?

**Team** in the ticket system refers to a **Department** that is responsible for handling and resolving tickets. In the database, "Team" and "Department" are the same thing - they're stored in the `departments` table.

### Key Characteristics:
- **Database Field**: `assigned_team_id` in `tickets` table
- **Relationship**: References `departments` table
- **Purpose**: Routes tickets to the correct department/team for handling
- **Examples**: IT Service Desk, Finance & Accounts, Human Resources, Procurement, etc.

### Technical Details:
```php
// In Ticket Model
public function assignedTeam(): BelongsTo
{
    return $this->belongsTo(Department::class, 'assigned_team_id');
}
```

**Important**: A Team is a **group of people** (a department), not an individual person.

---

## 👥 Team vs Agent

### Team (Department)
- **What**: A group/department (e.g., "IT Service Desk", "Finance & Accounts")
- **Field**: `assigned_team_id`
- **Type**: Department/Team level
- **Purpose**: Routes ticket to the right department
- **Status**: Ticket status becomes `assigned` when team is assigned
- **Who sees it**: All members of that team can see the ticket

### Agent (Individual)
- **What**: A specific person/user (e.g., "John Doe", "Jane Smith")
- **Field**: `assigned_agent_id`
- **Type**: Individual level
- **Purpose**: Assigns ticket to a specific person to work on
- **Status**: Ticket status becomes `in_progress` when agent starts work
- **Who sees it**: Only that specific agent is assigned

### Relationship:
```
Team Assignment → Agent Assignment
     ↓                    ↓
"IT Service Desk" → "John Doe (IT Agent)"
```

**Rule**: When you assign an **Agent**, the **Team** is cleared (set to `null`). When you assign a **Team**, the **Agent** is cleared (set to `null`).

**Code Evidence** (`app/Http/Controllers/Admin/TicketController.php`):
```php
// When assigning agent
$ticket->assigned_agent_id = $value;
$ticket->assigned_team_id = null; // Clear team assignment

// When assigning team
$ticket->assigned_team_id = $value;
$ticket->assigned_agent_id = null; // Clear agent assignment
```

---

## 🔄 How Teams Are Assigned

Teams can be assigned in **3 ways**:

### 1. **Automatic Assignment (After Approval)**
After LM or HOD approval, the system automatically routes the ticket to a team based on:
- **Category's Default Team** (primary method)
- **Manual routing** by approver (if specified)

**Code Reference**: `app/Services/ApprovalWorkflowService.php` → `routeAfterLMApproval()` and `routeAfterHODApproval()`

### 2. **Manual Assignment (By Admin/Manager)**
Admins or managers can manually assign a team to a ticket:
- Via bulk update actions
- Via ticket edit form
- Via automation rules

### 3. **Category-Based Default Team**
Each ticket category has a `default_team_id` that determines where tickets of that category should go:
- IT Support category → IT Service Desk team
- Finance Request category → Finance & Accounts team
- HR Request category → Human Resources team

---

## 📊 Team Assignment Flow

### Complete Workflow:

```
1. Ticket Created
   ├─ Status: "open"
   └─ Team: Not assigned yet

2. Approval Required?
   ├─ NO → Route directly to category's default team
   │   └─ Status: "assigned"
   │   └─ Team: Category's default team
   │
   └─ YES → Go through approval workflow
       │
       3. LM Approval
       │   ├─ REJECT → Status: "cancelled"
       │   └─ APPROVE → Check if HOD needed
       │
       4. HOD Approval Required?
       │   ├─ NO → Route to team (after LM approval)
       │   │   └─ Status: "assigned"
       │   │   └─ Team: Category's default team (or manually routed)
       │   │
       │   └─ YES → Create HOD approval
       │       │
       │       5. HOD Approval
       │           ├─ REJECT → Status: "cancelled"
       │           └─ APPROVE → Route to team
       │               └─ Status: "assigned"
       │               └─ Team: Category's default team (or manually routed)

6. Team Assigned
   ├─ Status: "assigned"
   └─ Team members can see the ticket

7. Agent Assignment (Optional)
   ├─ Admin/Manager assigns specific agent
   ├─ Status: "in_progress" (when agent starts work)
   └─ Team assignment cleared (set to null)

8. Agent Works on Ticket
   └─ Status: "in_progress"

9. Ticket Resolved
   └─ Status: "resolved" → "closed"
```

---

## 🔗 Team and Category Relationship

### Category Default Team

Each ticket category has a `default_team_id` field that specifies which team should handle tickets of that category.

**Example Categories and Their Default Teams:**

| Category | Default Team | Purpose |
|----------|-------------|---------|
| IT Support → Hardware | IT Service Desk | IT hardware requests go to IT team |
| IT Support → Software | IT Service Desk | Software requests go to IT team |
| Finance Request → Payment | Finance & Accounts | Payment requests go to Finance team |
| HR Request → Leave | Human Resources | Leave requests go to HR team |
| Procurement → Purchase | Procurement | Purchase requests go to Procurement team |

**Code Reference** (`app/Models/TicketCategory.php`):
```php
public function defaultTeam(): BelongsTo
{
    return $this->belongsTo(Department::class, 'default_team_id');
}
```

### How It Works:

1. **User selects category** when creating ticket
2. **System knows** which team should handle it (from `category.default_team_id`)
3. **After approval**, ticket is automatically routed to that team
4. **Team members** can see and work on tickets assigned to their team

---

## 💼 Real-World Examples

### Example 1: IT Hardware Request

**Scenario**: Employee requests a new laptop

**Flow**:
1. **Employee** creates ticket:
   - Category: "IT Support → Hardware"
   - Category's default team: "IT Service Desk"
   - Status: `pending` (awaiting approval)

2. **LM Approves** → HOD approval needed (high priority)

3. **HOD Approves** → System routes ticket:
   - `assigned_team_id` = IT Service Desk (from category)
   - Status: `assigned`

4. **IT Service Desk team** sees the ticket

5. **IT Manager** assigns specific agent:
   - `assigned_agent_id` = John Doe (IT Agent)
   - `assigned_team_id` = `null` (cleared)
   - Status: `in_progress`

6. **John Doe** works on ticket and resolves it

**Result**: Ticket went from category → team → agent → resolved

---

### Example 2: Finance Payment Request

**Scenario**: Employee requests payment processing

**Flow**:
1. **Employee** creates ticket:
   - Category: "Finance Request → Payment"
   - Category's default team: "Finance & Accounts"
   - Status: `pending`

2. **LM Approves** → No HOD needed (low priority)

3. **System routes ticket**:
   - `assigned_team_id` = Finance & Accounts
   - Status: `assigned`

4. **Finance team** sees the ticket

5. **Finance Manager** assigns agent or team handles it collectively

**Result**: Ticket routed to Finance team based on category

---

### Example 3: Direct Team Assignment (No Approval)

**Scenario**: Routine IT support ticket (no approval needed)

**Flow**:
1. **Employee** creates ticket:
   - Category: "IT Support → General"
   - Category has `requires_approval = false`
   - Status: `open`

2. **System routes directly**:
   - `assigned_team_id` = IT Service Desk (from category)
   - Status: `assigned`
   - **No approval needed**

3. **IT team** can immediately start working

**Result**: Ticket bypassed approval and went directly to team

---

## 📝 Team Assignment Logic

### Automatic Routing (After Approval)

**Code Reference**: `app/Services/ApprovalWorkflowService.php`

```php
// After LM Approval
protected function routeAfterLMApproval(Ticket $ticket, ?int $routedToTeamId = null): void
{
    // Priority 1: Use manually specified team (if approver routed it)
    $targetTeamId = $routedToTeamId;
    
    // Priority 2: Use category's default team
    if (!$targetTeamId && $ticket->category && $ticket->category->default_team_id) {
        $targetTeamId = $ticket->category->default_team_id;
    }
    
    // Priority 3: Fallback to IT Department
    if (!$targetTeamId) {
        $itDepartment = Department::where('code', 'IT-SD')->first();
        $targetTeamId = $itDepartment ? $itDepartment->id : null;
    }
    
    // Assign team and update status
    if ($targetTeamId) {
        $ticket->update([
            'assigned_team_id' => $targetTeamId,
            'status' => 'assigned',
        ]);
    }
}
```

**Priority Order**:
1. ✅ **Manually routed team** (if approver specified)
2. ✅ **Category's default team** (from `category.default_team_id`)
3. ✅ **IT Department** (fallback if no category team)

---

## 🎨 UI/UX: Team Selection

In the ticket form, users see a **Team dropdown** with available teams:

```
Team *
┌─────────────────────────────┐
│ Facilities & Maintenance  ▼ │
├─────────────────────────────┤
│ ✓ Facilities & Maintenance │
│   Field Engineering         │
│   Finance & Accounts        │
│   Health & Safety           │
│   Human Resources           │
│   IT Service Desk           │
│   Procurement               │
└─────────────────────────────┘
```

**Note**: The team field is **required** (`*`) when creating/editing tickets manually, but it can be automatically set during the approval workflow.

---

## 🔍 Key Points to Remember

### ✅ **Important Facts:**

1. **Team = Department**: They're the same thing in the database
2. **Team is assigned after approval**: Tickets are routed to teams after LM/HOD approval
3. **Category determines team**: Each category has a default team
4. **Team vs Agent**: Team is a group, Agent is an individual
5. **Mutually exclusive**: Assigning an agent clears the team, and vice versa
6. **Status changes**: Team assignment sets status to `assigned`

### ⚠️ **Common Misconceptions:**

❌ **Wrong**: "Team is the same as Agent"  
✅ **Correct**: Team is a department/group, Agent is an individual

❌ **Wrong**: "Team must be assigned manually"  
✅ **Correct**: Team is automatically assigned based on category after approval

❌ **Wrong**: "Team and Agent can be assigned together"  
✅ **Correct**: Only one can be assigned at a time (mutually exclusive)

---

## ❓ Common Questions

### Q: What happens if a category has no default team?
**A**: The system falls back to finding the IT Department. If that's not found, the ticket status is set to `resolved` (with a warning logged).

### Q: Can I change the team after it's assigned?
**A**: Yes, admins/managers can manually reassign teams via bulk update or ticket edit.

### Q: What's the difference between "Team" and "Department"?
**A**: In this system, they're the same thing. "Team" is just the user-friendly term for a department that handles tickets.

### Q: Can a ticket have both a team and an agent?
**A**: No, they're mutually exclusive. Assigning an agent clears the team, and assigning a team clears the agent.

### Q: Who can see tickets assigned to a team?
**A**: All users who belong to that team/department can see tickets assigned to their team.

### Q: What if I want to route a ticket to a different team than the category's default?
**A**: Approvers (LM/HOD) can manually route tickets to different teams during the approval process. Admins can also reassign teams after approval.

### Q: How do I know which team a ticket will go to?
**A**: Check the category's `default_team_id`. After approval, the ticket will be routed to that team unless manually routed by an approver.

---

## 📊 Summary Table

| Aspect | Team (Department) | Agent (Individual) |
|--------|------------------|-------------------|
| **What** | Group/Department | Specific person |
| **Field** | `assigned_team_id` | `assigned_agent_id` |
| **Examples** | IT Service Desk, Finance | John Doe, Jane Smith |
| **When Assigned** | After approval (automatic) | After team assignment (manual) |
| **Status** | Sets to `assigned` | Sets to `in_progress` |
| **Visibility** | All team members | Only assigned agent |
| **Can Both Exist?** | ❌ No (mutually exclusive) | ❌ No (mutually exclusive) |
| **Required?** | ✅ Yes (for routing) | ⚠️ Optional (for specific assignment) |

---

## 🔗 Related Concepts

- **Category**: Determines which team should handle the ticket
- **Approval Workflow**: Routes tickets to teams after approval
- **Department**: Same as Team in the database
- **Agent**: Individual person assigned to work on ticket
- **Status**: Changes based on team/agent assignment

---

**Last Updated**: Based on current codebase implementation

**Code References**:
- `app/Models/Ticket.php` → `assignedTeam()` relationship
- `app/Services/ApprovalWorkflowService.php` → `routeAfterLMApproval()`, `routeAfterHODApproval()`
- `app/Models/TicketCategory.php` → `defaultTeam()` relationship
- `app/Http/Controllers/Admin/TicketController.php` → Team assignment logic

