<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Ticket Created Template
            [
                'name' => 'Ticket Created',
                'slug' => 'ticket-created',
                'event_type' => 'ticket_created',
                'subject' => 'Ticket #{{ticket_number}} Created: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
    .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ticket Created</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been successfully created:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>Assigned To:</strong> {{assigned_agent}}</p>
        <p><strong>Assigned Team:</strong> {{assigned_team}}</p>
      </div>
      
      <p>You can track the progress of your ticket using the link below:</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you for using our help desk system.</p>
      <p>Best regards,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Created

Dear {{requester_name}},

Your ticket has been successfully created:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Priority: {{priority}}
Category: {{category}}
Status: {{status}}
Assigned To: {{assigned_agent}}
Assigned Team: {{assigned_team}}

You can track the progress of your ticket using the link below:
{{ticket_url}}

Thank you for using our help desk system.

Best regards,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Ticket Assigned Template
            [
                'name' => 'Ticket Assigned',
                'slug' => 'ticket-assigned',
                'event_type' => 'ticket_assigned',
                'subject' => 'New Ticket Assigned: #{{ticket_number}} - {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
    .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Ticket Assigned</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>A new ticket has been assigned to you:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Requester:</strong> {{requester_name}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p>Please review and take appropriate action:</p>
      <a href="{{ticket_url}}" class="button">View & Respond to Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'New Ticket Assigned

Hello,

A new ticket has been assigned to you:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Category: {{category}}
Status: {{status}}

Please review and take appropriate action:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Ticket Updated Template
            [
                'name' => 'Ticket Updated',
                'slug' => 'ticket-updated',
                'event_type' => 'ticket_updated',
                'subject' => 'Ticket #{{ticket_number}} Updated: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .changes { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ticket Updated</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your ticket has been updated:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Updated By:</strong> {{updated_by}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      {{#if changes}}
      <div class="changes">
        <p><strong>Changes Made:</strong> {{changes}}</p>
      </div>
      {{/if}}
      
      <p>View the updated ticket:</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Updated

Hello,

Your ticket has been updated:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Updated By: {{updated_by}}
Priority: {{priority}}
Status: {{status}}

{{#if changes}}
Changes Made: {{changes}}
{{/if}}

View the updated ticket:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Ticket Resolved Template
            [
                'name' => 'Ticket Resolved',
                'slug' => 'ticket-resolved',
                'event_type' => 'ticket_resolved',
                'subject' => 'Ticket #{{ticket_number}} Resolved: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
    .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✓ Ticket Resolved</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>resolved</strong>:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Resolved By:</strong> {{resolved_by}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p>If you are satisfied with the resolution, you can close the ticket. If you need further assistance, please reply to this email or add a comment to the ticket.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you for using our help desk system.</p>
      <p>Best regards,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Resolved

Dear {{requester_name}},

Your ticket has been resolved:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Resolved By: {{resolved_by}}
Status: {{status}}

If you are satisfied with the resolution, you can close the ticket. If you need further assistance, please reply to this email or add a comment to the ticket.

View Ticket: {{ticket_url}}

Thank you for using our help desk system.

Best regards,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Ticket Closed Template
            [
                'name' => 'Ticket Closed',
                'slug' => 'ticket-closed',
                'event_type' => 'ticket_closed',
                'subject' => 'Ticket #{{ticket_number}} Closed: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6c757d; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6c757d; }
    .button { background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Ticket Closed</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>closed</strong>:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p>This ticket is now closed. If you need to reopen it or have any questions, please contact our support team.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you for using our help desk system.</p>
      <p>Best regards,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Closed

Dear {{requester_name}},

Your ticket has been closed:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Status: {{status}}

This ticket is now closed. If you need to reopen it or have any questions, please contact our support team.

View Ticket: {{ticket_url}}

Thank you for using our help desk system.

Best regards,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Ticket Commented Template
            [
                'name' => 'Ticket Commented',
                'slug' => 'ticket-commented',
                'event_type' => 'ticket_commented',
                'subject' => 'New Comment on Ticket #{{ticket_number}}: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #17a2b8; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
    .button { background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Comment Added</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>A new comment has been added to ticket #{{ticket_number}}:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Comment By:</strong> {{commenter}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p>View the comment and respond:</p>
      <a href="{{ticket_url}}" class="button">View Ticket & Comment</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'New Comment Added

Hello,

A new comment has been added to ticket #{{ticket_number}}:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Comment By: {{commenter}}
Status: {{status}}

View the comment and respond:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Approval Request Templates
            [
                'name' => 'Line Manager Approval Requested',
                'slug' => 'line-manager-approval-requested',
                'event_type' => 'approval_lm_requested',
                'subject' => 'Approval Required: Line Manager - Ticket #{{ticket_number}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff; }
    .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Approval Required</h2>
    </div>
    <div class="content">
      <p>Dear {{approver_name}},</p>
      <p>A ticket requires your <strong>Line Manager</strong> approval:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Requester:</strong> {{requester_name}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p>Please review the ticket details and take appropriate action:</p>
      <a href="{{ticket_url}}" class="button">View & Approve Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Approval Required

Dear {{approver_name}},

A ticket requires your Line Manager approval:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Category: {{category}}
Status: {{status}}

Please review the ticket details and take appropriate action:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            [
                'name' => 'Head of Department Approval Requested',
                'slug' => 'hod-approval-requested',
                'event_type' => 'approval_hod_requested',
                'subject' => 'Approval Required: Head of Department - Ticket #{{ticket_number}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
    .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Head of Department Approval Required</h2>
    </div>
    <div class="content">
      <p>Dear {{approver_name}},</p>
      <p>A ticket requires your <strong>Head of Department</strong> approval:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Requester:</strong> {{requester_name}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Category:</strong> {{category}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <p><strong>Note:</strong> This ticket has already been approved by the Line Manager and now requires your approval.</p>
      
      <p>Please review the ticket details and take appropriate action:</p>
      <a href="{{ticket_url}}" class="button">View & Approve Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Head of Department Approval Required

Dear {{approver_name}},

A ticket requires your Head of Department approval:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Category: {{category}}
Status: {{status}}

Note: This ticket has already been approved by the Line Manager and now requires your approval.

Please review the ticket details and take appropriate action:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Approval Approved Templates
            [
                'name' => 'Line Manager Approval Approved',
                'slug' => 'line-manager-approval-approved',
                'event_type' => 'approval_lm_approved',
                'subject' => 'Ticket #{{ticket_number}} Approved by Line Manager',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
    .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✓ Ticket Approved</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>approved</strong> by {{approver_name}} (Line Manager):</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Approved By:</strong> {{approver_name}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      {{#if comments}}
      <p><strong>Comments:</strong> {{comments}}</p>
      {{/if}}
      
      <p>The ticket has been routed to the appropriate team for processing.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Approved

Dear {{requester_name}},

Your ticket has been approved by {{approver_name}} (Line Manager):

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Approved By: {{approver_name}}
Status: {{status}}

{{#if comments}}
Comments: {{comments}}
{{/if}}

The ticket has been routed to the appropriate team for processing.
View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            [
                'name' => 'Head of Department Approval Approved',
                'slug' => 'hod-approval-approved',
                'event_type' => 'approval_hod_approved',
                'subject' => 'Ticket #{{ticket_number}} Approved by Head of Department',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
    .button { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✓ Ticket Approved</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>approved</strong> by {{approver_name}} (Head of Department):</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Approved By:</strong> {{approver_name}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      {{#if comments}}
      <p><strong>Comments:</strong> {{comments}}</p>
      {{/if}}
      
      <p>The ticket has been routed to the appropriate team for final processing.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Approved

Dear {{requester_name}},

Your ticket has been approved by {{approver_name}} (Head of Department):

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Approved By: {{approver_name}}
Status: {{status}}

{{#if comments}}
Comments: {{comments}}
{{/if}}

The ticket has been routed to the appropriate team for final processing.
View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Approval Rejected Templates
            [
                'name' => 'Line Manager Approval Rejected',
                'slug' => 'line-manager-approval-rejected',
                'event_type' => 'approval_lm_rejected',
                'subject' => 'Ticket #{{ticket_number}} Rejected by Line Manager',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
    .rejection-reason { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✗ Ticket Rejected</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>rejected</strong> by {{approver_name}} (Line Manager):</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Rejected By:</strong> {{approver_name}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      {{#if comments}}
      <div class="rejection-reason">
        <p><strong>Reason for Rejection:</strong></p>
        <p>{{comments}}</p>
      </div>
      {{/if}}
      
      <p>You can view the ticket and resubmit it with additional information or corrections if needed.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Rejected

Dear {{requester_name}},

Your ticket has been rejected by {{approver_name}} (Line Manager):

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Rejected By: {{approver_name}}
Status: {{status}}

{{#if comments}}
Reason for Rejection:
{{comments}}
{{/if}}

You can view the ticket and resubmit it with additional information or corrections if needed.
View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            [
                'name' => 'Head of Department Approval Rejected',
                'slug' => 'hod-approval-rejected',
                'event_type' => 'approval_hod_rejected',
                'subject' => 'Ticket #{{ticket_number}} Rejected by Head of Department',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
    .rejection-reason { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>✗ Ticket Rejected</h2>
    </div>
    <div class="content">
      <p>Dear {{requester_name}},</p>
      <p>Your ticket has been <strong>rejected</strong> by {{approver_name}} (Head of Department):</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Rejected By:</strong> {{approver_name}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      {{#if comments}}
      <div class="rejection-reason">
        <p><strong>Reason for Rejection:</strong></p>
        <p>{{comments}}</p>
      </div>
      {{/if}}
      
      <p><strong>Note:</strong> This ticket was previously approved by the Line Manager but has been rejected at the Head of Department level.</p>
      
      <p>You can view the ticket and resubmit it with additional information or corrections if needed.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'Ticket Rejected

Dear {{requester_name}},

Your ticket has been rejected by {{approver_name}} (Head of Department):

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Rejected By: {{approver_name}}
Status: {{status}}

{{#if comments}}
Reason for Rejection:
{{comments}}
{{/if}}

Note: This ticket was previously approved by the Line Manager but has been rejected at the Head of Department level.

You can view the ticket and resubmit it with additional information or corrections if needed.
View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // Comment Added Template
            [
                'name' => 'Comment Added',
                'slug' => 'comment-added',
                'event_type' => 'comment_added',
                'subject' => 'New Comment on Ticket #{{ticket_number}}: {{subject}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #17a2b8; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
    .comment-box { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
    .button { background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Comment Added</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>A new comment has been added to ticket #{{ticket_number}}:</p>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Comment By:</strong> {{commenter}}</p>
        <p><strong>Status:</strong> {{status}}</p>
      </div>
      
      <div class="comment-box">
        <p><strong>Comment:</strong></p>
        <p>{{comment_body}}</p>
      </div>
      
      <p>View the comment and respond:</p>
      <a href="{{ticket_url}}" class="button">View Ticket & Comment</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'New Comment Added

Hello,

A new comment has been added to ticket #{{ticket_number}}:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Comment By: {{commenter}}
Status: {{status}}

Comment:
{{comment_body}}

View the comment and respond:
{{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // SLA Breached Template
            [
                'name' => 'SLA Breached',
                'slug' => 'sla-breached',
                'event_type' => 'sla_breached',
                'subject' => '⚠️ SLA Breached: Ticket #{{ticket_number}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .button { background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ SLA Breached</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <div class="warning">
        <p><strong>⚠️ Service Level Agreement (SLA) has been breached for the following ticket:</strong></p>
      </div>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Requester:</strong> {{requester_name}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>SLA Policy:</strong> {{sla_policy}}</p>
      </div>
      
      <p>This ticket has exceeded its SLA response or resolution time. Please take immediate action.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'SLA Breached

Hello,

⚠️ Service Level Agreement (SLA) has been breached for the following ticket:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Status: {{status}}
SLA Policy: {{sla_policy}}

This ticket has exceeded its SLA response or resolution time. Please take immediate action.

View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
            // SLA Warning Template
            [
                'name' => 'SLA Warning',
                'slug' => 'sla-warning',
                'event_type' => 'sla_warning',
                'subject' => '⚠️ SLA Warning: Ticket #{{ticket_number}}',
                'body_html' => '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .ticket-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
    .button { background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>⚠️ SLA Warning</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <div class="warning">
        <p><strong>⚠️ Service Level Agreement (SLA) warning for the following ticket:</strong></p>
      </div>
      
      <div class="ticket-info">
        <p><strong>Ticket Number:</strong> #{{ticket_number}}</p>
        <p><strong>Subject:</strong> {{subject}}</p>
        <p><strong>Requester:</strong> {{requester_name}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Status:</strong> {{status}}</p>
        <p><strong>SLA Policy:</strong> {{sla_policy}}</p>
      </div>
      
      <p>This ticket is approaching its SLA response or resolution time. Please take action soon to avoid breaching the SLA.</p>
      <a href="{{ticket_url}}" class="button">View Ticket</a>
      
      <p>Thank you,<br><strong>{{app_name}}</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>',
                'body_text' => 'SLA Warning

Hello,

⚠️ Service Level Agreement (SLA) warning for the following ticket:

Ticket Number: #{{ticket_number}}
Subject: {{subject}}
Requester: {{requester_name}}
Priority: {{priority}}
Status: {{status}}
SLA Policy: {{sla_policy}}

This ticket is approaching its SLA response or resolution time. Please take action soon to avoid breaching the SLA.

View Ticket: {{ticket_url}}

Thank you,
{{app_name}}

---
This is an automated notification. Please do not reply to this email.',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['event_type' => $template['event_type']],
                $template
            );
        }
    }
}

