# Real User Approval Workflow Test Scenarios

## Overview

This document provides comprehensive test scenarios for the ticket approval workflow using real user accounts with actual email addresses.

## Test Users

### Primary Test Users

1. **Makara** (`sonmakara69@gmail.com`)
   - Role: Super Admin
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-1001
   - Password: `password`
   - **Use Case**: System administrator, can view all tickets and manage system

2. **Vanny** (`vannysmilekh@gmail.com`)
   - Role: Super Admin
   - Department: Procurement (PROC)
   - Employee ID: EMP-1050
   - Password: `password`
   - **Use Case**: Procurement administrator, can approve procurement tickets

3. **Vannak** (`fnak98755@gmail.com`)
   - Role: Line Manager
   - Department: Field Engineering (FIELD-ENG)
   - Employee ID: EMP-1020
   - Password: `password`
   - **Use Case**: First-level approver for Field Engineering tickets

4. **Sokuntha** (`sokuntha@kimmix.com`)
   - Role: Head of Department (HOD)
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-0999
   - Password: `password`
   - **Use Case**: Final approver for high-value or critical tickets

### Additional Test Users

5. **Dongdong** (`dongdongmi72@gmail.com`)
   - **Use Case**: Can be assigned as Requester, Agent, or Manager for testing
   - Password: `password` (assume default)

6. **Sunwukhong** (`sunwukhongking@gmail.com`)
   - **Use Case**: Can be assigned as Requester, Agent, or Manager for testing
   - Password: `password` (assume default)

---

## Test Scenarios

### Scenario 1: IT Hardware Request - LM Approval Only
**Objective**: Test Line Manager approval for IT hardware requests under threshold

**Prerequisites**:
- Ensure Vannak (Line Manager) is active
- Ensure Sokuntha (HOD) is active

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Navigate to **Tickets** → **Create New Ticket**
3. Fill in ticket details:
   - **Subject**: "Request for new wireless mouse"
   - **Description**: "My current mouse is not working properly. Need a replacement wireless mouse for daily work."
   - **Category**: IT Support → Hardware
   - **Priority**: Medium
   - **Assigned Team**: IT Service Desk
   - **Requester**: Makara (self)
4. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "pending" (waiting for approval)
- ✅ Line Manager approval request created
- ✅ Email notification sent to Vannak (Line Manager) or appropriate LM
- ✅ Ticket visible in "Pending Approvals" for Line Manager
- ✅ No HOD approval created (under $1000 threshold)

**Verification Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`)
2. Navigate to **Tickets** → **Pending Approvals**
3. Verify ticket appears in pending list
4. Click on ticket to view details
5. Click **Approve** button
6. Add optional comment: "Approved - Standard equipment replacement"
7. Submit approval

**Post-Approval Expected Results**:
- ✅ Ticket status changes to "assigned"
- ✅ Ticket routed to IT Service Desk team
- ✅ Email notification sent to ticket requester (Makara)
- ✅ Approval history shows LM approval
- ✅ No HOD approval required

---

### Scenario 2: High-Value Hardware Request - LM + HOD Approval
**Objective**: Test two-level approval for expensive hardware purchases

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Create new ticket:
   - **Subject**: "Request for new laptop - Dell Latitude 5540"
   - **Description**: "Current laptop is 5 years old and frequently crashes. Need replacement laptop for software development work. Estimated cost: $1,200."
   - **Category**: IT Support → Hardware
   - **Priority**: High
   - **Assigned Team**: IT Service Desk
   - **Requester**: Makara
3. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "pending"
- ✅ Line Manager approval request created
- ✅ Email notification sent to Line Manager

**LM Approval Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`) or appropriate Line Manager
2. Navigate to **Pending Approvals**
3. Approve the ticket with comment: "Approved - Laptop replacement needed for productivity"

**Post-LM Approval Expected Results**:
- ✅ HOD approval request automatically created
- ✅ Email notification sent to Sokuntha (HOD)
- ✅ Ticket still shows "pending" status (waiting for HOD)

**HOD Approval Steps**:
1. Login as **Sokuntha** (`sokuntha@kimmix.com`)
2. Navigate to **Pending Approvals**
3. Verify ticket appears with "HOD Approval Required" badge
4. Review ticket details and LM approval comments
5. Click **Approve** button
6. Add comment: "Approved - Budget allocated for Q1 equipment refresh"
7. Submit approval

**Final Expected Results**:
- ✅ Ticket status changes to "assigned"
- ✅ Ticket routed to IT Service Desk team
- ✅ Email notifications sent to requester and assigned team
- ✅ Approval history shows both LM and HOD approvals
- ✅ Ticket ready for agent assignment

---

### Scenario 3: Procurement Request - Requires HOD Approval
**Objective**: Test procurement approval workflow with HOD threshold

**Steps**:
1. Login as **Vanny** (`vannysmilekh@gmail.com`)
2. Create new ticket:
   - **Subject**: "Purchase Request - Office Supplies"
   - **Description**: "Need to purchase office supplies for Q1: printer paper, pens, folders. Estimated cost: $750."
   - **Category**: Procurement Requests
   - **Priority**: Medium
   - **Assigned Team**: Procurement
   - **Requester**: Vanny
3. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "pending"
- ✅ Line Manager approval required first
- ✅ Email notification sent to appropriate Line Manager

**LM Approval Steps**:
1. Login as appropriate Line Manager (e.g., Vanny LM if exists, or assign Vannak)
2. Navigate to **Pending Approvals**
3. Approve ticket: "Approved - Standard quarterly supplies"

**Post-LM Approval Expected Results**:
- ✅ HOD approval automatically created (cost > $500 threshold)
- ✅ Email notification sent to Sokuntha (HOD)

**HOD Approval Steps**:
1. Login as **Sokuntha** (`sokuntha@kimmix.com`)
2. Navigate to **Pending Approvals**
3. Approve ticket: "Approved - Budget approved for office supplies"

**Final Expected Results**:
- ✅ Ticket status changes to "assigned"
- ✅ Ticket routed to Procurement team
- ✅ Complete approval chain recorded

---

### Scenario 4: Routine Ticket - No Approval Required
**Objective**: Test that routine tickets bypass approval workflow

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Create new ticket:
   - **Subject**: "Cannot connect to office Wi-Fi"
   - **Description**: "My laptop cannot connect to the office Wi-Fi network. Tried restarting but issue persists."
   - **Category**: IT Support → Network & VPN
   - **Priority**: Low
   - **Assigned Team**: IT Service Desk
   - **Requester**: Makara
3. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "assigned" (immediately)
- ✅ No approval requests created
- ✅ Ticket routed directly to IT Service Desk team
- ✅ Email notification sent to assigned team
- ✅ No approval emails sent
- ✅ Ticket ready for agent to work on

**Verification**:
- Check `ticket_approvals` table - should have 0 records for this ticket
- Check email logs - should only have ticket created/assigned emails

---

### Scenario 5: Approval Rejection and Resubmission
**Objective**: Test rejection workflow and ticket resubmission

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Create ticket requiring approval:
   - **Subject**: "Request for premium software license"
   - **Description**: "Need Adobe Creative Suite license for design work. Cost: $600/year."
   - **Category**: IT Support → Hardware (or appropriate category)
   - **Priority**: Medium
   - **Assigned Team**: IT Service Desk
3. Submit ticket

**LM Rejection Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`) or appropriate Line Manager
2. Navigate to **Pending Approvals**
3. Click on ticket
4. Click **Reject** button
5. Enter rejection reason: "Budget not available this quarter. Please resubmit in Q2."
6. Submit rejection

**Expected Results**:
- ✅ Ticket status changes to "cancelled"
- ✅ Approval status shows "rejected"
- ✅ Email notification sent to requester (Makara)
- ✅ Ticket visible in "Rejected Tickets" section
- ✅ Rejection reason visible in ticket history

**Resubmission Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Navigate to **Tickets** → **Rejected Tickets**
3. Find the rejected ticket
4. Click **Resubmit** button
5. Update description: "Updated request: Need Adobe Creative Suite license for Q2. Budget confirmed available."
6. Submit resubmission

**Expected Results**:
- ✅ New approval request created
- ✅ Ticket status changes to "pending"
- ✅ Email notification sent to Line Manager
- ✅ Previous rejection history preserved
- ✅ New approval workflow starts

---

### Scenario 6: Field Engineering Equipment Failure
**Objective**: Test approval workflow for field operations

**Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`) as requester
   - Note: If Vannak is only Line Manager, use **Dongdong** (`dongdongmi72@gmail.com`) as requester
2. Create ticket:
   - **Subject**: "Crane equipment failure at Site A"
   - **Description**: "Crane #5 at construction site A has hydraulic failure. Needs immediate repair or replacement. Estimated repair cost: $3,500."
   - **Category**: Site Operations → Equipment Failure
   - **Priority**: Critical
   - **Assigned Team**: Field Engineering
   - **Requester**: Vannak or Dongdong
3. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "pending"
- ✅ Line Manager approval required
- ✅ Email notification sent to Line Manager

**LM Approval Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`) as Line Manager
   - Note: If Vannak is the requester, use another Line Manager or assign Vannak as approver
2. Navigate to **Pending Approvals**
3. Approve ticket: "Approved - Critical equipment needs immediate attention"

**Post-LM Approval Expected Results**:
- ✅ HOD approval automatically created (high cost)
- ✅ Email notification sent to Sokuntha (HOD) or appropriate HOD

**HOD Approval Steps**:
1. Login as **Sokuntha** (`sokuntha@kimmix.com`)
2. Navigate to **Pending Approvals**
3. Approve ticket: "Approved - Safety critical, expedite repair"

**Final Expected Results**:
- ✅ Ticket status changes to "assigned"
- ✅ Ticket routed to Field Engineering team
- ✅ All approvals recorded
- ✅ Ticket ready for field team action

---

### Scenario 7: Multiple Tickets - Batch Approval Testing
**Objective**: Test approving multiple tickets in sequence

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Create 3 tickets requiring approval:
   - Ticket 1: "Request for monitor upgrade" (Hardware, Medium priority)
   - Ticket 2: "Need new keyboard" (Hardware, Low priority)
   - Ticket 3: "Request for standing desk" (Hardware, Medium priority)
3. Submit all tickets

**Approval Steps**:
1. Login as **Vannak** (`fnak98755@gmail.com`) or appropriate Line Manager
2. Navigate to **Pending Approvals**
3. Verify all 3 tickets appear in pending list
4. Approve each ticket one by one:
   - Ticket 1: "Approved"
   - Ticket 2: "Approved"
   - Ticket 3: "Approved"

**Expected Results**:
- ✅ All tickets processed correctly
- ✅ Each ticket shows individual approval
- ✅ Email notifications sent for each approval
- ✅ All tickets move to "assigned" status

---

### Scenario 8: Super Admin Override
**Objective**: Test that Super Admins can view and manage all approvals

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`) - Super Admin
2. Create ticket requiring approval:
   - **Subject**: "Test ticket for admin override"
   - **Category**: IT Support → Hardware
   - **Priority**: High
3. Submit ticket

**Admin Verification Steps**:
1. As **Makara**, navigate to **Tickets**
2. Verify ticket is visible in ticket list
3. Click on ticket to view details
4. Verify approval status is visible
5. Verify ability to view approval history
6. Verify ability to assign ticket directly (if needed)

**Expected Results**:
- ✅ Super Admin can see all tickets regardless of approval status
- ✅ Super Admin can view approval details
- ✅ Super Admin can assign tickets if needed
- ✅ Super Admin receives notifications (if configured)

---

### Scenario 9: Email Notification Testing
**Objective**: Verify email notifications work correctly for all approval events

**Test Setup**:
1. Ensure email templates are configured:
   - `approval_lm_requested`
   - `approval_hod_requested`
   - `approval_lm_approved`
   - `approval_hod_approved`
   - `approval_lm_rejected`
   - `approval_hod_rejected`

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`)
2. Create ticket requiring approval:
   - **Subject**: "Email notification test ticket"
   - **Category**: IT Support → Hardware
   - **Priority**: Medium
3. Submit ticket

**Verification Checklist**:
- ✅ Email sent to Line Manager when approval requested
- ✅ Email sent to requester when LM approves
- ✅ Email sent to HOD when HOD approval needed
- ✅ Email sent to requester when HOD approves
- ✅ Email sent to requester if rejected
- ✅ Email contains correct ticket details
- ✅ Email contains approval comments (if provided)
- ✅ Email contains ticket URL for easy access

---

### Scenario 10: Cross-Department Approval
**Objective**: Test approval workflow when requester and approver are in different departments

**Steps**:
1. Login as **Vanny** (`vannysmilekh@gmail.com`) - PROC department
2. Create ticket:
   - **Subject**: "IT equipment needed for procurement team"
   - **Description**: "Procurement team needs new computers for new staff members."
   - **Category**: IT Support → Hardware
   - **Priority**: Medium
   - **Assigned Team**: IT Service Desk
   - **Requester**: Vanny (PROC department)
3. Submit ticket

**Expected Results**:
- ✅ Ticket created successfully
- ✅ Approval workflow finds appropriate Line Manager (may be from IT-SD or PROC)
- ✅ Email notification sent to correct approver
- ✅ Approval process works correctly despite cross-department request

---

## Testing Checklist

### Pre-Testing Setup
- [ ] All test users are active in the system
- [ ] All users have correct roles assigned
- [ ] All users have correct department assignments
- [ ] Email templates are configured
- [ ] Email notifications are enabled
- [ ] Ticket categories have correct approval settings

### Test Execution Checklist
- [ ] Scenario 1: LM Approval Only - ✅ Pass / ❌ Fail
- [ ] Scenario 2: LM + HOD Approval - ✅ Pass / ❌ Fail
- [ ] Scenario 3: Procurement HOD Approval - ✅ Pass / ❌ Fail
- [ ] Scenario 4: No Approval Required - ✅ Pass / ❌ Fail
- [ ] Scenario 5: Rejection and Resubmission - ✅ Pass / ❌ Fail
- [ ] Scenario 6: Field Engineering Approval - ✅ Pass / ❌ Fail
- [ ] Scenario 7: Batch Approval - ✅ Pass / ❌ Fail
- [ ] Scenario 8: Super Admin Override - ✅ Pass / ❌ Fail
- [ ] Scenario 9: Email Notifications - ✅ Pass / ❌ Fail
- [ ] Scenario 10: Cross-Department - ✅ Pass / ❌ Fail

### Verification Points
- [ ] Approval requests are created correctly
- [ ] Email notifications are sent
- [ ] Ticket status updates correctly
- [ ] Approval history is recorded
- [ ] Rejected tickets can be resubmitted
- [ ] HOD approval triggers correctly
- [ ] No duplicate approvals created
- [ ] Resolved/closed tickets don't show in pending approvals

---

## Troubleshooting

### Common Issues

1. **Approval not appearing in Pending Approvals**
   - Check user roles are correct
   - Verify department assignments
   - Check ticket category approval settings
   - Verify ticket status is not resolved/closed

2. **Email notifications not sending**
   - Check email template configuration
   - Verify email service is configured
   - Check application logs for errors
   - Verify user email addresses are correct

3. **HOD approval not triggering**
   - Check category `requires_hod_approval` setting
   - Verify `hod_approval_threshold` is set correctly
   - Check if LM approval was completed first
   - Verify HOD user exists and is active

4. **Duplicate approvals created**
   - This should be fixed, but if it occurs:
   - Check `ApprovalWorkflowService::checkNextApproval()` method
   - Verify no duplicate pending approvals exist
   - Check ticket approval history

---

## Notes

- All test users use password: `password` (change in production!)
- Email addresses are real and can receive notifications
- Test during business hours if email delivery is time-sensitive
- Document any issues found during testing
- Update this document with additional scenarios as needed

---

## Additional Test Users Setup

If you need to assign roles to the additional users:

### For Dongdong (`dongdongmi72@gmail.com`):
- Can be assigned as: Requester, Agent, or Manager
- Recommended: Assign as Requester for testing ticket creation

### For Sunwukhong (`sunwukhongking@gmail.com`):
- Can be assigned as: Requester, Agent, or Manager
- Recommended: Assign as Agent for testing ticket handling

To assign roles, use the Admin → Users interface or update the UserSeeder.

