# Approval Email Notifications Implementation

## Status: ✅ IMPLEMENTED

Email notifications for the approval workflow have been fully implemented.

## What's Implemented

### 1. EmailService Methods ✅
Added three new methods to `app/Services/EmailService.php`:
- `sendApprovalRequested()` - Sends email when approval is requested
- `sendApprovalApproved()` - Sends email when approval is granted
- `sendApprovalRejected()` - Sends email when approval is rejected

### 2. NotificationService Methods ✅
Added three new methods to `app/Services/NotificationService.php`:
- `notifyApprovalRequested()` - Creates in-app notification + sends email
- `notifyApprovalApproved()` - Notifies requester via email + in-app
- `notifyApprovalRejected()` - Notifies requester via email + in-app

### 3. ApprovalWorkflowService Integration ✅
Updated `app/Services/ApprovalWorkflowService.php` to:
- Send email when LM approval is requested
- Send email when HOD approval is requested
- Send email when approval is approved (to requester)
- Send email when approval is rejected (to requester)

## Email Template Events Required

You need to create email templates for these events in the admin panel:

### For Approvers (When Approval is Requested):
1. **`approval_lm_requested`** - Email to Line Manager when approval is needed
2. **`approval_hod_requested`** - Email to Head of Department when approval is needed

### For Requesters (When Approval Decision is Made):
3. **`approval_lm_approved`** - Email to requester when LM approves
4. **`approval_hod_approved`** - Email to requester when HOD approves
5. **`approval_lm_rejected`** - Email to requester when LM rejects
6. **`approval_hod_rejected`** - Email to requester when HOD rejects

## Email Template Variables

All approval email templates have access to these variables:

### Standard Ticket Data:
- `{{ ticket_number }}` - Ticket number (e.g., "KT-12345")
- `{{ subject }}` - Ticket subject
- `{{ description }}` - Ticket description
- `{{ status }}` - Current ticket status
- `{{ priority }}` - Ticket priority (low, medium, high, critical)
- `{{ requester_name }}` - Name of ticket requester
- `{{ assigned_agent }}` - Assigned agent name
- `{{ assigned_team }}` - Assigned team name
- `{{ category }}` - Ticket category
- `{{ project }}` - Project name
- `{{ ticket_url }}` - Direct link to ticket
- `{{ app_name }}` - Application name

### Approval-Specific Variables:
- `{{ approval_level }}` - "Line Manager" or "Head of Department"
- `{{ approver_name }}` - Name of the approver
- `{{ comments }}` - Approval/rejection comments (if provided)

## Example Email Templates

### 1. Approval Requested (to Approver)
**Event**: `approval_lm_requested` or `approval_hod_requested`

**Subject**: `Approval Required: {{ approval_level }} - Ticket #{{ ticket_number }}`

**Body**:
```
Dear {{ approver_name }},

A ticket requires your {{ approval_level }} approval:

Ticket: #{{ ticket_number }}
Subject: {{ subject }}
Requester: {{ requester_name }}
Priority: {{ priority }}
Category: {{ category }}

Please review and approve/reject this ticket:
{{ ticket_url }}

Thank you,
{{ app_name }}
```

### 2. Approval Approved (to Requester)
**Event**: `approval_lm_approved` or `approval_hod_approved`

**Subject**: `Ticket #{{ ticket_number }} Approved by {{ approval_level }}`

**Body**:
```
Dear {{ requester_name }},

Your ticket has been approved by {{ approver_name }} ({{ approval_level }}):

Ticket: #{{ ticket_number }}
Subject: {{ subject }}

{{#if comments}}
Comments: {{ comments }}
{{/if}}

View your ticket: {{ ticket_url }}

Thank you,
{{ app_name }}
```

### 3. Approval Rejected (to Requester)
**Event**: `approval_lm_rejected` or `approval_hod_rejected`

**Subject**: `Ticket #{{ ticket_number }} Rejected by {{ approval_level }}`

**Body**:
```
Dear {{ requester_name }},

Your ticket has been rejected by {{ approver_name }} ({{ approval_level }}):

Ticket: #{{ ticket_number }}
Subject: {{ subject }}

{{#if comments}}
Reason: {{ comments }}
{{/if}}

You can view the ticket and resubmit if needed:
{{ ticket_url }}

Thank you,
{{ app_name }}
```

## How to Create Email Templates

1. Go to **Admin → Email Templates**
2. Click **"New Email Template"**
3. Fill in:
   - **Name**: e.g., "Line Manager Approval Requested"
   - **Event Type**: Select from dropdown (or enter manually):
     - `approval_lm_requested`
     - `approval_hod_requested`
     - `approval_lm_approved`
     - `approval_hod_approved`
     - `approval_lm_rejected`
     - `approval_hod_rejected`
   - **Subject**: Use template variables
   - **Body (HTML)**: Use template variables
   - **Body (Text)**: Plain text version
   - **Status**: Active

4. Save the template

## Email Flow

### When Ticket is Created:
1. LM approval is created
2. **Email sent to Line Manager** (`approval_lm_requested`)

### When LM Approves:
1. Ticket routes to team
2. **Email sent to Requester** (`approval_lm_approved`)
3. If HOD approval needed → HOD approval created
4. **Email sent to HOD** (`approval_hod_requested`)

### When LM Rejects:
1. Ticket status → cancelled
2. **Email sent to Requester** (`approval_lm_rejected`)

### When HOD Approves:
1. Ticket routes to final destination
2. **Email sent to Requester** (`approval_hod_approved`)

### When HOD Rejects:
1. Ticket status → cancelled
2. **Email sent to Requester** (`approval_hod_rejected`)

## Configuration

### Enable/Disable Email Notifications
Email notifications can be controlled via:
- **Settings → Mail Enabled**: Global toggle for all emails
- **Email Template Status**: Each template can be active/inactive

### Email Settings
Configure in **Admin → Settings**:
- `mail_enabled` - Enable/disable all emails
- `mail_from_address` - From email address
- `mail_from_name` - From name

## Testing

To test email notifications:

1. **Create a ticket** → Check LM receives approval request email
2. **Approve as LM** → Check requester receives approval email
3. **Reject as LM** → Check requester receives rejection email
4. **Approve as HOD** → Check requester receives HOD approval email

## Notes

- Emails are sent asynchronously (wrapped in try-catch to prevent failures)
- If email sending fails, it's logged but doesn't block the approval process
- Email templates must be created in the admin panel before emails will be sent
- If no template exists for an event, a warning is logged but no error occurs

