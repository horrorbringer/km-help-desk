<?php

use App\Jobs\SendPushNotificationJob;
use App\Models\AutomationRule;
use App\Models\Department;
use App\Models\EmailTemplate;
use App\Models\HelpDeskNotification;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\EmailService;
use App\Services\NotificationService;
use App\Support\NotificationType;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

test('notification types include every type produced by the notification service', function () {
    expect(HelpDeskNotification::TYPES)
        ->toContain(NotificationType::COMMENT_ADDED)
        ->toContain(NotificationType::COMMENT_INTERNAL)
        ->toContain(NotificationType::TICKET_ROUTED_TO_TEAM)
        ->toContain(NotificationType::TEAMMATE_TICKET_CREATED)
        ->toContain(NotificationType::APPROVAL_REQUESTED)
        ->toContain(NotificationType::APPROVAL_APPROVED)
        ->toContain(NotificationType::APPROVAL_REJECTED);
});

test('notifications with the same dedupe key are created only once', function () {
    $user = User::factory()->create();
    $service = app(NotificationService::class);

    $first = $service->create(
        $user->id,
        NotificationType::TICKET_UPDATED,
        'Ticket Updated',
        'The ticket changed.',
        dedupeKey: 'ticket:123:update:456:user:'.$user->id
    );
    $second = $service->create(
        $user->id,
        NotificationType::TICKET_UPDATED,
        'Duplicate Ticket Updated',
        'This duplicate should not be stored.',
        dedupeKey: 'ticket:123:update:456:user:'.$user->id
    );

    expect($second->is($first))->toBeTrue();
    $this->assertDatabaseCount('help_desk_notifications', 1);
    $this->assertDatabaseHas('help_desk_notifications', [
        'id' => $first->id,
        'title' => 'Ticket Updated',
    ]);
});

test('team managers receive one assignment notification when notification paths overlap', function () {
    $department = Department::create([
        'name' => 'Assignment Notification Department',
        'code' => 'ASSIGN-NOTIFY',
        'is_support_team' => true,
    ]);
    $manager = User::factory()->create([
        'department_id' => $department->id,
        'is_active' => true,
    ]);
    $member = User::factory()->create([
        'department_id' => $department->id,
        'is_active' => true,
    ]);
    $manager->assignRole(Role::create(['name' => 'Line Manager']));
    $category = TicketCategory::create([
        'name' => 'Assignment Notification Category',
        'slug' => 'assignment-notification-category',
        'default_team_id' => $department->id,
    ]);
    $ticket = Ticket::create([
        'requester_id' => User::factory()->create()->id,
        'assigned_team_id' => $department->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);
    $service = app(NotificationService::class);

    $service->notifyTicketAssigned($ticket);
    $service->notifyDepartmentManagers($ticket);

    expect(
        HelpDeskNotification::where('ticket_id', $ticket->id)
            ->where('user_id', $manager->id)
            ->count()
    )->toBe(1)
        ->and(
            HelpDeskNotification::where('ticket_id', $ticket->id)
                ->where('user_id', $member->id)
                ->count()
        )->toBe(1);
});

test('email transport exceptions are rethrown for queued job retries', function () {
    $user = User::factory()->create();
    EmailTemplate::create([
        'name' => 'Retry Test Template',
        'slug' => 'retry-test-template',
        'event_type' => 'ticket_created',
        'subject' => 'Test',
        'body_text' => 'Test',
        'variables' => [],
        'is_active' => true,
    ]);
    Mail::shouldReceive('send')
        ->once()
        ->andThrow(new RuntimeException('Transport unavailable'));

    expect(fn () => app(EmailService::class)->sendTemplate(
        'ticket_created',
        $user,
        []
    ))->toThrow(RuntimeException::class, 'Transport unavailable');
});

test('lifecycle and automation requester notifications are deduplicated', function () {
    $department = Department::create([
        'name' => 'Lifecycle Notification Department',
        'code' => 'LIFECYCLE-NOTIFY',
        'is_support_team' => true,
    ]);
    $category = TicketCategory::create([
        'name' => 'Lifecycle Notification Category',
        'slug' => 'lifecycle-notification-category',
        'default_team_id' => $department->id,
    ]);
    $requester = User::factory()->create();
    $agent = User::factory()->create();
    $ticket = Ticket::create([
        'requester_id' => $requester->id,
        'assigned_team_id' => $department->id,
        'assigned_agent_id' => $agent->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_RESOLVED,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);
    $ticket->histories()->create([
        'user_id' => $agent->id,
        'action' => 'status_changed',
        'field_name' => 'status',
        'old_value' => Ticket::STATUS_OPEN,
        'new_value' => Ticket::STATUS_RESOLVED,
        'description' => 'Status changed to resolved',
        'created_at' => now(),
    ]);
    AutomationRule::create([
        'name' => 'Lifecycle resolution test',
        'trigger_event' => 'ticket_status_changed',
        'conditions' => [
            ['field' => 'status', 'operator' => 'changed_to', 'value' => Ticket::STATUS_RESOLVED],
        ],
        'actions' => [
            ['type' => 'notify_requester'],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    app(AutomationService::class)->onTicketStatusChanged($ticket, [
        'status' => Ticket::STATUS_OPEN,
    ]);
    app(NotificationService::class)->notifyTicketLifecycleUpdate($ticket, $agent, [
        'status' => [
            'old' => Ticket::STATUS_OPEN,
            'new' => Ticket::STATUS_RESOLVED,
        ],
    ]);

    $this->assertDatabaseCount('help_desk_notifications', 1);
    $this->assertDatabaseHas('help_desk_notifications', [
        'user_id' => $requester->id,
        'ticket_id' => $ticket->id,
        'type' => NotificationType::TICKET_RESOLVED,
    ]);
});

test('new in-app notifications queue browser push delivery when VAPID is configured', function () {
    Queue::fake();
    config()->set('webpush.vapid.subject', 'mailto:helpdesk@example.com');
    config()->set('webpush.vapid.public_key', 'public-key');
    config()->set('webpush.vapid.private_key', 'private-key');
    $user = User::factory()->create();

    $notification = app(NotificationService::class)->create(
        $user->id,
        NotificationType::TICKET_UPDATED,
        'Ticket Updated',
        'The ticket changed.'
    );

    Queue::assertPushed(
        SendPushNotificationJob::class,
        fn (SendPushNotificationJob $job) => $job->notificationId === $notification->id
    );
});

test('template notifications fall back when no active template exists', function () {
    $department = Department::create([
        'name' => 'Template Fallback Department',
        'code' => 'TEMPLATE-FALLBACK',
        'is_support_team' => true,
    ]);
    $category = TicketCategory::create([
        'name' => 'Template Fallback Category',
        'slug' => 'template-fallback-category',
        'default_team_id' => $department->id,
    ]);
    $user = User::factory()->create();
    $ticket = Ticket::create([
        'requester_id' => $user->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);

    $notification = app(NotificationService::class)->createFromTemplate(
        $user->id,
        NotificationType::TICKET_ASSIGNED,
        $ticket->id,
        variables: [
            'ticket_number' => $ticket->ticket_number,
            'subject' => $ticket->subject,
        ],
        dedupeKey: "ticket:{$ticket->id}:template-fallback:user:{$user->id}"
    );

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toBe('New Ticket Assigned');
    $this->assertDatabaseHas('help_desk_notifications', [
        'user_id' => $user->id,
        'ticket_id' => $ticket->id,
        'type' => NotificationType::TICKET_ASSIGNED,
    ]);
});

test('approval requester notifications are deduplicated', function () {
    $department = Department::create([
        'name' => 'Approval Dedupe Department',
        'code' => 'APPROVAL-DEDUPE',
        'is_support_team' => true,
    ]);
    $category = TicketCategory::create([
        'name' => 'Approval Dedupe Category',
        'slug' => 'approval-dedupe-category',
        'default_team_id' => $department->id,
    ]);
    $requester = User::factory()->create();
    $approver = User::factory()->create();
    $ticket = Ticket::create([
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);
    $service = app(NotificationService::class);

    $service->notifyApprovalApproved($ticket, $approver, 'lm');
    $service->notifyApprovalApproved($ticket, $approver, 'lm');

    expect(HelpDeskNotification::where('user_id', $requester->id)
        ->where('ticket_id', $ticket->id)
        ->where('type', NotificationType::APPROVAL_APPROVED)
        ->count())->toBe(1);
});

test('settings test notification endpoint creates notification and queues push when configured', function () {
    Queue::fake();
    config()->set('webpush.vapid.subject', 'mailto:helpdesk@example.com');
    config()->set('webpush.vapid.public_key', 'public-key');
    config()->set('webpush.vapid.private_key', 'private-key');
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('push.test'));

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'push_configured' => true,
        ]);
    $this->assertDatabaseHas('help_desk_notifications', [
        'user_id' => $user->id,
        'title' => 'Test Notification',
        'message' => 'Your notification settings are working.',
    ]);
    Queue::assertPushed(SendPushNotificationJob::class);
});
