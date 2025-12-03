# Approval Workflow Test Scenarios

This document provides comprehensive test scenarios for the ticket approval workflow system.

## Overview

The approval workflow follows this structure:
1. **Ticket Created** → Check if approval required
2. **Line Manager (LM) Approval** → First level (if required)
3. **Head of Department (HOD) Approval** → Second level (if cost threshold met or category requires)
4. **Ticket Routed** → Assigned to appropriate team

## Test Setup

### Prerequisites
- Run all seeders: `php artisan db:seed --force`
- Ensure you have users with appropriate roles:
  - Super Admin
  - Head of Department (HOD)
  - Line Manager
  - Requester (regular user)

### Test Users
- **Super Admin**: `bringerhorror@gmail.com` / `password`
- **HOD**: `kmhodsokun@outlook.com` / `password`
- **Line Manager**: `fnak98755@gmail.com` / `password`
- **Requester**: `chanthou121@outlook.com` / `password`

---

## Scenario 1: No Approval Required (Routine Ticket)

### Objective
Test that tickets in categories without approval requirements are routed directly to the team.

### Steps
1. **Create Ticket**
   - Category: `Network & Connectivity` (no approval required)
   - Subject: "Wi-Fi connection issue in office"
   - Priority: Medium
   - Estimated Cost: $0
   - Requester: Regular user

### Expected Results
- ✅ Ticket created with status: `assigned` (not `pending`)
- ✅ No approval records created
- ✅ Ticket automatically assigned to IT Service Desk team
- ✅ No approval emails sent
- ✅ Ticket can be worked on immediately

### Verification
```php
// In Tinker
$ticket = Ticket::where('subject', 'Wi-Fi connection issue')->first();
$ticket->approvals()->count(); // Should be 0
$ticket->status; // Should be 'assigned'
$ticket->assigned_team_id; // Should be IT-SD team ID
```

---

## Scenario 2: LM Approval Only (Low Cost)

### Objective
Test that tickets requiring LM approval but below HOD threshold only need LM approval.

### Steps
1. **Create Ticket**
   - Category: `Hardware Requests` (requires approval, HOD threshold: $1,000)
   - Subject: "Request for new keyboard"
   - Priority: Medium
   - Estimated Cost: $50
   - Requester: Regular user

### Expected Results
- ✅ Ticket created with status: `pending`
- ✅ LM approval record created (status: `pending`)
- ✅ Line Manager receives approval request email
- ✅ Ticket NOT assigned to team yet
- ✅ No HOD approval created (cost < $1,000)

### Verification
```php
$ticket = Ticket::where('subject', 'Request for new keyboard')->first();
$approvals = $ticket->approvals;
$approvals->count(); // Should be 1
$approvals->first()->approval_level; // Should be 'lm'
$approvals->first()->status; // Should be 'pending'
```

### Approval Steps
1. **Line Manager Approves**
   - Login as Line Manager
   - Go to Pending Approvals page
   - Approve the ticket
   - Add comment: "Approved - within budget"

### Expected Results After LM Approval
- ✅ LM approval status: `approved`
- ✅ Ticket status: `assigned`
- ✅ Ticket assigned to IT Service Desk team
- ✅ Requester receives approval notification
- ✅ No HOD approval created (cost below threshold)
- ✅ Ticket can be worked on

---

## Scenario 3: LM + HOD Approval (High Cost)

### Objective
Test that tickets exceeding cost threshold require both LM and HOD approval.

### Steps
1. **Create Ticket**
   - Category: `Hardware Requests` (HOD threshold: $1,000)
   - Subject: "Request for 10 new laptops"
   - Priority: High
   - Estimated Cost: $15,000
   - Requester: Regular user

### Expected Results
- ✅ Ticket created with status: `pending`
- ✅ LM approval created (status: `pending`)
- ✅ Line Manager receives approval request email
- ✅ No HOD approval yet (waiting for LM approval)

### Verification
```php
$ticket = Ticket::where('subject', 'Request for 10 new laptops')->first();
$approvals = $ticket->approvals;
$approvals->count(); // Should be 1 (only LM)
$approvals->first()->approval_level; // Should be 'lm'
```

### Step 1: Line Manager Approves
1. Login as Line Manager
2. Approve the ticket
3. Comment: "Approved - needed for new project team"

### Expected Results After LM Approval
- ✅ LM approval status: `approved`
- ✅ HOD approval automatically created (cost > $1,000)
- ✅ HOD receives approval request email
- ✅ Ticket status: Still `pending` (waiting for HOD)
- ✅ Ticket NOT assigned to team yet

### Verification After LM Approval
```php
$ticket->refresh();
$approvals = $ticket->approvals()->orderBy('sequence')->get();
$approvals->count(); // Should be 2
$approvals[0]->approval_level; // Should be 'lm'
$approvals[0]->status; // Should be 'approved'
$approvals[1]->approval_level; // Should be 'hod'
$approvals[1]->status; // Should be 'pending'
```

### Step 2: HOD Approves
1. Login as Head of Department
2. Go to Pending Approvals page
3. Approve the ticket
4. Comment: "Approved - budget allocated"

### Expected Results After HOD Approval
- ✅ HOD approval status: `approved`
- ✅ Ticket status: `assigned`
- ✅ Ticket assigned to IT Service Desk team
- ✅ Requester receives final approval notification
- ✅ Ticket can be processed

---

## Scenario 4: LM Approval Rejected

### Objective
Test that rejected tickets are properly handled and requester is notified.

### Steps
1. **Create Ticket**
   - Category: `Hardware Requests`
   - Subject: "Request for gaming laptop"
   - Priority: Medium
   - Estimated Cost: $2,500
   - Requester: Regular user

2. **Line Manager Rejects**
   - Login as Line Manager
   - Reject the ticket
   - Comment: "Rejected - not business justified"

### Expected Results
- ✅ LM approval status: `rejected`
- ✅ Ticket status: `rejected` or `cancelled`
- ✅ Requester receives rejection notification
- ✅ No HOD approval created
- ✅ Ticket cannot be processed

### Verification
```php
$ticket = Ticket::where('subject', 'Request for gaming laptop')->first();
$approval = $ticket->approvals()->first();
$approval->status; // Should be 'rejected'
$approval->comments; // Should contain rejection reason
$ticket->status; // Should be 'rejected' or 'cancelled'
```

---

## Scenario 5: HOD Approval Rejected

### Objective
Test that HOD can reject tickets even after LM approval.

### Steps
1. **Create Ticket**
   - Category: `Hardware Requests`
   - Subject: "Request for server equipment"
   - Priority: High
   - Estimated Cost: $25,000
   - Requester: Regular user

2. **Line Manager Approves**
   - Approve with comment: "Approved - needed for infrastructure"

3. **HOD Rejects**
   - Login as HOD
   - Reject the ticket
   - Comment: "Rejected - exceeds annual budget limit"

### Expected Results
- ✅ LM approval status: `approved`
- ✅ HOD approval status: `rejected`
- ✅ Ticket status: `rejected` or `cancelled`
- ✅ Requester receives rejection notification
- ✅ Ticket cannot be processed

---

## Scenario 6: Auto-Approve Permission (Bypass Workflow)

### Objective
Test that users with `tickets.auto-approve` permission bypass approval workflow.

### Steps
1. **Create Ticket as Super Admin**
   - Category: `Hardware Requests` (normally requires approval)
   - Subject: "Urgent server replacement"
   - Priority: Critical
   - Estimated Cost: $5,000
   - Requester: Super Admin user

### Expected Results
- ✅ Ticket created with status: `assigned` (not `pending`)
- ✅ No approval records created
- ✅ Ticket automatically assigned to team
- ✅ Workflow bypassed due to auto-approve permission

### Verification
```php
$ticket = Ticket::where('subject', 'Urgent server replacement')->first();
$ticket->approvals()->count(); // Should be 0
$ticket->status; // Should be 'assigned'
$ticket->requester->can('tickets.auto-approve'); // Should be true
```

---

## Scenario 7: Category with Always Require HOD Approval

### Objective
Test categories that always require HOD approval regardless of cost.

### Steps
1. **Create Ticket**
   - Category: `Purchase Request` (if configured to always require HOD)
   - Subject: "Office supplies order"
   - Priority: Medium
   - Estimated Cost: $200
   - Requester: Regular user

### Expected Results
- ✅ LM approval created first
- ✅ After LM approval, HOD approval created (even though cost < threshold)
- ✅ Both approvals required

---

## Scenario 8: Cost Threshold Edge Cases

### Objective
Test cost threshold boundaries.

### Test Cases

#### 8a: Cost Exactly at Threshold
- Category: `Hardware Requests` (threshold: $1,000)
- Estimated Cost: $1,000.00
- **Expected**: HOD approval required (cost >= threshold)

#### 8b: Cost Just Below Threshold
- Category: `Hardware Requests` (threshold: $1,000)
- Estimated Cost: $999.99
- **Expected**: No HOD approval (cost < threshold)

#### 8c: Cost Just Above Threshold
- Category: `Hardware Requests` (threshold: $1,000)
- Estimated Cost: $1,000.01
- **Expected**: HOD approval required (cost >= threshold)

#### 8d: No Cost Provided
- Category: `Hardware Requests` (threshold: $1,000)
- Estimated Cost: NULL or $0
- **Expected**: No HOD approval (cost is 0 or null)

---

## Scenario 9: Multiple Approvals Sequence

### Objective
Test that approvals are processed in correct sequence.

### Steps
1. Create ticket requiring both LM and HOD approval
2. Try to approve HOD before LM

### Expected Results
- ✅ HOD approval should not be processable until LM is approved
- ✅ System enforces sequence order
- ✅ Only current pending approval can be processed

---

## Scenario 10: Bulk Approval Operations

### Objective
Test approving multiple tickets at once.

### Steps
1. Create 3 tickets requiring LM approval
2. Login as Line Manager
3. Go to Pending Approvals page
4. Approve all 3 tickets

### Expected Results
- ✅ All 3 tickets approved
- ✅ All tickets routed to appropriate teams
- ✅ All requesters notified
- ✅ HOD approvals created for tickets exceeding threshold

---

## Scenario 11: Approval Comments and History

### Objective
Test that approval comments and history are properly recorded.

### Steps
1. Create ticket requiring approval
2. Approve with comment: "Approved for Q1 budget"
3. Check ticket history

### Expected Results
- ✅ Approval comment saved
- ✅ History entry created
- ✅ Comment visible in ticket details
- ✅ Approval timestamp recorded

### Verification
```php
$ticket = Ticket::find($ticketId);
$approval = $ticket->approvals()->approved()->first();
$approval->comments; // Should contain "Approved for Q1 budget"
$approval->approved_at; // Should be set
$ticket->histories()->where('action', 'approved')->exists(); // Should be true
```

---

## Scenario 12: Approval Timeout/Escalation

### Objective
Test handling of overdue approvals (if implemented).

### Steps
1. Create ticket requiring approval
2. Wait for approval deadline to pass
3. Check if escalation occurs

### Expected Results
- ✅ System detects overdue approval
- ✅ Escalation notification sent (if implemented)
- ✅ Manager notified of pending approval

---

## Scenario 13: Different Category Approval Settings

### Objective
Test various category approval configurations.

### Test Cases

#### 13a: No Approval Required
- Category: `Application Access`
- **Expected**: Direct routing, no approvals

#### 13b: LM Approval Only
- Category: `Hardware Issues` (repairs)
- **Expected**: Only LM approval

#### 13c: LM + HOD (Cost-Based)
- Category: `Hardware Requests` (threshold: $1,000)
- Cost: $1,500
- **Expected**: Both LM and HOD approval

#### 13d: LM + HOD (Always Required)
- Category: `Purchase Request` (if configured)
- **Expected**: Both approvals always required

---

## Scenario 14: Approval Workflow with Different Priorities

### Objective
Test if priority affects approval requirements.

### Steps
1. Create tickets with different priorities:
   - Low priority ticket
   - Medium priority ticket
   - High priority ticket
   - Critical priority ticket

### Expected Results
- ✅ Approval workflow consistent regardless of priority
- ✅ Priority may affect SLA but not approval requirements
- ✅ Approval notifications include priority information

---

## Scenario 15: Approval Workflow Email Notifications

### Objective
Test all email notifications in approval workflow.

### Test Cases

#### 15a: Approval Request Email
- **Recipient**: Approver (LM or HOD)
- **Content**: Ticket details, requester info, approval link
- **Trigger**: When approval is created

#### 15b: Approval Approved Email
- **Recipient**: Requester
- **Content**: Approval confirmation, approver name, comments
- **Trigger**: When approval is approved

#### 15c: Approval Rejected Email
- **Recipient**: Requester
- **Content**: Rejection reason, approver name, comments
- **Trigger**: When approval is rejected

#### 15d: Final Approval Email
- **Recipient**: Requester
- **Content**: Final approval confirmation, ticket routed
- **Trigger**: When all approvals complete

---

## Scenario 16: Approval Workflow with Missing Approvers

### Objective
Test behavior when approver cannot be found.

### Steps
1. Create ticket from user without Line Manager
2. Check system behavior

### Expected Results
- ✅ System attempts to find approver
- ✅ Falls back to department manager or Super Admin
- ✅ Logs warning if approver not found
- ✅ Ticket still created (may need manual assignment)

---

## Scenario 17: Resubmission After Rejection

### Objective
Test that rejected tickets can be resubmitted.

### Steps
1. Create ticket
2. Get it rejected
3. Resubmit with modifications

### Expected Results
- ✅ Resubmission creates new approval workflow
- ✅ Previous rejection history preserved
- ✅ New approval cycle starts

---

## Scenario 18: Approval Workflow with Project Association

### Objective
Test approval workflow for tickets associated with projects.

### Steps
1. Create ticket with project assigned
2. Go through approval workflow

### Expected Results
- ✅ Approval workflow works normally
- ✅ Project information included in approval notifications
- ✅ Project manager may be notified (if configured)

---

## Scenario 19: Approval Workflow Performance

### Objective
Test system performance with multiple concurrent approvals.

### Steps
1. Create 50 tickets requiring approval
2. Process approvals concurrently
3. Monitor system performance

### Expected Results
- ✅ System handles concurrent approvals efficiently
- ✅ No database deadlocks
- ✅ Email notifications sent correctly
- ✅ No data corruption

---

## Scenario 20: Approval Workflow Audit Trail

### Objective
Test that all approval actions are properly logged.

### Steps
1. Create ticket
2. Approve/reject at each level
3. Check audit trail

### Expected Results
- ✅ All approval actions logged in ticket history
- ✅ Timestamps recorded accurately
- ✅ User IDs tracked
- ✅ Comments preserved
- ✅ Status changes documented

---

## Quick Test Checklist

Use this checklist for quick validation:

- [ ] Ticket without approval requirement routes directly
- [ ] Ticket with approval requirement creates LM approval
- [ ] LM approval sends email notification
- [ ] LM approval routes ticket after approval
- [ ] High-cost ticket creates HOD approval after LM
- [ ] HOD approval sends email notification
- [ ] HOD approval routes ticket after approval
- [ ] Rejected ticket notifies requester
- [ ] Auto-approve permission bypasses workflow
- [ ] Approval comments saved correctly
- [ ] Approval history recorded
- [ ] Bulk approvals work correctly
- [ ] Cost threshold logic works correctly
- [ ] Email notifications sent for all events

---

## Testing Commands

### Create Test Ticket
```php
php artisan tinker

$requester = User::where('email', 'chanthou121@outlook.com')->first();
$category = TicketCategory::where('slug', 'hardware-requests')->first();

$ticket = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => 'Test Hardware Request',
    'description' => 'Testing approval workflow',
    'requester_id' => $requester->id,
    'category_id' => $category->id,
    'priority' => 'high',
    'estimated_cost' => 1500.00,
    'status' => 'open',
]);

// Initialize workflow
app(\App\Services\ApprovalWorkflowService::class)->initializeWorkflow($ticket);
```

### Check Approval Status
```php
$ticket = Ticket::find($ticketId);
$ticket->approvals()->get();
$ticket->currentApproval();
$ticket->pendingApprovals()->get();
```

### Approve Ticket
```php
$approval = TicketApproval::find($approvalId);
app(\App\Services\ApprovalWorkflowService::class)->approve($approval, 'Test approval comment');
```

### Reject Ticket
```php
$approval = TicketApproval::find($approvalId);
app(\App\Services\ApprovalWorkflowService::class)->reject($approval, 'Test rejection reason');
```

---

## Expected Email Flow

### Scenario: High-Cost Hardware Request ($15,000)

1. **Ticket Created**
   - Email to: Requester
   - Subject: "Ticket Created: Request for 10 new laptops"

2. **LM Approval Requested**
   - Email to: Line Manager
   - Subject: "Approval Required: Request for 10 new laptops"
   - Content: Ticket details, cost, approval link

3. **LM Approved**
   - Email to: Requester
   - Subject: "Ticket Approved by Line Manager"
   - Content: Approval confirmation

4. **HOD Approval Requested** (auto-created)
   - Email to: Head of Department
   - Subject: "Approval Required: Request for 10 new laptops"
   - Content: Ticket details, cost, LM approval status

5. **HOD Approved**
   - Email to: Requester
   - Subject: "Ticket Approved - Ready for Processing"
   - Content: Final approval, ticket routed to team

---

## Troubleshooting

### Issue: Approval not created
- Check category `requires_approval` setting
- Check user has `tickets.auto-approve` permission
- Check logs for errors

### Issue: HOD approval not triggered
- Verify cost exceeds threshold
- Check category `requires_hod_approval` setting
- Check `hod_approval_threshold` value

### Issue: Email not sent
- Check email configuration
- Check email template exists
- Check logs for email errors

### Issue: Ticket not routed
- Check category has `default_team_id`
- Check approval was actually approved
- Check ticket status

---

## Notes

- Approval workflow is initialized when ticket is created
- Approvals are processed sequentially (LM → HOD)
- Cost-based HOD approval only triggers after LM approval
- Rejected tickets stop the workflow immediately
- Users with `tickets.auto-approve` bypass all approvals

