# Realistic Test Data Summary

## Overview

This document summarizes all the realistic test data that has been seeded into the system for testing the approval workflow and other features.

## Roles & Permissions

### Roles Created
1. **Super Admin** - Full system access
2. **Head of Department (HOD)** - Final approval authority
3. **Director** - Organization-level approval (similar to HOD)
4. **Line Manager (LM)** - First-level approval authority
5. **Manager** - Department management with ticket assignment
6. **Agent** - Support staff handling tickets
7. **Requester** - Regular users submitting tickets

### Key Permissions
- **Line Manager & HOD**: Can auto-approve tickets (`tickets.auto-approve`)
- **Line Manager & HOD**: Can view, create, edit, assign, resolve, and close tickets
- **Agent**: Limited to viewing assigned tickets and their own tickets
- **Requester**: Can only view and create tickets

## Test Users

### Head of Department
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Sokuntha | sokuntha@kimmix.com | IT Service Desk | EMP-0999 | Head of Department |

**Use Case**: Final approval for high-priority tickets and category-based HOD approvals.

### Line Managers
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Vannak | vannak@kimmix.com | Field Engineering | EMP-1020 | Line Manager |
| Manager 01 | manager01@kimmix.com | IT Service Desk | EMP-1175 | Line Manager |
| Sopheap LM | sopheap.lm@kimmix.com | Finance & Accounts | EMP-1500 | Line Manager |
| Vutty LM | vutty.lm@kimmix.com | Health & Safety | EMP-1525 | Line Manager |
| Vanny LM | vanny.lm@kimmix.com | Procurement | EMP-1550 | Line Manager |

**Use Case**: First-level approval for tickets from their respective departments.

### Requesters
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Chanthou | chanthou@kimmix.com | IT Service Desk | EMP-1375 | Requester |
| Sokun | sokun@kimmix.com | Field Engineering | EMP-1400 | Requester |
| Requester 01 | requester01@kimmix.com | IT Service Desk | EMP-1200 | Requester |

**Use Case**: Submit tickets for various departments and test approval workflow from requester perspective.

### Agents
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Pov | pov@kimmix.com | Finance & Accounts | EMP-1125 | Agent |
| Agent 01 | agent01@kimmix.com | IT Service Desk | EMP-1150 | Agent |
| Sokha | sokha@kimmix.com | Field Engineering | EMP-1250 | Agent |
| Ratha | ratha@kimmix.com | IT Service Desk | EMP-1275 | Agent |
| Srey | srey@kimmix.com | Procurement | EMP-1300 | Agent |
| Dara | dara@kimmix.com | Health & Safety | EMP-1325 | Agent |
| Sophea | sophea@kimmix.com | Finance & Accounts | EMP-1350 | Agent |

**Use Case**: Handle tickets assigned to their teams.

### Managers
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Sopheap Manager | sopheap.manager@kimmix.com | IT Service Desk | EMP-1425 | Manager |
| Vannak Field | vannak.field@kimmix.com | Field Engineering | EMP-1450 | Manager |

**Use Case**: Department management and ticket assignment.

### Super Admins
| Name | Email | Department | Employee ID | Role |
|------|-------|------------|-------------|------|
| Makara | makara@kimmix.com | IT Service Desk | EMP-1001 | Super Admin |
| Vanny | vanny@kimmix.com | Procurement | EMP-1050 | Super Admin |
| Sopheap | sopheap@kimmix.com | Finance & Accounts | EMP-1075 | Super Admin |
| Vutty | vutty@kimmix.com | Health & Safety | EMP-1100 | Super Admin |
| Super Admin 01 | superadmin01@kimmix.com | IT Service Desk | EMP-1225 | Super Admin |

**Use Case**: System administration and full access testing.

**Note**: All users have password: `password`

## Departments

| Code | Name | Support Team | Description |
|------|------|--------------|-------------|
| IT-SD | IT Service Desk | Yes | Central IT help desk handling software, hardware, and network issues |
| FIELD-ENG | Field Engineering | Yes | Supports on-site construction teams and equipment |
| PROC | Procurement | No | Handles purchasing requests and vendor coordination |
| HSE | Health & Safety | Yes | Ensures compliance with safety standards across projects |
| FIN | Finance & Accounts | No | Oversees budget, invoicing, and payroll queries |

## Ticket Categories & Approval Settings

### IT Support
- **Requires Approval**: Yes
- **Subcategories**:
  - **Hardware**: Requires approval + HOD approval (threshold: $1000)
  - **Network & VPN**: No approval required
  - **Application Access**: No approval required

### Site Operations
- **Requires Approval**: Yes (default)
- **Subcategories**:
  - Equipment Failure
  - Material Shortage
  - Site Logistics

### Safety & Compliance
- **Requires Approval**: Yes (default)
- **Subcategories**:
  - Incident Reporting
  - Inspection Follow-up

### Procurement Requests
- **Requires Approval**: Yes
- **Requires HOD Approval**: Yes
- **HOD Threshold**: $500
- **Use Case**: All purchase requests require approval, HOD approval for purchases > $500

### Finance Queries
- **Requires Approval**: No
- **Use Case**: Routine queries don't need approval

## Email Templates

### Approval Request Templates
1. **Line Manager Approval Requested** (`approval_lm_requested`)
   - Sent to Line Manager when approval is needed
   - Professional HTML and plain text versions
   - Includes ticket details and approval link

2. **Head of Department Approval Requested** (`approval_hod_requested`)
   - Sent to HOD when second-level approval is needed
   - Notes that ticket was already approved by LM
   - Professional HTML and plain text versions

### Approval Confirmation Templates
3. **Line Manager Approval Approved** (`approval_lm_approved`)
   - Sent to requester when LM approves
   - Includes approver name and optional comments
   - Confirms ticket routing

4. **Head of Department Approval Approved** (`approval_hod_approved`)
   - Sent to requester when HOD approves
   - Includes approver name and optional comments
   - Confirms final approval and routing

### Rejection Templates
5. **Line Manager Approval Rejected** (`approval_lm_rejected`)
   - Sent to requester when LM rejects
   - Includes rejection reason
   - Provides resubmission guidance

6. **Head of Department Approval Rejected** (`approval_hod_rejected`)
   - Sent to requester when HOD rejects
   - Notes that ticket was previously approved by LM
   - Includes rejection reason

**All Templates**:
- Professional HTML formatting with responsive design
- Plain text fallback versions
- Proper variable substitution
- Active by default
- Include ticket links and action buttons

## Approval Workflow Logic

### When Approval is Required
1. **Category-based**: If category `requires_approval = true`
2. **Priority-based**: If priority is `high` or `critical`
3. **Combined**: Category can override priority settings

### When HOD Approval is Required
1. **Category-based**: If category `requires_hod_approval = true`
2. **Priority-based**: If priority is `high` or `critical` (after LM approval)
3. **Cost-based**: If ticket cost exceeds category `hod_approval_threshold` (future feature)

### Approval Flow
```
Ticket Created
    ↓
Requires Approval? → No → Route Directly to Team
    ↓ Yes
Create LM Approval
    ↓
LM Approves? → No → Reject (Status: Cancelled)
    ↓ Yes
Requires HOD Approval? → No → Route to Team
    ↓ Yes
Create HOD Approval
    ↓
HOD Approves? → No → Reject (Status: Cancelled)
    ↓ Yes
Route to Team (Status: Assigned)
```

## Test Scenarios

See `APPROVAL_WORKFLOW_TEST_SCENARIOS.md` for detailed test scenarios including:
- Low priority tickets (no approval)
- Medium priority tickets (LM approval only)
- High priority tickets (LM + HOD approval)
- Rejection workflows
- Category-based approvals
- Auto-approval permissions
- Duplicate prevention

## Quick Start

### 1. Reset Database
```bash
php artisan migrate:fresh --seed
```

### 2. Login as Test User
- **Requester**: `chanthou@kimmix.com` / `password`
- **Line Manager**: `manager01@kimmix.com` / `password`
- **Head of Department**: `sokuntha@kimmix.com` / `password`

### 3. Create Test Ticket
1. Login as requester
2. Create ticket with:
   - Category: IT Support > Hardware
   - Priority: High
   - Subject: "Test approval workflow"

### 4. Test Approval Flow
1. Check email notifications
2. Login as Line Manager
3. Go to "Pending Approvals"
4. Approve ticket
5. Check HOD approval is created
6. Login as HOD
7. Approve ticket
8. Verify ticket is routed

## Database Tables

### Key Tables
- `users` - All test users with roles
- `departments` - 5 departments
- `ticket_categories` - Categories with approval settings
- `email_templates` - 6 approval email templates
- `roles` - 7 roles with permissions
- `permissions` - All system permissions

### Approval Tables
- `ticket_approvals` - Approval records (created during workflow)
- `ticket_histories` - Approval history and actions

## Email Configuration

### Required Settings
- `mail_enabled` - Must be `true` to send emails
- `mail_from_address` - From email address
- `mail_from_name` - From name

### Email Template Variables
All templates support these variables:
- `{{ticket_number}}`, `{{subject}}`, `{{description}}`
- `{{status}}`, `{{priority}}`, `{{category}}`
- `{{requester_name}}`, `{{approver_name}}`
- `{{approval_level}}`, `{{comments}}`
- `{{ticket_url}}`, `{{app_name}}`

## Notes

1. **All users have the same password**: `password`
2. **Email templates are active by default**
3. **Categories have realistic approval settings**
4. **Users are distributed across departments**
5. **Line Managers are assigned to their respective departments**
6. **HOD is at organization level (can approve any department)**

## Maintenance

### Adding New Test Users
Edit `database/seeders/UserSeeder.php` and add to `$users` array.

### Updating Email Templates
Edit `database/seeders/EmailTemplateSeeder.php` or use Admin → Email Templates.

### Modifying Approval Settings
Edit `database/seeders/TicketCategorySeeder.php` for category-based settings.

## Support

For issues or questions:
1. Check `APPROVAL_WORKFLOW_TEST_SCENARIOS.md` for test cases
2. Review `APPROVAL_EMAIL_NOTIFICATIONS.md` for email setup
3. Check Laravel logs for errors
4. Verify database seeders ran successfully

