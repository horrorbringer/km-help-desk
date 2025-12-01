# Approval Workflow Test Scenarios

## Overview

This document outlines realistic test scenarios for the approval workflow system, including user roles, test cases, and expected behaviors.

## User Roles Setup

### Roles Created
1. **Super Admin** - Full access to all features
2. **Head of Department (HOD)** - Can approve tickets at the highest level
3. **Director** - Similar to HOD, organization-level approval
4. **Line Manager (LM)** - Can approve tickets at the first level
5. **Manager** - Department management with ticket assignment capabilities
6. **Agent** - Support staff who handle tickets
7. **Requester** - Regular users who submit tickets

### Test Users Created

#### Head of Department
- **Sokuntha** (`sokuntha@kimmix.com`)
  - Department: IT Service Desk
  - Role: Head of Department
  - Password: `password`
  - **Use Case**: Final approval for high-priority tickets

#### Line Managers
- **Vannak** (`vannak@kimmix.com`)
  - Department: Field Engineering
  - Role: Line Manager
  - Password: `password`
  - **Use Case**: First-level approval for Field Engineering tickets

- **Manager 01** (`manager01@kimmix.com`)
  - Department: IT Service Desk
  - Role: Line Manager
  - Password: `password`
  - **Use Case**: First-level approval for IT tickets

- **Sopheap LM** (`sopheap.lm@kimmix.com`)
  - Department: Finance & Accounts
  - Role: Line Manager
  - Password: `password`
  - **Use Case**: First-level approval for Finance tickets

- **Vutty LM** (`vutty.lm@kimmix.com`)
  - Department: Health & Safety
  - Role: Line Manager
  - Password: `password`
  - **Use Case**: First-level approval for HSE tickets

- **Vanny LM** (`vanny.lm@kimmix.com`)
  - Department: Procurement
  - Role: Line Manager
  - Password: `password`
  - **Use Case**: First-level approval for Procurement tickets

#### Requesters
- **Chanthou** (`chanthou@kimmix.com`)
  - Department: IT Service Desk
  - Role: Requester
  - Password: `password`
  - **Use Case**: Submit tickets for IT support

- **Sokun** (`sokun@kimmix.com`)
  - Department: Field Engineering
  - Role: Requester
  - Password: `password`
  - **Use Case**: Submit tickets for field engineering

- **Requester 01** (`requester01@kimmix.com`)
  - Department: IT Service Desk
  - Role: Requester
  - Password: `password`
  - **Use Case**: General ticket submission

#### Agents
- **Agent 01** (`agent01@kimmix.com`)
  - Department: IT Service Desk
  - Role: Agent
  - Password: `password`
  - **Use Case**: Handle assigned tickets

## Test Scenarios

### Scenario 1: Low Priority Ticket (No Approval Required)
**Objective**: Test that tickets in categories without approval requirements bypass approval workflow

**Steps**:
1. Login as **Chanthou** (Requester)
2. Create a new ticket:
   - Category: IT Support → **Network & VPN** (or **Application Access**)
   - Priority: Low
   - Subject: "Need help with email setup"
3. Submit ticket

**Expected Result**:
- Ticket is created with status "assigned"
- Ticket is routed directly to IT Service Desk team
- No approval requests are created
- Email notification sent to assigned team/agent
- No approval emails sent

**Verification**:
- Check ticket status = "assigned"
- Check `ticket_approvals` table - should have 0 records
- Check email logs - should only have ticket created/assigned emails

**Note**: Approval is determined by **category settings**, not priority. The "IT Support" parent category requires approval, but subcategories like "Network & VPN" and "Application Access" have `requires_approval = false`, so they bypass approval even for high priority tickets.

---

### Scenario 2: Medium Priority Ticket (LM Approval Only)
**Objective**: Test that medium-priority tickets require only Line Manager approval

**Steps**:
1. Login as **Chanthou** (Requester, IT Service Desk)
2. Create a new ticket:
   - Category: IT Support (Hardware)
   - Priority: Medium
   - Subject: "Laptop replacement request"
3. Submit ticket

**Expected Result**:
- Ticket is created with status "pending_approval"
- LM approval is created for **Manager 01** (IT Service Desk Line Manager)
- Email sent to Manager 01 requesting approval
- In-app notification created for Manager 01

**Verification**:
- Check ticket status = "pending_approval"
- Check `ticket_approvals` table - should have 1 record with `approval_level = 'lm'` and `status = 'pending'`
- Check email sent to `manager01@kimmix.com`
- Login as Manager 01 and check "Pending Approvals" page

**Next Steps**:
4. Login as **Manager 01** (Line Manager)
5. Go to "Pending Approvals" page
6. Approve the ticket with optional comments
7. Route to IT Service Desk team

**Expected Result After Approval**:
- Ticket status changes to "assigned"
- LM approval status = "approved"
- Ticket routed to IT Service Desk team
- Email sent to **Chanthou** (requester) confirming approval
- No HOD approval created (medium priority doesn't require it)

**Verification**:
- Check ticket status = "assigned"
- Check `ticket_approvals` table - 1 record with `status = 'approved'`
- Check email sent to `chanthou@kimmix.com`
- Check ticket `assigned_team_id` = IT Service Desk

---

### Scenario 3: High Priority Ticket (LM + HOD Approval)
**Objective**: Test that high-priority tickets require both LM and HOD approval

**Steps**:
1. Login as **Sokun** (Requester, Field Engineering)
2. Create a new ticket:
   - Category: IT Support (Critical System)
   - Priority: High
   - Subject: "Server downtime - production affected"
3. Submit ticket

**Expected Result**:
- Ticket is created with status "pending_approval"
- LM approval is created for **Vannak** (Field Engineering Line Manager)
- Email sent to Vannak requesting approval

**Verification**:
- Check ticket status = "pending_approval"
- Check `ticket_approvals` table - 1 record with `approval_level = 'lm'`

**Next Steps**:
4. Login as **Vannak** (Line Manager)
5. Approve the ticket
6. Route to IT Service Desk team

**Expected Result After LM Approval**:
- LM approval status = "approved"
- HOD approval is automatically created for **Sokuntha** (Head of Department)
- Email sent to Sokuntha requesting HOD approval
- Email sent to **Sokun** (requester) confirming LM approval
- Ticket status remains "pending_approval" (waiting for HOD)

**Verification**:
- Check `ticket_approvals` table - should have 2 records:
  - 1 with `approval_level = 'lm'` and `status = 'approved'`
  - 1 with `approval_level = 'hod'` and `status = 'pending'`
- Check email sent to `sokuntha@kimmix.com`
- Check email sent to `sokun@kimmix.com`

**Final Steps**:
7. Login as **Sokuntha** (Head of Department)
8. Approve the ticket
9. Route to IT Service Desk team

**Expected Result After HOD Approval**:
- HOD approval status = "approved"
- Ticket status changes to "assigned"
- Ticket routed to IT Service Desk team
- Email sent to **Sokun** (requester) confirming HOD approval
- No further approvals needed

**Verification**:
- Check ticket status = "assigned"
- Check `ticket_approvals` table - 2 records, both `status = 'approved'`
- Check email sent to `sokun@kimmix.com`
- Check ticket `assigned_team_id` = IT Service Desk

---

### Scenario 4: Ticket Rejection by Line Manager
**Objective**: Test rejection workflow at LM level

**Steps**:
1. Login as **Requester 01** (Requester)
2. Create a ticket:
   - Category: Procurement
   - Priority: Medium
   - Subject: "Purchase request for office supplies"
3. Submit ticket

**Next Steps**:
4. Login as **Vanny LM** (Line Manager, Procurement)
5. Reject the ticket with comments: "Budget not approved for this quarter"

**Expected Result**:
- Ticket status changes to "cancelled"
- LM approval status = "rejected"
- Email sent to **Requester 01** with rejection reason
- Ticket preserved in database (not deleted)
- No HOD approval created

**Verification**:
- Check ticket status = "cancelled"
- Check `ticket_approvals` table - 1 record with `status = 'rejected'`
- Check email sent to `requester01@kimmix.com` with rejection reason
- Check ticket still exists in database

**Resubmission**:
6. Login as **Requester 01**
7. View rejected ticket
8. Click "Resubmit" button
9. Update ticket with additional information

**Expected Result**:
- New approval workflow starts
- New LM approval created
- Previous rejection history preserved

---

### Scenario 5: Ticket Rejection by HOD
**Objective**: Test rejection workflow at HOD level

**Steps**:
1. Create a high-priority ticket (follows Scenario 3 steps 1-6)
2. LM approves the ticket
3. Login as **Sokuntha** (Head of Department)
4. Reject the ticket with comments: "Not aligned with company strategy"

**Expected Result**:
- Ticket status changes to "cancelled"
- HOD approval status = "rejected"
- Email sent to requester with rejection reason
- LM approval remains "approved" (history preserved)
- Ticket preserved in database

**Verification**:
- Check ticket status = "cancelled"
- Check `ticket_approvals` table:
  - LM approval: `status = 'approved'`
  - HOD approval: `status = 'rejected'`
- Check email sent to requester

---

### Scenario 6: Category-Based Approval Requirements
**Objective**: Test that category settings override priority-based approval

**Steps**:
1. Login as Admin
2. Edit "Procurement" category:
   - Set `requires_approval = true`
   - Set `requires_hod_approval = true`
   - Set `hod_approval_threshold = 1000`
3. Login as **Requester 01**
4. Create a ticket:
   - Category: Procurement
   - Priority: Low (normally wouldn't require approval)
   - Subject: "Purchase request"
5. Submit ticket

**Expected Result**:
- Ticket requires approval (category setting overrides priority)
- LM approval created
- After LM approval, HOD approval created (category requires it)

**Verification**:
- Check that approval workflow is triggered despite low priority
- Check that both LM and HOD approvals are created

---

### Scenario 7: Auto-Approval Permission
**Objective**: Test that users with auto-approve permission bypass approval

**Steps**:
1. Login as **Sokuntha** (Head of Department - has auto-approve permission)
2. Create a ticket:
   - Category: IT Support
   - Priority: High
   - Subject: "System upgrade request"
3. Submit ticket

**Expected Result**:
- Ticket is created with status "assigned"
- No approval requests created
- Ticket routed directly to team
- Auto-approved due to user's permission

**Verification**:
- Check ticket status = "assigned"
- Check `ticket_approvals` table - 0 records
- Check ticket `assigned_team_id` is set

---

### Scenario 8: Multiple Approvals - No Duplicates
**Objective**: Verify that duplicate HOD approvals are not created

**Steps**:
1. Create a high-priority ticket
2. LM approves (triggers HOD approval creation)
3. Verify only ONE HOD approval exists
4. Try to trigger approval workflow again (should not create duplicate)

**Expected Result**:
- Only one HOD approval record exists
- System prevents duplicate approvals

**Verification**:
- Check `ticket_approvals` table - should have exactly 1 HOD approval
- Check logs for any duplicate creation attempts

---

## Email Notifications Testing

### Email Templates Created
All approval-related email templates are seeded:
- `approval_lm_requested` - Email to Line Manager
- `approval_hod_requested` - Email to Head of Department
- `approval_lm_approved` - Email to requester (LM approved)
- `approval_hod_approved` - Email to requester (HOD approved)
- `approval_lm_rejected` - Email to requester (LM rejected)
- `approval_hod_rejected` - Email to requester (HOD rejected)

### Email Testing Checklist
- [ ] LM receives approval request email
- [ ] HOD receives approval request email
- [ ] Requester receives approval confirmation email
- [ ] Requester receives rejection email with reason
- [ ] Email templates use correct variables
- [ ] Email formatting is correct (HTML and plain text)
- [ ] Email links work correctly

## Database Verification Queries

### Check Approval Records
```sql
SELECT * FROM ticket_approvals 
WHERE ticket_id = [TICKET_ID]
ORDER BY sequence, created_at;
```

### Check Ticket Status
```sql
SELECT id, ticket_number, status, priority, category_id 
FROM tickets 
WHERE id = [TICKET_ID];
```

### Check User Roles
```sql
SELECT u.name, u.email, r.name as role_name
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.model_id
JOIN roles r ON mhr.role_id = r.id
WHERE u.email = '[EMAIL]';
```

## Common Issues & Solutions

### Issue: Approval not created
**Solution**: Check category settings (`requires_approval`, `requires_hod_approval`)

### Issue: Wrong approver assigned
**Solution**: Verify user's department and role match ticket requester's department

### Issue: Duplicate approvals
**Solution**: Check `checkNextApproval()` method - should prevent duplicates

### Issue: Emails not sending
**Solution**: 
1. Check email template is active
2. Check mail settings (`mail_enabled`)
3. Check Laravel logs for email errors

## Quick Test Commands

### Reset Database and Seed
```bash
php artisan migrate:fresh --seed
```

### Clear Cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Test Email Sending
```bash
php artisan tinker
>>> Mail::raw('Test email', function($msg) { $msg->to('test@example.com')->subject('Test'); });
```

## Test Data Summary

### Users by Role
- **Super Admin**: 4 users
- **Head of Department**: 1 user (Sokuntha)
- **Line Manager**: 5 users (Vannak, Manager 01, Sopheap LM, Vutty LM, Vanny LM)
- **Manager**: 2 users
- **Agent**: 6 users
- **Requester**: 3 users

### Departments
- IT Service Desk (IT-SD)
- Field Engineering (FIELD-ENG)
- Procurement (PROC)
- Health & Safety (HSE)
- Finance & Accounts (FIN)

### Email Templates
- 6 approval-related templates (all active)
- Professional HTML and plain text versions
- All variables properly configured

## Next Steps

1. Run database seeder: `php artisan migrate:fresh --seed`
2. Test each scenario above
3. Verify email notifications
4. Check approval workflow logic
5. Test edge cases (missing approvers, inactive users, etc.)

