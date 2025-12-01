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
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['event_type' => $template['event_type']],
                $template
            );
        }
    }
}

