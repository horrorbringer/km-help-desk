# Ticket Reassignment Restrictions - Implementation Summary

This document explains the restrictions implemented for ticket reassignment when a Manager or Agent picks a ticket to themselves.

---

## ✅ Implementation Complete

### Question Answered:
**"When Manager or Agent assigns (picks) ticket to self, should another person be able to change it?"**

**Answer**: 
- ✅ **Managers/Admins**: Can reassign any ticket (override authority)
- ✅ **Agents**: Cannot reassign tickets assigned to others (only Senior Agents can reassign)
- ✅ **Notifications**: Previous assignee is notified when ticket is reassigned

---

## 🔒 Restrictions Implemented

### 1. **Permission Requirement for Reassignment**

**Requirement**: Users must have `tickets.assign` permission to reassign tickets.

**Code Location**: `app/Http/Controllers/Admin/TicketController.php` → `bulkUpdate()` method

```php
case 'assign_agent':
    // Check if user has permission to assign tickets
    if (!Auth::user()->can('tickets.assign')) {
        \Log::warning('User attempted to assign ticket without permission');
        continue; // Skip this ticket
    }
```

**Who Has This Permission:**
- ✅ Super Admin
- ✅ CEO
- ✅ Director
- ✅ Head of Department
- ✅ All Managers (IT, Operations, Finance, HR, Procurement, Safety, Line, Project)
- ✅ Senior Agent
- ❌ Regular Agent (does NOT have this permission)
- ❌ Requester (does NOT have this permission)

---

### 2. **Reassignment Behavior**

#### **Managers/Admins (With `tickets.assign` Permission):**
- ✅ **Can reassign any ticket** - Even if already assigned to someone else
- ✅ **Override authority** - Can reassign tickets assigned to agents
- ✅ **Full control** - Can reassign tickets assigned to other managers

#### **Agents (Without `tickets.assign` Permission):**
- ❌ **Cannot reassign tickets** - Do not have `tickets.assign` permission
- ✅ **Can pick unassigned tickets** - If they have `tickets.edit` permission
- ✅ **Can work on assigned tickets** - Can edit tickets assigned to them

#### **Senior Agents (With `tickets.assign` Permission):**
- ✅ **Can reassign tickets** - Have override authority like managers
- ✅ **Can reassign any ticket** - Including tickets assigned to others

---

### 3. **Notifications When Reassigned**

#### **When Agent is Reassigned:**

1. **New Agent Receives:**
   - ✅ Assignment notification
   - ✅ Email notification
   - ✅ In-app notification

2. **Old Agent Receives:**
   - ✅ Reassignment notification
   - ✅ Email notification (if configured)
   - ✅ In-app notification: "Ticket #XXX has been reassigned from you to [New Agent Name]"

3. **Requester Receives:**
   - ✅ Update notification
   - ✅ Email notification about assignment change

**Code Implementation:**
```php
// Notify old agent if ticket was reassigned
if ($shouldNotifyOldAgent) {
    $oldAgentUser = User::find($oldAgent);
    if ($oldAgentUser) {
        $notificationService->create(
            $oldAgentUser->id,
            'ticket_reassigned',
            'Ticket Reassigned',
            "Ticket #{$ticket->ticket_number} has been reassigned from you to {$agent->name}: {$ticket->subject}",
            $ticket->id
        );
    }
}
```

#### **When Team is Assigned (Clears Agent Assignment):**

1. **Old Agent Receives:**
   - ✅ Notification: "Ticket #XXX has been reassigned from you to team [Team Name]"

2. **Team Members Receive:**
   - ✅ Assignment notification
   - ✅ Email notification

---

## 📊 Permission Matrix

| Role | `tickets.assign` Permission | Can Reassign Tickets? | Can Pick Unassigned? |
|------|---------------------------|----------------------|---------------------|
| **Super Admin** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **CEO** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **Director** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **Head of Department** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **All Managers** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **Senior Agent** | ✅ Yes | ✅ Yes (any ticket) | ✅ Yes |
| **Regular Agent** | ❌ No | ❌ No | ✅ Yes (if has edit) |
| **Requester** | ❌ No | ❌ No | ❌ No |

---

## 🔄 Reassignment Flow

### Scenario 1: Manager Reassigns Ticket Assigned to Agent

```
1. Ticket assigned to Agent A
   └─ Status: assigned
   └─ Agent A receives notification

2. Manager reassigns to Agent B
   ├─ Permission check: ✅ Manager has tickets.assign
   ├─ Reassignment allowed: ✅ Yes
   ├─ Agent A notified: ✅ "Ticket reassigned from you to Agent B"
   ├─ Agent B notified: ✅ "Ticket assigned to you"
   └─ Requester notified: ✅ "Ticket assignment updated"
```

### Scenario 2: Agent Tries to Reassign Ticket Assigned to Another Agent

```
1. Ticket assigned to Agent A
   └─ Status: assigned

2. Agent B tries to reassign to themselves
   ├─ Permission check: ❌ Agent B does NOT have tickets.assign
   ├─ Reassignment blocked: ❌ No
   └─ Result: Ticket remains assigned to Agent A
```

### Scenario 3: Senior Agent Reassigns Ticket

```
1. Ticket assigned to Agent A
   └─ Status: assigned

2. Senior Agent reassigns to Agent B
   ├─ Permission check: ✅ Senior Agent has tickets.assign
   ├─ Reassignment allowed: ✅ Yes
   ├─ Agent A notified: ✅ "Ticket reassigned from you to Agent B"
   ├─ Agent B notified: ✅ "Ticket assigned to you"
   └─ Requester notified: ✅ "Ticket assignment updated"
```

---

## 🎯 Key Points

### ✅ **What Was Implemented:**

1. **Permission Check**: Requires `tickets.assign` permission for reassignment
2. **Manager Override**: Managers/Admins can reassign any ticket
3. **Agent Restriction**: Regular agents cannot reassign (no permission)
4. **Notifications**: Previous assignee is notified when ticket is reassigned
5. **History Tracking**: All reassignments are recorded in ticket history

### ⚠️ **Important Notes:**

1. **Agents Cannot Reassign**: Regular agents don't have `tickets.assign` permission, so they cannot reassign tickets assigned to others
2. **Managers Can Override**: Managers/Admins can always reassign tickets, even if already assigned
3. **Notifications Sent**: Both old and new assignees receive notifications
4. **History Preserved**: All reassignments are logged in ticket history

---

## 📝 Code Changes

### Files Modified:

1. **`app/Http/Controllers/Admin/TicketController.php`**
   - Added permission check for `assign_agent` action
   - Added permission check for `assign_team` action
   - Added notification to old agent when reassigned
   - Added notification to old agent when team is assigned (clears agent)

### Key Changes:

```php
// Before: No permission check
case 'assign_agent':
    $ticket->assigned_agent_id = $value;
    // ...

// After: Permission check + notifications
case 'assign_agent':
    if (!Auth::user()->can('tickets.assign')) {
        continue; // Skip - no permission
    }
    // Notify old agent if reassigned
    if ($oldAgent && $oldAgent != $value) {
        // Notify old agent
    }
    // ...
```

---

## 🧪 Testing Checklist

- [ ] Manager can reassign ticket assigned to agent
- [ ] Manager can reassign ticket assigned to another manager
- [ ] Agent cannot reassign ticket assigned to another agent
- [ ] Senior Agent can reassign ticket assigned to agent
- [ ] Old agent receives notification when ticket is reassigned
- [ ] New agent receives notification when ticket is assigned
- [ ] Requester receives notification when ticket is reassigned
- [ ] Ticket history records reassignment
- [ ] Permission check prevents unauthorized reassignment

---

## ❓ Common Questions

### Q: Can an agent reassign a ticket they picked to themselves?
**A**: No, regular agents don't have `tickets.assign` permission, so they cannot reassign tickets. They can only pick unassigned tickets (if they have `tickets.edit` permission).

### Q: Can a manager reassign a ticket that an agent picked?
**A**: Yes, managers have `tickets.assign` permission and can reassign any ticket, including tickets assigned to agents.

### Q: What happens when a ticket is reassigned?
**A**: 
- Old assignee receives notification
- New assignee receives assignment notification
- Requester receives update notification
- Ticket history records the change

### Q: Can an agent unassign themselves?
**A**: Regular agents cannot reassign tickets. However, managers/admins can reassign tickets away from agents.

### Q: Who can see tickets assigned to others?
**A**: 
- Managers/Admins with `tickets.assign` can see all tickets
- Agents can only see tickets assigned to them or their team
- Requesters can see tickets they created

---

## 📊 Summary

**Before**: Anyone with `tickets.edit` could reassign tickets (no restrictions)

**After**:
- ✅ Requires `tickets.assign` permission for reassignment
- ✅ Managers/Admins can reassign any ticket (override authority)
- ✅ Regular agents cannot reassign (no permission)
- ✅ Previous assignee is notified when reassigned
- ✅ All reassignments are logged in history

**Result**: Secure, controlled ticket reassignment with proper notifications and audit trail.

---

**Implementation Date**: Based on current codebase  
**Status**: ✅ Complete and Ready for Testing

