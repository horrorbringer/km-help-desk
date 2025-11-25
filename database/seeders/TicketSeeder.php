<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketComment;
use App\Models\TicketHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::whereIn('email', [
            'admin@kimmix.test',
            'field.manager@kimmix.test',
            'procurement@kimmix.test',
            'finance@kimmix.test',
            'safety@kimmix.test',
        ])->get()->keyBy('email');

        $categories = TicketCategory::whereIn('slug', [
            'hardware',
            'equipment-failure',
            'incident-reporting',
            'procurement-requests',
        ])->get()->keyBy('slug');

        $slaPolicies = SlaPolicy::get()->keyBy('priority');
        $projects = Project::get()->keyBy('code');
        $tags = Tag::get()->keyBy('slug');

        $tickets = [
            [
                'ticket_number' => 'KT-10001',
                'subject' => 'Laptop won’t connect to site VPN',
                'description' => 'Unable to reach VPN gateway while on remote site. Error 809 displayed.',
                'requester' => 'field.manager@kimmix.test',
                'assigned_team_id' => optional($categories['hardware'] ?? null)->default_team_id,
                'assigned_agent' => 'admin@kimmix.test',
                'category' => 'hardware',
                'project' => 'PRJ-DTE-01',
                'sla' => 'medium',
                'priority' => 'high',
                'status' => 'in_progress',
                'tags' => ['urgent'],
                'watchers' => ['admin@kimmix.test'],
                'comments' => [
                    [
                        'author' => 'admin@kimmix.test',
                        'body' => 'Investigating VPN gateway logs and certificate status.',
                        'is_internal' => true,
                    ],
                    [
                        'author' => 'admin@kimmix.test',
                        'body' => 'Please retry connection after we reset the VPN concentrator.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'in_progress'],
                    ['action' => 'assignment', 'field_name' => 'assigned_agent_id', 'old' => null, 'new' => 'admin@kimmix.test'],
                ],
            ],
            [
                'ticket_number' => 'KT-10002',
                'subject' => 'Tower crane hydraulic leak',
                'description' => 'Oil leak detected on TC-04 at level 18. Need inspection ASAP.',
                'requester' => 'field.manager@kimmix.test',
                'assigned_team_id' => optional($categories['equipment-failure'] ?? null)->default_team_id,
                'assigned_agent' => 'safety@kimmix.test',
                'category' => 'equipment-failure',
                'project' => 'PRJ-DTE-01',
                'sla' => 'critical',
                'priority' => 'critical',
                'status' => 'assigned',
                'tags' => ['urgent', 'site-visit'],
                'watchers' => ['safety@kimmix.test', 'admin@kimmix.test'],
                'comments' => [
                    [
                        'author' => 'safety@kimmix.test',
                        'body' => 'Dispatching HSE inspector to site. Please keep crane offline.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'assigned'],
                ],
            ],
            [
                'ticket_number' => 'KT-10003',
                'subject' => 'Request for fast-setting concrete mix',
                'description' => 'Need expedited PO for 200m3 of fast-setting mix for Riverside pour.',
                'requester' => 'field.manager@kimmix.test',
                'assigned_team_id' => optional($categories['procurement-requests'] ?? null)->default_team_id,
                'assigned_agent' => 'procurement@kimmix.test',
                'category' => 'procurement-requests',
                'project' => 'PRJ-RBU-02',
                'sla' => 'high',
                'priority' => 'high',
                'status' => 'pending',
                'tags' => ['client-facing'],
                'watchers' => ['procurement@kimmix.test', 'finance@kimmix.test'],
                'comments' => [
                    [
                        'author' => 'procurement@kimmix.test',
                        'body' => 'RFQ sent to preferred vendor. Awaiting quote.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'pending'],
                ],
            ],
        ];

        foreach ($tickets as $data) {
            $sla = $slaPolicies[$data['sla']] ?? null;

            $ticket = Ticket::updateOrCreate(
                ['ticket_number' => $data['ticket_number']],
                [
                    'subject' => $data['subject'],
                    'description' => $data['description'],
                    'requester_id' => optional($users[$data['requester']] ?? null)->id,
                    'assigned_team_id' => $data['assigned_team_id'],
                    'assigned_agent_id' => optional($users[$data['assigned_agent']] ?? null)->id,
                    'category_id' => optional($categories[$data['category']] ?? null)->id,
                    'project_id' => optional($projects[$data['project']] ?? null)->id,
                    'sla_policy_id' => optional($slaPolicies[$data['sla']] ?? null)->id,
                    'status' => $data['status'],
                    'priority' => $data['priority'],
                    'source' => 'web',
                    'first_response_due_at' => $sla ? now()->addMinutes($sla->response_time) : null,
                    'resolution_due_at' => $sla ? now()->addMinutes($sla->resolution_time) : null,
                ]
            );

            if ($ticket->exists) {
                $this->attachTags($ticket, $data['tags'] ?? [], $tags);
                $this->attachWatchers($ticket, $data['watchers'] ?? [], $users);
                $this->syncComments($ticket, $data['comments'] ?? [], $users);
                $this->syncHistory($ticket, $data['histories'] ?? [], $users);
            }
        }
    }

    private function attachTags(Ticket $ticket, array $tagSlugs, $tags): void
    {
        $tagIds = collect($tagSlugs)
            ->map(fn ($slug) => optional($tags[$slug] ?? null)->id)
            ->filter()
            ->all();

        if ($tagIds) {
            $ticket->tags()->syncWithoutDetaching($tagIds);
        }
    }

    private function attachWatchers(Ticket $ticket, array $watcherEmails, $users): void
    {
        $watcherIds = collect($watcherEmails)
            ->map(fn ($email) => optional($users[$email] ?? null)->id)
            ->filter()
            ->all();

        if ($watcherIds) {
            $ticket->watchers()->syncWithoutDetaching($watcherIds);
        }
    }

    private function syncComments(Ticket $ticket, array $comments, $users): void
    {
        foreach ($comments as $comment) {
            TicketComment::updateOrCreate(
                [
                    'ticket_id' => $ticket->id,
                    'body' => $comment['body'],
                ],
                [
                    'user_id' => optional($users[$comment['author']] ?? null)->id,
                    'is_internal' => $comment['is_internal'] ?? false,
                    'type' => $comment['type'] ?? 'comment',
                ]
            );
        }
    }

    private function syncHistory(Ticket $ticket, array $histories, $users): void
    {
        foreach ($histories as $entry) {
            TicketHistory::updateOrCreate(
                [
                    'ticket_id' => $ticket->id,
                    'action' => $entry['action'],
                    'field_name' => $entry['field_name'] ?? null,
                    'new_value' => $entry['new'] ?? null,
                ],
                [
                    'user_id' => optional($users[$entry['user'] ?? 'admin@kimmix.test'] ?? null)->id,
                    'old_value' => $entry['old'] ?? null,
                    'description' => $entry['description'] ?? null,
                    'created_at' => $entry['created_at'] ?? now(),
                ]
            );
        }
    }
}


