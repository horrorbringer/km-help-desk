<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Default Ticket Created',
                'type' => 'ticket_created',
                'subject_template' => 'New Ticket: {{ticket_number}} - {{subject}}',
                'message_template' => 'A new ticket has been created: {{ticket_number}} - {{subject}}',
                'variables' => ['ticket_number', 'subject', 'requester_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Default Ticket Assigned',
                'type' => 'ticket_assigned',
                'subject_template' => 'Ticket Assigned: {{ticket_number}}',
                'message_template' => 'Ticket {{ticket_number}} has been assigned to you: {{subject}}',
                'variables' => ['ticket_number', 'subject', 'assigned_agent_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Default Ticket Updated',
                'type' => 'ticket_updated',
                'subject_template' => 'Ticket Updated: {{ticket_number}}',
                'message_template' => 'Ticket {{ticket_number}} has been updated: {{subject}}',
                'variables' => ['ticket_number', 'subject', 'updated_by_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Default Ticket Resolved',
                'type' => 'ticket_resolved',
                'subject_template' => 'Ticket Resolved: {{ticket_number}}',
                'message_template' => 'Ticket {{ticket_number}} has been resolved: {{subject}}',
                'variables' => ['ticket_number', 'subject', 'resolved_by_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Default Ticket Closed',
                'type' => 'ticket_closed',
                'subject_template' => 'Ticket Closed: {{ticket_number}}',
                'message_template' => 'Ticket {{ticket_number}} has been closed: {{subject}}',
                'variables' => ['ticket_number', 'subject', 'closed_by_name'],
                'is_active' => true,
            ],
            [
                'name' => 'Default SLA Breached',
                'type' => 'sla_breached',
                'subject_template' => 'SLA Breached: {{ticket_number}}',
                'message_template' => 'Ticket {{ticket_number}} has breached its SLA: {{subject}}',
                'variables' => ['ticket_number', 'subject', 'breach_type'],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            \App\Models\NotificationTemplate::create($template);
        }
    }
}
