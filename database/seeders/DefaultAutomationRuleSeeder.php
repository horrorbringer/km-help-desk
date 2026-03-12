<?php

namespace Database\Seeders;

use App\Models\AutomationRule;
use Illuminate\Database\Seeder;

class DefaultAutomationRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rules = [
            [
                'name' => 'Notify Requester on Ticket Creation',
                'description' => 'Send a notification to the requester when a ticket is created.',
                'trigger_event' => 'ticket_created',
                'priority' => 10,
                'conditions' => [], // No conditions, always notify on creation
                'actions' => [
                    ['type' => 'notify_requester']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Team Managers on New Ticket',
                'description' => 'Notify department managers when a new ticket is created.',
                'trigger_event' => 'ticket_created',
                'priority' => 9,
                'conditions' => [],
                'actions' => [
                    ['type' => 'notify_team_managers']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Agent on Assignment',
                'description' => 'Notify the agent when a ticket is assigned to them.',
                'trigger_event' => 'ticket_updated',
                'priority' => 10,
                'conditions' => [
                    ['field' => 'assigned_agent_id', 'operator' => 'is_changed', 'value' => null]
                ],
                'actions' => [
                    ['type' => 'notify_agent']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Team on Assignment',
                'description' => 'Notify the team when a ticket is assigned to their team.',
                'trigger_event' => 'ticket_updated',
                'priority' => 9,
                'conditions' => [
                    ['field' => 'assigned_team_id', 'operator' => 'is_changed', 'value' => null]
                ],
                'actions' => [
                    ['type' => 'notify_team_managers']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Requester on Resolution',
                'description' => 'Notify the requester when their ticket is resolved.',
                'trigger_event' => 'ticket_status_changed',
                'priority' => 10,
                'conditions' => [
                    ['field' => 'status', 'operator' => 'changed_to', 'value' => 'resolved']
                ],
                'actions' => [
                    ['type' => 'notify_requester']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Requester on Closure',
                'description' => 'Notify the requester when their ticket is closed.',
                'trigger_event' => 'ticket_status_changed',
                'priority' => 9,
                'conditions' => [
                    ['field' => 'status', 'operator' => 'changed_to', 'value' => 'closed']
                ],
                'actions' => [
                    ['type' => 'notify_requester']
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Notify Participants on New Comment',
                'description' => 'Notify requester and assigned agent when a public comment is added.',
                'trigger_event' => 'comment_added',
                'priority' => 10,
                'conditions' => [], // No conditions - notify on all public comments
                'actions' => [
                    ['type' => 'notify_comment_participants']
                ],
                'is_active' => true,
            ],
        ];

        foreach ($rules as $rule) {
            AutomationRule::updateOrCreate(
            ['name' => $rule['name']],
                $rule
            );
        }
    }
}