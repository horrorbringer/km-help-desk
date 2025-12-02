# Real User IT Interaction Test Scenarios

## Overview

This document provides comprehensive test scenarios for IT support interactions using real user accounts with actual email addresses. These scenarios test the complete ticket lifecycle from creation to resolution.

## Test Users Configuration

### IT Support Team (Agents & Admins)

1. **Makara** (`sonmakara69@gmail.com`)
   - Role: Super Admin
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-1001
   - Password: `password`
   - **Responsibilities**: System administration, full access, can handle any ticket

2. **Sokha** (`sokha6338@outlook.com`)
   - Role: Agent
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-1800
   - Password: `password`
   - **Responsibilities**: Primary IT support agent, handles assigned tickets

3. **Sunwukhong** (`sunwukhongking@gmail.com`)
   - Role: Agent
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-1900
   - Password: `password`
   - **Responsibilities**: Secondary IT support agent, backup support

4. **Sokuntha** (`sokuntha@kimmix.com`)
   - Role: Head of Department (HOD)
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-0999
   - Password: `password`
   - **Responsibilities**: Approves high-value IT requests, manages IT department

### End Users (Requesters)

5. **Chanthou** (`chanthou121@outlook.com`)
   - Role: Requester
   - Department: IT Service Desk (IT-SD)
   - Employee ID: EMP-2000
   - Password: `password`
   - **Use Case**: IT department employee reporting issues

6. **Dongdong** (`dongdongmi72@gmail.com`)
   - Role: Requester
   - Department: Field Engineering (FIELD-ENG)
   - Employee ID: EMP-2100
   - Password: `password`
   - **Use Case**: Field engineer needing IT support

7. **Sokun** (`sokun12442@outlook.com`)
   - Role: Requester
   - Department: Field Engineering (FIELD-ENG)
   - Employee ID: EMP-2200
   - Password: `password`
   - **Use Case**: Field engineer reporting IT issues

### Management

8. **Vannak** (`fnak98755@gmail.com`)
   - Role: Line Manager
   - Department: Field Engineering (FIELD-ENG)
   - Employee ID: EMP-1020
   - Password: `password`
   - **Use Case**: Approves IT requests from field engineering team

9. **Vutty** (`vutty63552@outlook.com`)
   - Role: Manager
   - Department: Health & Safety (HSE)
   - Employee ID: EMP-1700
   - Password: `password`
   - **Use Case**: Manager from another department

10. **Vanny** (`vannysmilekh@gmail.com`)
    - Role: Super Admin
    - Department: Procurement (PROC)
    - Employee ID: EMP-1050
    - Password: `password`
    - **Use Case**: Cross-department administrator

---

## Test Scenarios

### Scenario 1: Simple IT Support Request (No Approval)
**Objective**: Test basic ticket creation and resolution without approval workflow

**Steps**:
1. Login as **Chanthou** (`chanthou121@outlook.com`)
2. Navigate to **Tickets** → **Create New Ticket**
3. Fill in ticket details:
   - **Subject**: "Cannot connect to office Wi-Fi"
   - **Description**: "My laptop cannot connect to the office Wi-Fi network. I've tried restarting the laptop and the Wi-Fi adapter, but the issue persists. This started this morning."
   - **Category**: IT Support → Network & VPN
   - **Priority**: Medium
   - **Assigned Team**: IT Service Desk
   - **Requester**: Chanthou
4. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "assigned" (bypasses approval)
- ✅ Email notification sent to Chanthou (ticket created)
- ✅ Ticket visible in IT Service Desk queue
- ✅ No approval requests created

**Agent Response Steps**:
1. Login as **Sokha** (`sokha6338@outlook.com`) - IT Agent
2. Navigate to **Tickets** → Find the ticket
3. Assign ticket to yourself (if not auto-assigned)
4. Update ticket:
   - **Status**: In Progress
   - Add comment: "Checking Wi-Fi configuration. Please verify you're connected to 'Kimmix-Office' network."
5. After resolution:
   - **Status**: Resolved
   - Add comment: "Issue resolved. Wi-Fi profile was corrupted. Reset network settings and reconnected successfully."

**Expected Results**:
- ✅ Email notification sent to Chanthou (ticket updated/resolved)
- ✅ Ticket status changes correctly
- ✅ Comments visible in ticket history
- ✅ Resolution time tracked

---

### Scenario 2: Hardware Request Requiring Approval
**Objective**: Test IT hardware request with Line Manager and HOD approval

**Steps**:
1. Login as **Dongdong** (`dongdongmi72@gmail.com`)
2. Create new ticket:
   - **Subject**: "Request for new laptop - Dell Latitude 5540"
   - **Description**: "Current laptop is 5 years old and frequently crashes during software development work. Need replacement laptop for productivity. Estimated cost: $1,200."
   - **Category**: IT Support → Hardware
   - **Priority**: High
   - **Assigned Team**: IT Service Desk
   - **Requester**: Dongdong
3. Submit ticket

**Expected Results**:
- ✅ Ticket created with status "pending"
- ✅ Line Manager approval request created
- ✅ Email notification sent to Vannak (Line Manager)

**Line Manager Approval**:
1. Login as **Vannak** (`fnak98755@gmail.com`)
2. Navigate to **Tickets** → **Pending Approvals**
3. Review ticket details
4. Click **Approve**
5. Add comment: "Approved - Laptop replacement needed for field engineering work"
6. Submit approval

**Expected Results**:
- ✅ HOD approval automatically created
- ✅ Email notification sent to Sokuntha (HOD)
- ✅ Email notification sent to Dongdong (LM approved)

**HOD Approval**:
1. Login as **Sokuntha** (`sokuntha@kimmix.com`)
2. Navigate to **Pending Approvals**
3. Review ticket and LM approval comments
4. Click **Approve**
5. Add comment: "Approved - Budget allocated for Q1 equipment refresh"
6. Submit approval

**Expected Results**:
- ✅ Ticket status changes to "assigned"
- ✅ Ticket routed to IT Service Desk
- ✅ Email notifications sent to Dongdong and IT team
- ✅ Complete approval chain recorded

**IT Agent Response**:
1. Login as **Sokha** (`sokha6338@outlook.com`)
2. Assign ticket to yourself
3. Update ticket:
   - **Status**: In Progress
   - Add comment: "Ordering Dell Latitude 5540. Expected delivery: 5-7 business days."
4. When laptop arrives:
   - **Status**: Resolved
   - Add comment: "Laptop delivered and configured. User notified for pickup."

---

### Scenario 3: Critical IT Issue - Immediate Response
**Objective**: Test high-priority ticket handling and SLA tracking

**Steps**:
1. Login as **Sokun** (`sokun12442@outlook.com`)
2. Create ticket:
   - **Subject**: "Server down - Cannot access company database"
   - **Description**: "Cannot connect to the company database server. All field operations are halted. This is affecting 15+ field engineers."
   - **Category**: IT Support → Network & VPN (or appropriate category)
   - **Priority**: Critical
   - **Assigned Team**: IT Service Desk
3. Submit ticket

**Expected Results**:
- ✅ Ticket created immediately (no approval for critical issues)
- ✅ Status: "assigned"
- ✅ Email notification sent to IT team
- ✅ SLA timers started

**IT Response**:
1. Login as **Makara** (`sonmakara69@gmail.com`) - Super Admin
2. View ticket in dashboard
3. Assign to **Sokha** or handle directly
4. Update ticket:
   - **Status**: In Progress
   - Add comment: "Investigating database server connectivity. Checking network infrastructure."
5. After resolution:
   - **Status**: Resolved
   - Add comment: "Issue resolved. Database server network interface was down. Restarted and verified connectivity."

**Expected Results**:
- ✅ First response time tracked
- ✅ Resolution time tracked
- ✅ SLA compliance verified
- ✅ Email notifications sent

---

### Scenario 4: Software Access Request
**Objective**: Test application access request workflow

**Steps**:
1. Login as **Chanthou** (`chanthou121@outlook.com`)
2. Create ticket:
   - **Subject**: "Need access to Adobe Creative Suite"
   - **Description**: "I need Adobe Creative Suite for design work on the new marketing campaign. This is a temporary project that will last 3 months."
   - **Category**: IT Support → Application Access
   - **Priority**: Medium
   - **Assigned Team**: IT Service Desk
3. Submit ticket

**Expected Results**:
- ✅ Ticket created (Application Access category may not require approval)
- ✅ Assigned to IT Service Desk
- ✅ Email notification sent

**IT Agent Response**:
1. Login as **Sunwukhong** (`sunwukhongking@gmail.com`)
2. Assign ticket to yourself
3. Update ticket:
   - **Status**: In Progress
   - Add comment: "Requesting license from software vendor. Will provision access once approved."
4. After access granted:
   - **Status**: Resolved
   - Add comment: "Adobe Creative Suite access granted. License expires in 3 months. User credentials sent via email."

---

### Scenario 5: Multi-Agent Collaboration
**Objective**: Test ticket escalation and agent collaboration

**Steps**:
1. Login as **Dongdong** (`dongdongmi72@gmail.com`)
2. Create ticket:
   - **Subject**: "Complex VPN configuration issue"
   - **Description**: "Cannot connect to VPN from remote site. Tried multiple configurations but still failing. Error code: 809"
   - **Category**: IT Support → Network & VPN
   - **Priority**: High
   - **Assigned Team**: IT Service Desk
3. Submit ticket

**Initial Agent Response**:
1. Login as **Sokha** (`sokha6338@outlook.com`)
2. Assign ticket to yourself
3. Add comment: "Initial investigation shows certificate issue. Escalating to senior support."
4. Reassign ticket to **Sunwukhong**

**Escalation Response**:
1. Login as **Sunwukhong** (`sunwukhongking@gmail.com`)
2. View ticket and previous comments
3. Add comment: "Certificate issue confirmed. Updating VPN certificate and reconfiguring client."
4. Update ticket:
   - **Status**: Resolved
   - Add comment: "VPN certificate updated. User can now connect. Tested and verified."

**Expected Results**:
- ✅ Ticket history shows both agents' comments
- ✅ Reassignment tracked in history
- ✅ Email notifications sent at each step
- ✅ Resolution properly documented

---

### Scenario 6: Ticket Comment Thread
**Objective**: Test communication between requester and agent

**Steps**:
1. Login as **Chanthou** (`chanthou121@outlook.com`)
2. Create ticket:
   - **Subject**: "Email not syncing on mobile device"
   - **Description**: "My Outlook email is not syncing on my iPhone. Last sync was 2 days ago."
   - **Category**: IT Support → Application Access
   - **Priority**: Medium
3. Submit ticket

**Agent Response**:
1. Login as **Sokha** (`sokha6338@outlook.com`)
2. Assign ticket
3. Add comment: "Can you check your iPhone's email account settings? Also, is your phone connected to Wi-Fi or cellular?"

**Requester Reply**:
1. Login as **Chanthou** (`chanthou121@outlook.com`)
2. View ticket
3. Add comment: "Phone is on Wi-Fi. Email account shows 'Cannot connect to server' error."

**Agent Follow-up**:
1. Login as **Sokha** (`sokha6338@outlook.com`)
2. Add comment: "The issue is with the email server certificate. I've updated it. Please remove and re-add your email account on your iPhone."
3. Update status to "In Progress"

**Requester Confirmation**:
1. Login as **Chanthou** (`chanthou121@outlook.com`)
2. Add comment: "Thank you! Email is now syncing. Issue resolved."
3. Agent marks ticket as "Resolved"

**Expected Results**:
- ✅ Comment thread visible to both parties
- ✅ Email notifications for each comment
- ✅ Clear communication flow
- ✅ Resolution confirmed by requester

---

### Scenario 7: Ticket Rejection and Resubmission
**Objective**: Test approval rejection workflow

**Steps**:
1. Login as **Dongdong** (`dongdongmi72@gmail.com`)
2. Create ticket:
   - **Subject**: "Request for gaming laptop"
   - **Description**: "Need a high-end gaming laptop for personal use. Budget: $2,500"
   - **Category**: IT Support → Hardware
   - **Priority**: Medium
3. Submit ticket

**Line Manager Rejection**:
1. Login as **Vannak** (`fnak98755@gmail.com`)
2. Navigate to **Pending Approvals**
3. Click **Reject**
4. Add comment: "Rejected - Personal use equipment not covered by company budget. Please use personal device."
5. Submit rejection

**Expected Results**:
- ✅ Ticket status: "cancelled"
- ✅ Email notification sent to Dongdong
- ✅ Rejection reason visible

**Resubmission**:
1. Login as **Dongdong** (`dongdongmi72@gmail.com`)
2. Navigate to **Tickets** → **Rejected Tickets**
3. Find the rejected ticket
4. Click **Resubmit**
5. Update description: "Correction: This laptop is needed for 3D modeling work on construction projects, not personal use. It will be used for project visualization."
6. Submit resubmission

**Expected Results**:
- ✅ New approval request created
- ✅ Previous rejection history preserved
- ✅ Email notification sent to Line Manager

---

### Scenario 8: Bulk Ticket Creation
**Objective**: Test creating multiple tickets from different users

**Steps**:
Create tickets from multiple requesters:

**Ticket 1** - Chanthou:
- Subject: "Printer not working"
- Category: IT Support → Hardware
- Priority: Low

**Ticket 2** - Dongdong:
- Subject: "Need software license for AutoCAD"
- Category: IT Support → Application Access
- Priority: Medium

**Ticket 3** - Sokun:
- Subject: "Password reset needed"
- Category: IT Support → Application Access
- Priority: Low

**Expected Results**:
- ✅ All tickets created successfully
- ✅ Each requester receives confirmation email
- ✅ Tickets appear in IT Service Desk queue
- ✅ Agents can see all tickets

**Agent Assignment**:
1. Login as **Sokha** (`sokha6338@outlook.com`)
2. View all tickets
3. Assign tickets based on priority and expertise
4. Handle tickets accordingly

---

### Scenario 9: Email Notification Testing
**Objective**: Verify all email notifications work correctly

**Test Checklist**:
- [ ] Ticket created email sent to requester
- [ ] Ticket assigned email sent to agent
- [ ] Ticket updated email sent to requester
- [ ] Comment added email sent to requester
- [ ] Ticket resolved email sent to requester
- [ ] Approval requested email sent to approver
- [ ] Approval approved email sent to requester
- [ ] Approval rejected email sent to requester

**Steps**:
1. Create a ticket requiring approval
2. Complete approval workflow
3. Have agent respond and resolve
4. Check all email inboxes for notifications
5. Verify email content is correct
6. Verify email links work (ticket URLs)

---

### Scenario 10: Admin Oversight
**Objective**: Test Super Admin capabilities

**Steps**:
1. Login as **Makara** (`sonmakara69@gmail.com`) - Super Admin
2. Navigate to **Tickets**
3. Verify can see all tickets regardless of assignment
4. Test capabilities:
   - View any ticket
   - Edit any ticket
   - Assign tickets to any agent
   - Resolve tickets
   - View all approval requests
   - Override approvals (if needed)
5. Navigate to **Users** → Verify can manage all users
6. Navigate to **Settings** → Verify full access

**Expected Results**:
- ✅ Super Admin has full system access
- ✅ Can view all tickets
- ✅ Can manage all users
- ✅ Can configure system settings

---

## Testing Checklist

### Pre-Testing Setup
- [ ] All users are active in the system
- [ ] All users have correct roles assigned
- [ ] All users have correct department assignments
- [ ] Email notifications are enabled
- [ ] Email templates are configured
- [ ] SMTP is configured (Outlook/Microsoft 365)

### Test Execution
- [ ] Scenario 1: Simple IT Support - ✅ Pass / ❌ Fail
- [ ] Scenario 2: Hardware Request with Approval - ✅ Pass / ❌ Fail
- [ ] Scenario 3: Critical Issue - ✅ Pass / ❌ Fail
- [ ] Scenario 4: Software Access Request - ✅ Pass / ❌ Fail
- [ ] Scenario 5: Multi-Agent Collaboration - ✅ Pass / ❌ Fail
- [ ] Scenario 6: Comment Thread - ✅ Pass / ❌ Fail
- [ ] Scenario 7: Rejection and Resubmission - ✅ Pass / ❌ Fail
- [ ] Scenario 8: Bulk Ticket Creation - ✅ Pass / ❌ Fail
- [ ] Scenario 9: Email Notifications - ✅ Pass / ❌ Fail
- [ ] Scenario 10: Admin Oversight - ✅ Pass / ❌ Fail

### Verification Points
- [ ] Tickets created correctly
- [ ] Email notifications sent
- [ ] Approval workflow functions
- [ ] Agent assignment works
- [ ] Comments visible to all parties
- [ ] Ticket status updates correctly
- [ ] SLA tracking accurate
- [ ] Email links work correctly
- [ ] All users can access their tickets

---

## Quick Reference

### Login Credentials
All users use password: `password`

### Email Addresses
- **Makara**: sonmakara69@gmail.com (Super Admin)
- **Sokha**: sokha6338@outlook.com (IT Agent)
- **Sunwukhong**: sunwukhongking@gmail.com (IT Agent)
- **Sokuntha**: sokuntha@kimmix.com (HOD)
- **Chanthou**: chanthou121@outlook.com (Requester)
- **Dongdong**: dongdongmi72@gmail.com (Requester)
- **Sokun**: sokun12442@outlook.com (Requester)
- **Vannak**: fnak98755@gmail.com (Line Manager)
- **Vutty**: vutty63552@outlook.com (Manager)
- **Vanny**: vannysmilekh@gmail.com (Super Admin)

### Departments
- **IT-SD**: IT Service Desk (Support team)
- **FIELD-ENG**: Field Engineering
- **PROC**: Procurement
- **HSE**: Health & Safety
- **FIN**: Finance & Accounts

---

## Notes

- All test users use password: `password` (change in production!)
- Email addresses are real and can receive notifications
- Test during business hours if email delivery is time-sensitive
- Document any issues found during testing
- Update this document with additional scenarios as needed

