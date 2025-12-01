# Approval Workflow: Resolved & Closed Tickets

## Overview

This document explains how the approval workflow handles tickets that are resolved, closed, or cancelled.

## Behavior Summary

### ✅ **Pending Approvals Page** - Excludes Resolved/Closed Tickets
- **Resolved tickets**: ❌ NOT shown
- **Closed tickets**: ❌ NOT shown  
- **Cancelled tickets**: ❌ NOT shown
- **Open/Assigned/In Progress/Pending tickets**: ✅ Shown (if they have pending approvals)

**Reason**: Once a ticket is resolved, closed, or cancelled, there's no action needed from approvers. Showing them would clutter the pending approvals list.

### ✅ **Ticket Detail Page** - Shows Approval History (Always)
- **All approvals are visible**: ✅ Historical approvals are always shown
- **Pending approval banner**: ❌ Hidden for resolved/closed/cancelled tickets
- **Approval actions**: ❌ Disabled for resolved/closed/cancelled tickets

**Reason**: Approval history is important for audit, compliance, and understanding ticket lifecycle. Users should be able to see who approved what and when, even after the ticket is completed.

## Implementation Details

### 1. Pending Approvals Query
**File**: `app/Http/Controllers/Admin/TicketApprovalController.php`

```php
public function pending(): Response
{
    $pendingApprovals = TicketApproval::with([
        'ticket.requester',
        'ticket.category',
        'ticket.assignedTeam',
    ])
    ->where('status', 'pending')
    ->whereHas('ticket', function ($query) {
        // Exclude tickets that are resolved, closed, or cancelled
        $query->whereNotIn('status', ['resolved', 'closed', 'cancelled']);
    })
    ->where(function ($query) {
        $query->where('approver_id', Auth::id())
            ->orWhereNull('approver_id');
    })
    ->orderBy('created_at', 'desc')
    ->paginate(20);
}
```

**What it does**:
- Only shows pending approvals
- Excludes tickets with status: `resolved`, `closed`, `cancelled`
- Only shows approvals assigned to current user

### 2. Approval Actions Protection
**File**: `app/Http/Controllers/Admin/TicketApprovalController.php`

Both `approve()` and `reject()` methods now check ticket status:

```php
// Prevent approving/rejecting tickets that are already resolved, closed, or cancelled
$ticket = $approval->ticket;
if (in_array($ticket->status, ['resolved', 'closed', 'cancelled'])) {
    return redirect()
        ->route('admin.tickets.show', $ticket)
        ->with('error', 'Cannot approve/reject a ticket that is already ' . $ticket->status . '.');
}
```

**What it does**:
- Prevents approving resolved/closed/cancelled tickets
- Prevents rejecting resolved/closed/cancelled tickets
- Shows error message to user

### 3. UI Display Logic
**File**: `resources/js/pages/Admin/Tickets/Show.tsx`

**Pending Approval Banner**:
```tsx
{/* Only show pending approval banner if ticket is not resolved/closed/cancelled */}
{ticket.current_approval && 
 ticket.current_approval.status === 'pending' && 
 !['resolved', 'closed', 'cancelled'].includes(ticket.status) && (
  // Show approval banner
)}
```

**Approval History Section**:
```tsx
{/* Always show approval history for audit purposes */}
{(ticket.approvals && ticket.approvals.length > 0) && (
  // Show all approvals (pending, approved, rejected)
)}
```

**What it does**:
- Hides pending approval banner for resolved/closed/cancelled tickets
- Always shows approval history section (for audit)
- Approval buttons are automatically disabled (via status check)

## User Experience

### Scenario 1: Ticket with Pending Approval Gets Resolved
1. **Before Resolution**:
   - Ticket shows in "Pending Approvals" page
   - Ticket detail page shows "Pending Approval" banner
   - Approve/Reject buttons are visible

2. **After Resolution**:
   - Ticket removed from "Pending Approvals" page
   - Ticket detail page hides "Pending Approval" banner
   - Approval history still visible (shows pending approval)
   - Approve/Reject buttons hidden

3. **If User Tries to Approve** (via direct URL):
   - System prevents action
   - Shows error: "Cannot approve a ticket that is already resolved."

### Scenario 2: Viewing Resolved Ticket with Approval History
1. User opens resolved ticket
2. **Sees**:
   - ✅ All approval records (LM approved, HOD approved, etc.)
   - ✅ Approval timestamps
   - ✅ Approver names
   - ✅ Approval comments
   - ✅ Routing information

3. **Does NOT See**:
   - ❌ "Pending Approval" banner
   - ❌ Approve/Reject buttons
   - ❌ Active approval actions

## Edge Cases Handled

### Edge Case 1: Ticket Resolved While Approval Pending
**Situation**: Ticket is resolved by agent while approval is still pending.

**Behavior**:
- Approval record remains in database (status: pending)
- Ticket removed from pending approvals list
- Approval history shows pending approval
- No action can be taken on the approval

**Why**: The ticket is done, so approval is no longer needed. Historical record preserved for audit.

### Edge Case 2: Direct URL Access to Approval
**Situation**: User tries to approve a resolved ticket via direct URL.

**Behavior**:
- System checks ticket status
- Returns error message
- Redirects to ticket detail page
- No approval action is performed

**Why**: Prevents accidental approvals on completed tickets.

### Edge Case 3: Multiple Approvals on Resolved Ticket
**Situation**: Ticket has both LM and HOD approvals, then gets resolved.

**Behavior**:
- All approval records remain visible
- Shows complete approval chain
- No pending approvals shown
- Historical data preserved

**Why**: Full audit trail is important for compliance.

## Database Considerations

### Approval Records
- **Never deleted**: Approval records are preserved even after ticket resolution
- **Status preserved**: Pending approvals remain "pending" even if ticket is resolved
- **Audit trail**: Complete history available for reporting

### Ticket Status
- **Resolved**: Ticket completed, no further action needed
- **Closed**: Ticket closed (may be reopened)
- **Cancelled**: Ticket cancelled (usually due to rejection)

## Best Practices

### For Approvers
1. ✅ Check "Pending Approvals" page regularly
2. ✅ Approve/reject tickets before they're resolved
3. ✅ Review approval history on resolved tickets for reference

### For Agents
1. ✅ Don't resolve tickets with pending approvals (if possible)
2. ✅ Check approval status before resolving
3. ✅ If ticket must be resolved, approval will be automatically excluded from pending list

### For Administrators
1. ✅ Approval history is always available for audit
2. ✅ Resolved tickets don't clutter pending approvals
3. ✅ System prevents invalid approval actions

## Testing

### Test Case 1: Resolved Ticket Not in Pending Approvals
1. Create ticket with pending approval
2. Resolve the ticket
3. Login as approver
4. Go to "Pending Approvals" page
5. **Expected**: Ticket not shown

### Test Case 2: Approval History Visible on Resolved Ticket
1. Create ticket
2. Get LM approval
3. Get HOD approval
4. Resolve ticket
5. View ticket detail page
6. **Expected**: All approvals visible in history section

### Test Case 3: Cannot Approve Resolved Ticket
1. Create ticket with pending approval
2. Resolve ticket
3. Try to approve via direct URL
4. **Expected**: Error message, no approval action

## Summary

| Aspect | Resolved/Closed Tickets |
|--------|------------------------|
| **Pending Approvals Page** | ❌ Not shown |
| **Approval History** | ✅ Always visible |
| **Pending Approval Banner** | ❌ Hidden |
| **Approve/Reject Actions** | ❌ Disabled/Prevented |
| **Audit Trail** | ✅ Preserved |

**Key Principle**: 
- **Actionable items** (pending approvals) are hidden for resolved/closed tickets
- **Historical data** (approval records) is always visible for audit/compliance

