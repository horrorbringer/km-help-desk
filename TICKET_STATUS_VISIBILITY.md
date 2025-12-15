# Ticket Status Visibility Rules

## 📋 Overview

This document explains who can see tickets with different statuses, particularly **resolved** and **closed** tickets.

---

## 🎯 Current Visibility Rules

The system uses **role-based visibility** that applies to **ALL ticket statuses** (including resolved and closed). There are **no special restrictions** for resolved/closed tickets - the same visibility rules apply.

---

## 👥 Who Can See Tickets

### 1. **Admins & Managers with `tickets.assign` Permission** ✅
**Can see:** ALL tickets (regardless of status)

**Roles:**
- Super Admin
- CEO
- Director
- Head of Department (HOD)
- Deputy Head of Department (DHOD)
- IT Manager, Operations Manager, etc. (with `tickets.assign`)
- Project Manager

**Example:**
- ✅ Can see all resolved tickets
- ✅ Can see all closed tickets
- ✅ Can see all open/assigned/in_progress tickets

---

### 2. **Requesters (Regular Employees)** 👤
**Can see:** Only tickets they created or are watching

**Rules:**
- ✅ Can see tickets where `requester_id = their user ID`
- ✅ Can see tickets they are watching (watchers)
- ❌ Cannot see tickets created by others
- ❌ Cannot see tickets assigned to their team (unless they created them)

**Example:**
- ✅ Can see their own resolved tickets
- ✅ Can see their own closed tickets
- ✅ Can see their own open tickets
- ❌ Cannot see other people's resolved/closed tickets

---

### 3. **Agents (Support Staff)** 🛠️
**Can see:** Tickets assigned to them or their team

**Roles:**
- Agent
- Senior Agent
- IT Administrator

**Rules:**
- ✅ Can see tickets where `assigned_agent_id = their user ID`
- ✅ Can see tickets where `assigned_team_id = their department_id`
- ❌ Cannot see tickets assigned to other teams
- ❌ Cannot see unassigned tickets (unless they created them)

**Example:**
- ✅ Can see resolved tickets assigned to them
- ✅ Can see closed tickets assigned to their team
- ✅ Can see in_progress tickets assigned to them
- ❌ Cannot see resolved tickets from other departments

---

### 4. **Managers without `tickets.assign` Permission** 👔
**Can see:** Tickets in their department

**Roles:**
- Line Manager (LM)
- Deputy Line Manager (DLM)
- Manager (without assign permission)

**Rules:**
- ✅ Can see tickets where `assigned_team_id = their department_id`
- ✅ Can see tickets in their department (even if not assigned)
- ❌ Cannot see tickets from other departments

**Example:**
- ✅ Can see resolved tickets in their department
- ✅ Can see closed tickets in their department
- ❌ Cannot see resolved tickets from other departments

---

## 🔍 Visibility Logic (Code Reference)

### Main Visibility Check: `canUserViewTicket()`

Located in: `app/Http/Controllers/Admin/TicketController.php`

```php
protected function canUserViewTicket(User $user, Ticket $ticket): bool
{
    // 1. Admins/Managers with tickets.assign → See ALL
    if ($user->can('tickets.assign')) {
        return true;
    }
    
    // 2. Requester → See own tickets
    if ($ticket->requester_id === $user->id) {
        return true;
    }
    
    // 3. Assigned Agent → See tickets assigned to them
    if ($ticket->assigned_agent_id === $user->id) {
        return true;
    }
    
    // 4. Team Member → See tickets in their team
    if ($ticket->assigned_team_id && $user->department_id === $ticket->assigned_team_id) {
        if ($user->hasAnyRole([Agent, Senior Agent, Manager])) {
            return true;
        }
    }
    
    // 5. Watcher → See tickets they're watching
    if ($ticket->watchers()->where('users.id', $user->id)->exists()) {
        return true;
    }
    
    // 6. Manager → See tickets in their department
    if ($user->hasRole(Manager) && $user->department_id) {
        if ($ticket->assignedTeam && $ticket->assignedTeam->id === $user->department_id) {
            return true;
        }
    }
    
    return false;
}
```

**Important:** This check applies to **ALL statuses** - there's no special handling for resolved/closed.

---

## 📊 Status-Specific Visibility (Current Behavior)

### ✅ **Resolved Tickets**
**Visibility:** Same as any other ticket status

**Who can see:**
- ✅ Admins/Managers → All resolved tickets
- ✅ Requester → Their own resolved tickets
- ✅ Assigned Agent → Resolved tickets assigned to them
- ✅ Team Agents → Resolved tickets in their team
- ✅ Managers → Resolved tickets in their department

**Example Scenario:**
```
Ticket #123: "Printer not working"
Status: Resolved
Requester: John (IT Department)
Assigned Agent: Sarah (IT Department)

Who can see:
- ✅ John (requester)
- ✅ Sarah (assigned agent)
- ✅ All IT Department agents
- ✅ IT Manager, HOD, LM
- ✅ Super Admin, CEO, Director
- ❌ Bob from HR (different department)
- ❌ Other requesters
```

---

### ✅ **Closed Tickets**
**Visibility:** Same as any other ticket status

**Who can see:**
- ✅ Admins/Managers → All closed tickets
- ✅ Requester → Their own closed tickets
- ✅ Assigned Agent → Closed tickets assigned to them
- ✅ Team Agents → Closed tickets in their team
- ✅ Managers → Closed tickets in their department

**Example Scenario:**
```
Ticket #456: "Computer fix request"
Status: Closed
Requester: Alice (Finance Department)
Assigned Team: IT Service Desk

Who can see:
- ✅ Alice (requester)
- ✅ All IT Service Desk agents
- ✅ IT Manager, HOD, LM
- ✅ Super Admin, CEO, Director
- ❌ Bob from Finance (didn't create it, not in IT team)
- ❌ Other requesters
```

---

## 🚫 What's NOT Restricted

### ❌ **No Status-Based Restrictions**
- Resolved tickets are **NOT hidden** from requesters
- Closed tickets are **NOT hidden** from agents
- There's **NO automatic hiding** based on status

### ❌ **No Time-Based Restrictions**
- Old resolved tickets are **NOT automatically hidden**
- Closed tickets from last year are **still visible** (if user has permission)

### ❌ **No Department Restrictions for Requesters**
- Requesters can **ONLY** see tickets they created
- They **CANNOT** see other department's resolved/closed tickets (even if public)

---

## 💡 Common Scenarios

### Scenario 1: Requester Views Their Resolved Ticket
```
User: John (Requester)
Ticket: #123 (Status: Resolved, Requester: John)

Result: ✅ Can see
Reason: John is the requester
```

### Scenario 2: Agent Views Resolved Ticket from Another Team
```
User: Sarah (IT Agent)
Ticket: #456 (Status: Resolved, Team: HR Department)

Result: ❌ Cannot see
Reason: Ticket is in HR, Sarah is in IT
```

### Scenario 3: Manager Views Closed Ticket in Their Department
```
User: Mike (IT Manager, has tickets.assign)
Ticket: #789 (Status: Closed, Team: IT Department)

Result: ✅ Can see
Reason: Mike has tickets.assign permission (sees all tickets)
```

### Scenario 4: Requester Views Someone Else's Closed Ticket
```
User: Alice (Requester)
Ticket: #999 (Status: Closed, Requester: Bob)

Result: ❌ Cannot see
Reason: Alice didn't create this ticket
```

---

## 🔧 How to Change Visibility Rules

### Option 1: Hide Resolved/Closed from Requesters

If you want requesters to **NOT see** resolved/closed tickets:

```php
// In canUserViewTicket() method
if ($ticket->requester_id === $user->id) {
    // Hide resolved/closed tickets from requesters
    if (in_array($ticket->status, ['resolved', 'closed'])) {
        return false;
    }
    return true;
}
```

### Option 2: Hide Old Closed Tickets

If you want to hide closed tickets older than 30 days:

```php
// In canUserViewTicket() method
if ($ticket->status === 'closed' && $ticket->closed_at) {
    if ($ticket->closed_at->diffInDays(now()) > 30) {
        // Hide from requesters only
        if ($ticket->requester_id === $user->id && !$user->can('tickets.assign')) {
            return false;
        }
    }
}
```

### Option 3: Show Closed Tickets to All Department Members

If you want all department members to see closed tickets:

```php
// In canUserViewTicket() method
if ($ticket->status === 'closed') {
    // Allow all department members to see closed tickets
    if ($user->department_id && $ticket->assigned_team_id === $user->department_id) {
        return true;
    }
}
```

---

## 📝 Summary

### Current Behavior:
- ✅ **Resolved tickets:** Visible based on role (same as other statuses)
- ✅ **Closed tickets:** Visible based on role (same as other statuses)
- ✅ **No special restrictions** for resolved/closed statuses

### Visibility Priority:
1. **Admins/Managers** (with `tickets.assign`) → See ALL
2. **Requester** → See own tickets
3. **Assigned Agent** → See assigned tickets
4. **Team Agents** → See team tickets
5. **Managers** → See department tickets
6. **Watchers** → See watched tickets

### Key Points:
- Status (resolved/closed) does **NOT affect visibility**
- Role and department determine visibility
- Requesters can see their own resolved/closed tickets
- Agents can see resolved/closed tickets in their team
- Managers can see resolved/closed tickets in their department

---

## ❓ FAQ

**Q: Can requesters see their resolved tickets?**
A: Yes, requesters can always see tickets they created, regardless of status.

**Q: Can agents see closed tickets from other departments?**
A: No, agents can only see tickets assigned to them or their team.

**Q: Are resolved tickets hidden automatically?**
A: No, resolved tickets follow the same visibility rules as other statuses.

**Q: Can managers see all closed tickets?**
A: Only if they have `tickets.assign` permission. Otherwise, only closed tickets in their department.

**Q: How do I hide old closed tickets?**
A: You would need to modify the `canUserViewTicket()` method to add time-based restrictions.

---

## 🔗 Related Files

- `app/Http/Controllers/Admin/TicketController.php` - `canUserViewTicket()` method
- `app/Services/SearchService.php` - `applyVisibilityFilters()` method
- `app/Policies/TicketPolicy.php` - Policy-based authorization (if used)
