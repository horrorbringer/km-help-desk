# How to Use Email Templates

## Overview

Email templates allow you to customize the emails sent by the system for various ticket events. The system uses these templates to send notifications to users when tickets are created, updated, approved, rejected, etc.

## Accessing Email Templates

1. **Navigate to Email Templates**
   - Go to **Admin** → **Email Templates** (in the sidebar)
   - Or visit: `/admin/email-templates`

2. **Permissions Required**
   - You need the `email-templates.view` permission to view templates
   - You need the `email-templates.create` permission to create templates
   - You need the `email-templates.edit` permission to edit templates

## Creating a New Email Template

### Step 1: Click "New Template"
- On the Email Templates index page, click the **"+ New Template"** button

### Step 2: Fill in Template Information

#### **Template Name** (Required)
- A descriptive name for the template
- Example: "Line Manager Approval Requested"
- This is for your reference only

#### **Event Type** (Required)
- Select the event that triggers this email
- Available events include:
  - **Ticket Events**: `ticket_created`, `ticket_assigned`, `ticket_updated`, `ticket_resolved`, `ticket_closed`, `ticket_commented`
  - **Approval Events**: 
    - `approval_lm_requested` - When Line Manager approval is needed
    - `approval_hod_requested` - When Head of Department approval is needed
    - `approval_lm_approved` - When Line Manager approves
    - `approval_hod_approved` - When Head of Department approves
    - `approval_lm_rejected` - When Line Manager rejects
    - `approval_hod_rejected` - When Head of Department rejects
  - **SLA Events**: `sla_breached`, `sla_warning`

#### **Email Subject** (Required)
- The subject line of the email
- Use variables like `{{ticket_number}}`, `{{subject}}`, etc.
- Example: `Approval Required: {{approval_level}} - Ticket #{{ticket_number}}`

#### **HTML Body** (Optional but Recommended)
- The HTML formatted email content
- Use variables to insert dynamic content
- Example:
```html
<p>Dear {{approver_name}},</p>
<p>A ticket requires your {{approval_level}} approval:</p>
<ul>
  <li>Ticket: #{{ticket_number}}</li>
  <li>Subject: {{subject}}</li>
  <li>Requester: {{requester_name}}</li>
</ul>
<p><a href="{{ticket_url}}">View Ticket</a></p>
```

#### **Plain Text Body** (Optional)
- Plain text version of the email
- Used as fallback if HTML is not available
- Example:
```
Dear {{approver_name}},

A ticket requires your {{approval_level}} approval:

Ticket: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}

View Ticket: {{ticket_url}}
```

#### **Active Status** (Checkbox)
- ✅ **Checked**: Template is active and will be used
- ❌ **Unchecked**: Template is inactive and won't be used
- Only one active template per event type will be used

### Step 3: Use Variables

Variables are placeholders that get replaced with actual data when the email is sent. Use the format: `{{variable_name}}`

**Available Variables:**

#### Standard Ticket Variables:
- `{{ticket_number}}` - Ticket number (e.g., "KT-12345")
- `{{subject}}` - Ticket subject
- `{{description}}` - Ticket description
- `{{status}}` - Current ticket status
- `{{priority}}` - Ticket priority (low, medium, high, critical)
- `{{requester_name}}` - Name of ticket requester
- `{{assigned_agent}}` - Assigned agent name
- `{{assigned_team}}` - Assigned team name
- `{{category}}` - Ticket category
- `{{project}}` - Project name
- `{{ticket_url}}` - Direct link to ticket
- `{{app_name}}` - Application name

#### Approval-Specific Variables:
- `{{approval_level}}` - "Line Manager" or "Head of Department"
- `{{approver_name}}` - Name of the approver
- `{{comments}}` - Approval/rejection comments (if provided)

#### Other Variables:
- `{{updated_by}}` - Name of user who updated the ticket
- `{{resolved_by}}` - Name of user who resolved the ticket
- `{{commenter}}` - Name of user who added a comment
- `{{changes}}` - List of changed fields

### Step 4: Save the Template
- Click **"Create Template"** to save
- The template will be active by default (if checkbox is checked)

## Editing an Email Template

1. **Find the Template**
   - Go to Email Templates index page
   - Use filters to search if needed
   - Click **"Edit"** button on the template row

2. **Make Changes**
   - Update any fields as needed
   - Variables are shown in the right sidebar for reference

3. **Save Changes**
   - Click **"Update Template"** to save

## Managing Email Templates

### Viewing Templates
- The index page shows all templates in a table
- You can see: Name, Event Type, Subject, Status, and Actions

### Filtering Templates
- **Search**: Type in the search box to filter by name, subject, or event type
- **Event Type**: Filter by specific event type
- **Status**: Filter by Active/Inactive status

### Template Status
- **Active** (green badge): Template is active and will be used
- **Inactive** (gray badge): Template is inactive and won't be used

## Example Templates

### 1. Approval Request Email (to Approver)
**Event Type**: `approval_lm_requested` or `approval_hod_requested`

**Subject**: 
```
Approval Required: {{approval_level}} - Ticket #{{ticket_number}}
```

**HTML Body**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .ticket-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <h2>Approval Required</h2>
  <p>Dear {{approver_name}},</p>
  <p>A ticket requires your <strong>{{approval_level}}</strong> approval:</p>
  
  <div class="ticket-info">
    <p><strong>Ticket:</strong> #{{ticket_number}}</p>
    <p><strong>Subject:</strong> {{subject}}</p>
    <p><strong>Requester:</strong> {{requester_name}}</p>
    <p><strong>Priority:</strong> {{priority}}</p>
    <p><strong>Category:</strong> {{category}}</p>
  </div>
  
  <p>Please review and approve/reject this ticket:</p>
  <a href="{{ticket_url}}" class="button">View & Approve Ticket</a>
  
  <p>Thank you,<br>{{app_name}}</p>
</body>
</html>
```

**Plain Text Body**:
```
Approval Required

Dear {{approver_name}},

A ticket requires your {{approval_level}} approval:

Ticket: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Category: {{category}}

Please review and approve/reject this ticket:
{{ticket_url}}

Thank you,
{{app_name}}
```

### 2. Approval Approved Email (to Requester)
**Event Type**: `approval_lm_approved` or `approval_hod_approved`

**Subject**:
```
Ticket #{{ticket_number}} Approved by {{approval_level}}
```

**HTML Body**:
```html
<p>Dear {{requester_name}},</p>
<p>Your ticket has been <strong>approved</strong> by {{approver_name}} ({{approval_level}}):</p>
<p><strong>Ticket:</strong> #{{ticket_number}}<br>
<strong>Subject:</strong> {{subject}}</p>
{{#if comments}}
<p><strong>Comments:</strong> {{comments}}</p>
{{/if}}
<p><a href="{{ticket_url}}">View Ticket</a></p>
<p>Thank you,<br>{{app_name}}</p>
```

### 3. Approval Rejected Email (to Requester)
**Event Type**: `approval_lm_rejected` or `approval_hod_rejected`

**Subject**:
```
Ticket #{{ticket_number}} Rejected by {{approval_level}}
```

**HTML Body**:
```html
<p>Dear {{requester_name}},</p>
<p>Your ticket has been <strong>rejected</strong> by {{approver_name}} ({{approval_level}}):</p>
<p><strong>Ticket:</strong> #{{ticket_number}}<br>
<strong>Subject:</strong> {{subject}}</p>
{{#if comments}}
<p><strong>Reason:</strong> {{comments}}</p>
{{/if}}
<p>You can view the ticket and resubmit if needed:</p>
<p><a href="{{ticket_url}}">View Ticket</a></p>
<p>Thank you,<br>{{app_name}}</p>
```

## Best Practices

1. **Always Create Both HTML and Text Versions**
   - HTML for rich formatting
   - Plain text as fallback for email clients that don't support HTML

2. **Use Clear, Actionable Subjects**
   - Include ticket number and action required
   - Example: "Action Required: Approve Ticket #KT-12345"

3. **Include Ticket URL**
   - Always include `{{ticket_url}}` so users can easily access the ticket
   - Make it a button or prominent link

4. **Test Your Templates**
   - Create a test ticket to verify emails look correct
   - Check both HTML and plain text versions

5. **Keep Templates Active**
   - Only one active template per event type is used
   - Deactivate old templates before creating new ones

6. **Use Variables Wisely**
   - Don't use variables that might not be available for that event
   - Check the "Available Variables" sidebar when creating templates

## Troubleshooting

### Emails Not Sending
1. **Check Template Status**: Make sure template is marked as "Active"
2. **Check Email Settings**: Go to Settings → Mail Enabled
3. **Check Event Type**: Ensure the event type matches what the system is trying to send
4. **Check Logs**: Look for email errors in Laravel logs

### Variables Not Replacing
- Make sure you use double curly braces: `{{variable_name}}`
- Check that the variable name is correct (case-sensitive)
- Some variables may be empty if data doesn't exist

### Multiple Templates for Same Event
- Only the first active template found will be used
- Deactivate other templates if you want a specific one to be used

## System Configuration

### Enable/Disable Email Notifications
- Go to **Admin → Settings**
- Find **"Mail Enabled"** setting
- Toggle to enable/disable all email notifications

### Email From Address
- Configure in **Admin → Settings**
- Set `mail_from_address` and `mail_from_name`
- These are used for all outgoing emails

## Quick Reference

**Access Templates**: Admin → Email Templates  
**Create Template**: Click "+ New Template"  
**Edit Template**: Click "Edit" on template row  
**Variables Format**: `{{variable_name}}`  
**Required Fields**: Name, Event Type, Subject  
**Status**: Active = Used, Inactive = Not Used

