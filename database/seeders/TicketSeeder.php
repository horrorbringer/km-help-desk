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
use Carbon\Carbon;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        // Get all users and key by email for easy lookup
        $users = User::all()->keyBy('email');
        
        // Ensure we have at least one user
        if ($users->isEmpty()) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }
        
        // Get a default user for fallback (prefer Super Admin, then any user)
        $defaultUser = User::role('Super Admin')->first() 
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        $categories = TicketCategory::whereIn('slug', [
            'hardware-requests',
            'hardware-issues',
            'equipment-failure',
            'incident-reporting',
            'purchase-request',
            'application-access',
            'network-connectivity',
            'invoice-processing',
            'expense-reimbursement',
        ])->get()->keyBy('slug');

        $slaPolicies = SlaPolicy::get()->keyBy('priority');
        $projects = Project::get()->keyBy('code');
        $tags = Tag::get()->keyBy('slug');

        $tickets = [
            [
                'subject' => 'Laptop won\'t connect to site VPN',
                'description' => 'Unable to reach VPN gateway while on remote site. Error 809 displayed.',
                'requester' => 'vannak@kimmix.com', // Field Ops Manager
                'assigned_team_id' => optional($categories['hardware-issues'] ?? null)->default_team_id,
                'assigned_agent' => 'makara@kimmix.com', // System Administrator
                'category' => 'hardware-issues',
                'project' => 'PRJ-DTE-01',
                'sla' => 'medium',
                'priority' => 'high',
                'status' => 'in_progress',
                'tags' => ['urgent'],
                'watchers' => ['makara@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'makara@kimmix.com',
                        'body' => 'Investigating VPN gateway logs and certificate status.',
                        'is_internal' => true,
                    ],
                    [
                        'author' => 'makara@kimmix.com',
                        'body' => 'Please retry connection after we reset the VPN concentrator.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'in_progress', 'user' => 'makara@kimmix.com'],
                    ['action' => 'assignment', 'field_name' => 'assigned_agent_id', 'old' => null, 'new' => 'makara@kimmix.com', 'user' => 'makara@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Tower crane hydraulic leak',
                'description' => 'Oil leak detected on TC-04 at level 18. Need inspection ASAP.',
                'requester' => 'vannak@kimmix.com', // Field Ops Manager
                'assigned_team_id' => optional($categories['equipment-failure'] ?? null)->default_team_id,
                'assigned_agent' => 'vutty@kimmix.com', // Safety Officer
                'category' => 'equipment-failure',
                'project' => 'PRJ-DTE-01',
                'sla' => 'critical',
                'priority' => 'critical',
                'status' => 'assigned',
                'tags' => ['urgent', 'site-visit'],
                'watchers' => ['vutty@kimmix.com', 'makara@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'vutty@kimmix.com',
                        'body' => 'Dispatching HSE inspector to site. Please keep crane offline.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'assigned', 'user' => 'vutty@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Request for fast-setting concrete mix',
                'description' => 'Need expedited PO for 200m3 of fast-setting mix for Riverside pour.',
                'requester' => 'vannak@kimmix.com',
                'assigned_team_id' => optional($categories['purchase-request'] ?? null)->default_team_id,
                'assigned_agent' => 'vanny@kimmix.com',
                'category' => 'purchase-request',
                'project' => 'PRJ-RBU-02',
                'sla' => 'high',
                'priority' => 'high',
                'status' => 'pending',
                'tags' => ['client-facing'],
                'watchers' => ['vanny@kimmix.com', 'sopheap@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'vanny@kimmix.com',
                        'body' => 'RFQ sent to preferred vendor. Awaiting quote.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'pending', 'user' => 'vanny@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Email access not working after password change',
                'description' => 'Changed my password yesterday and now cannot access email. Getting authentication error.',
                'requester' => 'requester01@kimmix.com',
                'assigned_team_id' => optional($categories['application-access'] ?? null)->default_team_id,
                'assigned_agent' => 'agent01@kimmix.com',
                'category' => 'application-access',
                'sla' => 'medium',
                'priority' => 'medium',
                'status' => 'in_progress',
                'tags' => ['it-issue'],
                'watchers' => ['agent01@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'agent01@kimmix.com',
                        'body' => 'Checking email server logs and account status.',
                        'is_internal' => true,
                    ],
                    [
                        'author' => 'agent01@kimmix.com',
                        'body' => 'Account was locked due to multiple failed login attempts. I\'ve unlocked it. Please try logging in again.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'assigned', 'user' => 'agent01@kimmix.com'],
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'assigned', 'new' => 'in_progress', 'user' => 'agent01@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Near miss incident - falling debris',
                'description' => 'Small piece of concrete fell from level 12, landed near workers on level 8. No injuries but close call. Area secured.',
                'requester' => 'sokun@kimmix.com',
                'assigned_team_id' => optional($categories['incident-reporting'] ?? null)->default_team_id,
                'assigned_agent' => 'vutty@kimmix.com',
                'category' => 'incident-reporting',
                'sla' => 'critical',
                'priority' => 'critical',
                'status' => 'resolved',
                'tags' => ['safety', 'site-visit'],
                'watchers' => ['vutty@kimmix.com', 'makara@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'vutty@kimmix.com',
                        'body' => 'HSE inspector dispatched to site. Initial assessment complete.',
                    ],
                    [
                        'author' => 'vutty@kimmix.com',
                        'body' => 'Root cause identified: inadequate edge protection. Corrective action implemented. All workers briefed on safety protocols.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'assigned', 'user' => 'vutty@kimmix.com'],
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'assigned', 'new' => 'in_progress', 'user' => 'vutty@kimmix.com'],
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'in_progress', 'new' => 'resolved', 'user' => 'vutty@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Printer not printing in color',
                'description' => 'Office printer on 3rd floor only prints in black and white. Color cartridge was just replaced.',
                'requester' => 'chanthou@kimmix.com',
                'assigned_team_id' => optional($categories['hardware-issues'] ?? null)->default_team_id,
                'assigned_agent' => 'ratha@kimmix.com',
                'category' => 'hardware-issues',
                'sla' => 'medium',
                'priority' => 'low',
                'status' => 'resolved',
                'tags' => ['it-issue'],
                'comments' => [
                    [
                        'author' => 'ratha@kimmix.com',
                        'body' => 'Checked printer settings. Color printing was disabled in driver settings. Enabled and tested - working now.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'resolved', 'user' => 'ratha@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Request for office supplies',
                'description' => 'Need to order office supplies: pens, notebooks, staplers, and printer paper for Q1.',
                'requester' => 'sophea@kimmix.com',
                'assigned_team_id' => optional($categories['purchase-request'] ?? null)->default_team_id,
                'assigned_agent' => 'srey@kimmix.com',
                'category' => 'purchase-request',
                'sla' => 'medium',
                'priority' => 'low',
                'status' => 'open',
                'tags' => ['procurement'],
            ],
            [
                'subject' => 'Excavator hydraulic system failure',
                'description' => 'Excavator EX-05 at Downtown Tower site has hydraulic leak. Machine is down and blocking work area.',
                'requester' => 'vannak.field@kimmix.com',
                'assigned_team_id' => optional($categories['equipment-failure'] ?? null)->default_team_id,
                'assigned_agent' => 'sokha@kimmix.com',
                'category' => 'equipment-failure',
                'project' => 'PRJ-DTE-01',
                'sla' => 'high',
                'priority' => 'high',
                'status' => 'assigned',
                'tags' => ['equipment', 'urgent', 'site-visit'],
                'watchers' => ['sokha@kimmix.com', 'vannak@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'sokha@kimmix.com',
                        'body' => 'Field engineer dispatched. ETA 2 hours. Will assess and provide repair estimate.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'assigned', 'user' => 'sokha@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Payroll query - missing overtime hours',
                'description' => 'My overtime hours from last week are not showing in this week\'s payroll. I worked 8 hours overtime on Tuesday.',
                'requester' => 'pov@kimmix.com',
                'assigned_team_id' => optional($categories['invoice-processing'] ?? null)->default_team_id,
                'assigned_agent' => 'sopheap@kimmix.com',
                'category' => 'invoice-processing',
                'sla' => 'medium',
                'priority' => 'medium',
                'status' => 'pending',
                'tags' => ['finance'],
                'watchers' => ['sopheap@kimmix.com'],
                'comments' => [
                    [
                        'author' => 'sopheap@kimmix.com',
                        'body' => 'Checking timesheet records and payroll system. Will update once verified.',
                    ],
                ],
                'histories' => [
                    ['action' => 'status_changed', 'field_name' => 'status', 'old' => 'open', 'new' => 'pending', 'user' => 'sopheap@kimmix.com'],
                ],
            ],
            [
                'subject' => 'Wi-Fi connection issues in conference room',
                'description' => 'Wi-Fi signal is very weak in Conference Room B. Cannot connect to network during meetings.',
                'requester' => 'sopheap.manager@kimmix.com',
                'assigned_team_id' => optional($categories['network-connectivity'] ?? null)->default_team_id,
                'assigned_agent' => 'makara@kimmix.com',
                'category' => 'network-connectivity',
                'sla' => 'medium',
                'priority' => 'medium',
                'status' => 'open',
                'tags' => ['it-issue'],
            ],
        ];

        // Generate tickets spread over the past month (30 days)
        $ticketIndex = 0;
        foreach ($tickets as $data) {
            $sla = $slaPolicies[$data['sla']] ?? null;

            // Get user IDs with fallback to default user
            $requester = $users[$data['requester']] ?? $defaultUser;
            $assignedAgent = $users[$data['assigned_agent']] ?? $defaultUser;

            // Ensure we have valid user IDs
            if (!$requester || !$requester->id) {
                $this->command->warn("Skipping ticket: No requester found.");
                continue;
            }

            // Get category with fallback
            $category = $categories[$data['category']] ?? null;
            if (!$category) {
                $this->command->warn("Skipping ticket: Category '{$data['category']}' not found.");
                continue;
            }

            // Generate random date within the past month (0-30 days ago)
            // Spread tickets more evenly across the month
            $daysAgo = rand(0, 30);
            $hoursAgo = rand(0, 23);
            $minutesAgo = rand(0, 59);
            
            // Create ticket date (random time within the past month)
            $ticketCreatedAt = Carbon::now()
                ->subDays($daysAgo)
                ->subHours($hoursAgo)
                ->subMinutes($minutesAgo);
            
            // Calculate SLA dates relative to ticket creation
            $firstResponseDueAt = $sla && $ticketCreatedAt 
                ? $ticketCreatedAt->copy()->addMinutes($sla->response_time) 
                : null;
            $resolutionDueAt = $sla && $ticketCreatedAt 
                ? $ticketCreatedAt->copy()->addMinutes($sla->resolution_time) 
                : null;
            
            // Update ticket updated_at based on status (resolved/closed tickets updated more recently)
            $ticketUpdatedAt = $ticketCreatedAt->copy();
            $resolvedAt = null;
            $closedAt = null;
            
            if ($data['status'] === 'resolved') {
                // Resolved tickets were resolved within 1-7 days after creation
                $resolvedDays = rand(1, min(7, $daysAgo));
                $resolvedAt = $ticketCreatedAt->copy()->addDays($resolvedDays);
                $ticketUpdatedAt = $resolvedAt->copy();
            } elseif ($data['status'] === 'closed') {
                // Closed tickets were resolved first, then closed
                $resolvedDays = rand(1, min(5, $daysAgo));
                $closedDays = rand($resolvedDays + 1, min(7, $daysAgo));
                $resolvedAt = $ticketCreatedAt->copy()->addDays($resolvedDays);
                $closedAt = $ticketCreatedAt->copy()->addDays($closedDays);
                $ticketUpdatedAt = $closedAt->copy();
            } else {
                // Active tickets might have been updated recently
                $ticketUpdatedAt->addHours(rand(0, min(48, $hoursAgo)));
            }

            // Generate ticket number if not provided
            $ticketNumber = $data['ticket_number'] ?? Ticket::generateTicketNumber();
            
            $ticket = Ticket::updateOrCreate(
                ['ticket_number' => $ticketNumber],
                [
                    'subject' => $data['subject'],
                    'description' => $data['description'],
                    'requester_id' => $requester->id,
                    'assigned_team_id' => $data['assigned_team_id'],
                    'assigned_agent_id' => $assignedAgent?->id,
                    'category_id' => $category->id, 
                    'project_id' => optional($projects[$data['project'] ?? null] ?? null)->id,
                    'sla_policy_id' => optional($slaPolicies[$data['sla']] ?? null)->id,
                    'status' => $data['status'],
                    'priority' => $data['priority'],
                    'source' => 'web',
                    'first_response_due_at' => $firstResponseDueAt,
                    'resolution_due_at' => $resolutionDueAt,
                    'resolved_at' => $resolvedAt,
                    'closed_at' => $closedAt,
                    'created_at' => $ticketCreatedAt,
                    'updated_at' => $ticketUpdatedAt,
                ]
            );

            if ($ticket->exists) {
                $this->attachTags($ticket, $data['tags'] ?? [], $tags);
                $this->attachWatchers($ticket, $data['watchers'] ?? [], $users);
                $this->syncComments($ticket, $data['comments'] ?? [], $users, $ticketCreatedAt);
                $this->syncHistory($ticket, $data['histories'] ?? [], $users, $ticketCreatedAt);
            }
            
            $ticketIndex++;
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
        // Get default user for fallback
        $defaultUser = User::role('Super Admin')->first() 
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        $watcherIds = collect($watcherEmails)
            ->map(function ($email) use ($users, $defaultUser) {
                $user = $users[$email] ?? $defaultUser;
                return $user?->id;
            })
            ->filter()
            ->unique()
            ->all();

        if ($watcherIds) {
            $ticket->watchers()->syncWithoutDetaching($watcherIds);
        }
    }

    private function syncComments(Ticket $ticket, array $comments, $users, Carbon $ticketCreatedAt): void
    {
        // Get default user for fallback
        $defaultUser = User::role('Super Admin')->first() 
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        $commentIndex = 0;
        foreach ($comments as $comment) {
            $author = $users[$comment['author']] ?? $defaultUser;
            
            if (!$author || !$author->id) {
                continue; // Skip if no valid user found
            }

            // Comments are created after ticket creation, spread over time
            // First comment: 1-6 hours after ticket creation
            // Subsequent comments: progressively later
            $commentDelay = ($commentIndex * 2) + rand(1, 6); // Hours
            $commentCreatedAt = $ticketCreatedAt->copy()->addHours($commentDelay);
            
            // Don't create comments in the future
            if ($commentCreatedAt->isFuture()) {
                $commentCreatedAt = Carbon::now()->subHours(rand(1, 24));
            }

            TicketComment::updateOrCreate(
                [
                    'ticket_id' => $ticket->id,
                    'body' => $comment['body'],
                ],
                [
                    'user_id' => $author->id,
                    'is_internal' => $comment['is_internal'] ?? false,
                    'type' => $comment['type'] ?? 'comment',
                    'created_at' => $commentCreatedAt,
                    'updated_at' => $commentCreatedAt,
                ]
            );
            
            $commentIndex++;
        }
    }

    private function syncHistory(Ticket $ticket, array $histories, $users, Carbon $ticketCreatedAt): void
    {
        // Get default user for history entries
        $defaultUser = User::role('Super Admin')->first() 
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        $historyIndex = 0;
        foreach ($histories as $entry) {
            $userEmail = $entry['user'] ?? 'makara@kimmix.com';
            $historyUser = $users[$userEmail] ?? $defaultUser;

            if (!$historyUser || !$historyUser->id) {
                continue; // Skip if no valid user found
            }

            // History entries are created progressively after ticket creation
            // First entry: 0-2 hours after ticket creation
            // Subsequent entries: progressively later
            $historyDelay = ($historyIndex * 1) + rand(0, 2); // Hours
            $historyCreatedAt = $ticketCreatedAt->copy()->addHours($historyDelay);
            
            // Don't create history in the future
            if ($historyCreatedAt->isFuture()) {
                $historyCreatedAt = Carbon::now()->subHours(rand(1, 12));
            }

            TicketHistory::updateOrCreate(
                [
                    'ticket_id' => $ticket->id,
                    'action' => $entry['action'],
                    'field_name' => $entry['field_name'] ?? null,
                    'new_value' => $entry['new'] ?? null,
                ],
                [
                    'user_id' => $historyUser->id,
                    'old_value' => $entry['old'] ?? null,
                    'description' => $entry['description'] ?? null,
                    'created_at' => $entry['created_at'] ?? $historyCreatedAt,
                ]
            );
            
            $historyIndex++;
        }
    }
}


