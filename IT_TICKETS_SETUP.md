# IT Tickets Setup & Configuration

## Overview
This document focuses specifically on IT ticket workflows, configurations, and testing scenarios.

## IT Ticket Categories

### IT Support Category
- **Category**: IT Support
- **Requires Approval**: ✅ Yes (default)
- **Default Team**: IT Service Desk
- **Subcategories**:

#### 1. Hardware
- **Requires Approval**: ✅ Yes
- **Requires HOD Approval**: ✅ Yes (for high-value items)
- **Use Case**: Laptop requests, equipment purchases, hardware replacements
- **Example**: "Request for new laptop - Dell Latitude 5540"

#### 2. Network & VPN
- **Requires Approval**: ❌ No (routine issues)
- **Use Case**: VPN connection issues, network troubleshooting
- **Example**: "Cannot connect to company VPN"

#### 3. Application Access
- **Requires Approval**: ❌ No (routine requests)
- **Use Case**: Software access requests, account permissions
- **Example**: "Need access to project management software"

## IT Ticket Workflow

### Standard IT Hardware Request (Requires Approval)
```
User Creates Ticket (IT Support → Hardware)
    ↓
Line Manager Approval ← REQUIRED
    ↓
    ├─→ REJECTED → Ticket Cancelled ❌
    │
    └─→ APPROVED → Routes to IT Service Desk
            ↓
        Check if HOD Approval Needed?
            ↓
            ├─→ NO → Process Ticket ✅
            │
            └─→ YES → Head of Department Approval ← CONDITIONAL
                        ↓
                        ├─→ REJECTED → Ticket Cancelled ❌
                        │
                        └─→ APPROVED → IT Service Desk Processing ✅
```

### Routine IT Request (No Approval)
```
User Creates Ticket (IT Support → Network & VPN)
    ↓
Directly Routes to IT Service Desk ✅
    ↓
IT Agent Responds & Resolves
```

## IT Department Configuration

### Department Details
- **Code**: IT-SD
- **Name**: IT Service Desk
- **Type**: Support Team

### IT Team Members

#### Head of Department
- **Sokuntha** (`sokuntha@kimmix.com`)
  - Role: Head of Department
  - Department: IT Service Desk
  - **Priority**: Selected first for HOD approvals

#### Super Admin
- **Makara** (`sonmakara69@gmail.com`)
  - Role: Super Admin
  - Department: IT Service Desk
  - **Fallback**: Only used if no HOD found

#### IT Agents
- **Sokha** (`sokha6338@outlook.com`) - Agent
- **Sunwukhong** (`sunwukhongking@gmail.com`) - Agent
- **Chanthou** (`chanthou121@outlook.com`) - Requester (also in IT)

## Approval Logic for IT Tickets

### Line Manager Selection
1. **Requester's Department Manager** - Manager of ticket creator's department
2. **Assigned Team Manager** - Manager of IT Service Desk team
3. **Fallback** - First active manager found

### Head of Department Selection (Fixed)
1. **Priority 1**: HOD in ticket's assigned team/department (IT Service Desk)
   - ✅ **Sokuntha** (Head of Department) - Selected first
2. **Priority 2**: HOD in requester's department
3. **Priority 3**: Any Head of Department (prioritizes HOD role)
4. **Priority 4**: Director (if no HOD found)
5. **Priority 5**: Super Admin (last resort)
   - ⚠️ **Makara** (Super Admin) - Only if no HOD/Director found

## IT Ticket Test Scenarios

### Scenario 2: Hardware Request (Current Focus)
**Test Case**: IT hardware request with Line Manager and HOD approval

**Steps**:
1. **Dongdong** creates ticket:
   - Category: IT Support → Hardware
   - Priority: High
   - Assigned Team: IT Service Desk
   - Subject: "Request for new laptop - Dell Latitude 5540"

**Expected Flow**:
1. ✅ Ticket created → Status: "pending"
2. ✅ Line Manager approval → **Vannak** (Field Engineering Manager)
3. ✅ Vannak approves → HOD approval created
4. ✅ HOD approval → **Sokuntha** (Head of Department) - NOT Makara
5. ✅ Sokuntha approves → Routes to IT Service Desk
6. ✅ IT Agent (Sokha) handles ticket

### Scenario 3: Critical IT Issue
**Test Case**: High-priority ticket handling (no approval for critical)

**Steps**:
1. **Sokun** creates ticket:
   - Category: IT Support → Network & VPN
   - Priority: Critical
   - Subject: "Server down - Cannot access company database"

**Expected Flow**:
1. ✅ Ticket created → Status: "assigned" (no approval needed)
2. ✅ Routes directly to IT Service Desk
3. ✅ **Makara** (Super Admin) or **Sokha** (Agent) responds
4. ✅ SLA timers started

## Email Notifications for IT Tickets

### When Ticket is Created
- ✅ **Requester** receives "Ticket Created" email
- ✅ **Assigned Agent** receives "Ticket Assigned" email (if assigned)

### When Ticket is Updated
- ✅ **Requester** receives "Ticket Updated" email
- ✅ **Assigned Agent** receives "Ticket Updated" email

### When Ticket is Assigned
- ✅ **Assigned Agent** receives "Ticket Assigned" email

### When Ticket Status Changes
- ✅ **Resolved** → Requester receives "Ticket Resolved" email
- ✅ **Closed** → Requester receives "Ticket Closed" email

### Approval Workflow Emails
- ✅ **LM Approval Requested** → Vannak receives email
- ✅ **LM Approved** → Dongdong receives email
- ✅ **HOD Approval Requested** → **Sokuntha** receives email (NOT Makara)
- ✅ **HOD Approved** → Dongdong receives email

## Key Fixes Applied

### 1. HOD Selection Priority ✅
- **Before**: Selected first user with HOD/Director/Super Admin roles (could be Makara)
- **After**: Prioritizes Head of Department role, then department matching
- **Result**: Sokuntha is selected as HOD approver (not Makara)

### 2. Email Notifications ✅
- **Before**: Only worked on ticket creation
- **After**: Works for all ticket events (update, assign, status change, approval)
- **Result**: All IT ticket events send proper email notifications

### 3. Template Rendering ✅
- **Before**: Handlebars conditionals showed as raw text
- **After**: Conditionals are processed correctly
- **Result**: IT ticket emails render properly

## Testing Checklist for IT Tickets

### ✅ Hardware Request (Scenario 2)
- [ ] Create ticket with IT Support → Hardware category
- [ ] Verify Line Manager approval is created
- [ ] Verify Vannak receives approval email
- [ ] Approve as Vannak
- [ ] Verify HOD approval is created
- [ ] Verify **Sokuntha** (not Makara) receives HOD approval email
- [ ] Approve as Sokuntha
- [ ] Verify ticket routes to IT Service Desk
- [ ] Verify requester receives approval emails

### ✅ Routine IT Request
- [ ] Create ticket with IT Support → Network & VPN category
- [ ] Verify ticket routes directly to IT Service Desk (no approval)
- [ ] Verify requester receives "Ticket Created" email
- [ ] Verify IT team receives notification

### ✅ Critical IT Issue
- [ ] Create ticket with Critical priority
- [ ] Verify ticket routes immediately (no approval)
- [ ] Verify SLA timers start
- [ ] Verify IT team receives notification

### ✅ Ticket Assignment
- [ ] Assign ticket to IT agent (Sokha)
- [ ] Verify Sokha receives "Ticket Assigned" email
- [ ] Update ticket status
- [ ] Verify requester receives "Ticket Updated" email

## IT-Specific Configuration

### Categories Requiring Approval
- ✅ IT Support → Hardware
- ✅ IT Support → Software (if exists)
- ❌ IT Support → Network & VPN (no approval)
- ❌ IT Support → Application Access (no approval)

### Default Routing
- All IT Support tickets → IT Service Desk (IT-SD department)
- Hardware requests → Require LM + HOD approval
- Routine requests → Direct routing

## Current Status

✅ **HOD Selection**: Fixed - Sokuntha selected (not Makara)
✅ **Email Notifications**: Fixed - All events send emails
✅ **Template Rendering**: Fixed - Emails render correctly
✅ **IT Workflow**: Configured - Hardware requires approval, routine doesn't
✅ **IT Team**: Configured - Sokuntha (HOD), Makara (Super Admin), Sokha/Sunwukhong (Agents)

## Next Steps for Testing

1. **Test Scenario 2** (Hardware Request):
   - Create ticket as Dongdong
   - Verify Vannak gets LM approval
   - Verify Sokuntha gets HOD approval (not Makara)
   - Complete approval workflow

2. **Test Routine IT Request**:
   - Create Network & VPN ticket
   - Verify direct routing (no approval)

3. **Test Email Notifications**:
   - Check all email events are sent
   - Verify emails render correctly

4. **Test IT Agent Workflow**:
   - Assign ticket to Sokha
   - Update ticket status
   - Resolve ticket
   - Verify all notifications sent

