<?php

use App\Models\Department;
use App\Models\HelpDeskNotification;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketComment;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Mail;

test('comment lifecycle and automation paths do not create duplicate notifications', function () {
    Mail::fake();

    $department = Department::create([
        'name' => 'Notification Test Department',
        'code' => 'NOTIFY-TEST',
        'is_support_team' => true,
    ]);
    $category = TicketCategory::create([
        'name' => 'Notification Test Category',
        'slug' => 'notification-test-category',
        'default_team_id' => $department->id,
    ]);
    $requester = User::factory()->create();
    $agent = User::factory()->create();
    $watcher = User::factory()->create();
    $ticket = Ticket::create([
        'requester_id' => $requester->id,
        'assigned_team_id' => $department->id,
        'assigned_agent_id' => $agent->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);
    $ticket->watchers()->attach($watcher->id, ['created_at' => now()]);
    $comment = TicketComment::create([
        'ticket_id' => $ticket->id,
        'user_id' => $requester->id,
        'body' => 'Please check this update.',
        'is_internal' => false,
    ]);

    app(NotificationService::class)->notifyCommentAdded($ticket, $comment, $requester);

    \App\Models\AutomationRule::create([
        'name' => 'Notification test comment rule',
        'trigger_event' => 'comment_added',
        'conditions' => [],
        'actions' => [
            ['type' => 'notify_comment_participants'],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);
    app(AutomationService::class)->onCommentAdded($ticket, $comment);

    expect(
        HelpDeskNotification::where('ticket_id', $ticket->id)
            ->pluck('user_id')
            ->sort()
            ->values()
            ->all()
    )->toBe(collect([$agent->id, $watcher->id])->sort()->values()->all());
    $this->assertDatabaseCount('help_desk_notifications', 2);
});
