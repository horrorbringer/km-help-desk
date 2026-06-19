<?php

use App\Http\Requests\AutomationRuleRequest;
use App\Models\AutomationRule;
use App\Models\Department;
use App\Models\EscalationRule;
use App\Models\HelpDeskNotification;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketComment;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\EscalationService;
use App\Support\TicketRuleCatalog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    $this->department = Department::create([
        'name' => 'Rule Test Department',
        'code' => 'RULE-TEST',
        'is_support_team' => true,
    ]);
    $this->category = TicketCategory::create([
        'name' => 'Rule Test Category',
        'slug' => 'rule-test-category',
        'default_team_id' => $this->department->id,
    ]);
    $this->requester = User::factory()->create();
    $this->agent = User::factory()->create();
});

function createRuleTestTicket(
    User $requester,
    Department $department,
    User $agent,
    TicketCategory $category,
    array $attributes = []
): Ticket {
    return Ticket::create(array_merge([
        'requester_id' => $requester->id,
        'assigned_team_id' => $department->id,
        'assigned_agent_id' => $agent->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ], $attributes));
}

test('automation validation accepts empty conditions and change operators', function () {
    $request = new AutomationRuleRequest;
    $validator = Validator::make([
        'name' => 'Notify on assignment',
        'trigger_event' => 'ticket_updated',
        'conditions' => [
            [
                'field' => 'assigned_agent_id',
                'operator' => 'is_changed',
                'value' => null,
            ],
        ],
        'actions' => [
            ['type' => 'notify_agent', 'value' => null],
        ],
        'priority' => 10,
        'is_active' => true,
    ], $request->rules());

    expect($validator->passes())->toBeTrue();

    $emptyConditionsValidator = Validator::make([
        'name' => 'Always run',
        'trigger_event' => 'ticket_created',
        'conditions' => [],
        'actions' => [
            ['type' => 'notify_requester', 'value' => null],
        ],
        'priority' => 0,
        'is_active' => true,
    ], $request->rules());

    expect($emptyConditionsValidator->passes())->toBeTrue();
});

test('legacy action names are normalized for rule editing', function () {
    expect(TicketRuleCatalog::normalizeActions([
        ['type' => 'change_priority', 'value' => Ticket::PRIORITY_HIGH],
        ['type' => 'notify_team_managers', 'value' => null],
    ]))->toBe([
        ['type' => 'set_priority', 'value' => Ticket::PRIORITY_HIGH],
        ['type' => 'notify_department_managers', 'value' => null],
    ]);
});

test('in operators accept validated arrays of ticket values', function () {
    expect(TicketRuleCatalog::conditionValueError(
        'status',
        'in',
        [Ticket::STATUS_OPEN, Ticket::STATUS_PENDING]
    ))->toBeNull();

    expect(TicketRuleCatalog::conditionValueError(
        'priority',
        'not_in',
        [Ticket::PRIORITY_HIGH, 'urgent']
    ))->toBe('The selected priority is invalid.');
});

test('automation executes supported SLA and comment participant actions', function () {
    $slaPolicy = SlaPolicy::create([
        'name' => 'Rule Test SLA',
        'priority' => Ticket::PRIORITY_HIGH,
        'response_time' => 30,
        'resolution_time' => 240,
        'is_active' => true,
    ]);
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category
    );
    $rule = AutomationRule::create([
        'name' => 'Apply SLA and notify participants',
        'trigger_event' => 'ticket_created',
        'conditions' => [],
        'actions' => [
            ['type' => 'set_sla_policy', 'value' => $slaPolicy->id],
            ['type' => 'notify_comment_participants', 'value' => null],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    app(AutomationService::class)->onTicketCreated($ticket);

    expect($ticket->fresh()->sla_policy_id)->toBe($slaPolicy->id)
        ->and($rule->fresh()->execution_count)->toBe(1)
        ->and(HelpDeskNotification::where('ticket_id', $ticket->id)->count())->toBe(2);
});

test('comment automation can exclude internal comments and is audited', function () {
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category
    );
    $rule = AutomationRule::create([
        'name' => 'Notify on public comments',
        'trigger_event' => 'comment_added',
        'conditions' => [
            ['field' => 'comment_is_internal', 'operator' => 'equals', 'value' => false],
        ],
        'actions' => [
            ['type' => 'notify_comment_participants', 'value' => null],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);
    $watcher = User::factory()->create();
    $ticket->watchers()->attach($watcher->id, ['created_at' => now()]);
    $publicComment = TicketComment::create([
        'ticket_id' => $ticket->id,
        'user_id' => $this->requester->id,
        'body' => 'Public update',
        'is_internal' => false,
    ]);
    $internalComment = TicketComment::create([
        'ticket_id' => $ticket->id,
        'user_id' => $this->agent->id,
        'body' => 'Internal update',
        'is_internal' => true,
    ]);

    $service = app(AutomationService::class);
    $service->onCommentAdded($ticket, $publicComment);
    $service->onCommentAdded($ticket, $internalComment);

    expect($rule->fresh()->execution_count)->toBe(1)
        ->and(HelpDeskNotification::where('ticket_id', $ticket->id)->count())->toBe(2)
        ->and(
            HelpDeskNotification::where('ticket_id', $ticket->id)
                ->where('user_id', $this->requester->id)
                ->exists()
        )->toBeFalse()
        ->and(
            HelpDeskNotification::where('ticket_id', $ticket->id)
                ->pluck('user_id')
                ->sort()
                ->values()
                ->all()
        )->toBe(collect([$this->agent->id, $watcher->id])->sort()->values()->all())
        ->and($ticket->histories()->count())->toBe(1)
        ->and($ticket->histories()->first()->metadata)->toMatchArray([
            'source_type' => 'automation_rule',
            'source_id' => $rule->id,
        ]);
});

test('an escalation rule executes only once for each ticket', function () {
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category
    );
    $ticket->forceFill(['created_at' => now()->subHours(2)])->saveQuietly();

    $rule = EscalationRule::create([
        'name' => 'Escalate old tickets',
        'conditions' => [],
        'time_trigger_type' => 'created_at',
        'time_trigger_minutes' => 60,
        'actions' => [
            ['type' => 'set_priority', 'value' => Ticket::PRIORITY_CRITICAL],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    $service = app(EscalationService::class);
    $service->checkTicket($ticket);
    $service->checkTicket($ticket->fresh());

    expect($ticket->fresh()->priority)->toBe(Ticket::PRIORITY_CRITICAL)
        ->and($rule->fresh()->execution_count)->toBe(1);

    $this->assertDatabaseCount('escalation_executions', 1);
    $this->assertDatabaseHas('escalation_executions', [
        'escalation_rule_id' => $rule->id,
        'ticket_id' => $ticket->id,
        'occurrence_key' => 'once',
    ]);
    $this->assertDatabaseCount('ticket_histories', 1);
    expect($ticket->histories()->first()->metadata)->toMatchArray([
        'source_type' => 'escalation_rule',
        'source_id' => $rule->id,
    ]);
});

test('a repeating escalation waits for its configured interval', function () {
    Carbon::setTestNow('2026-06-08 10:00:00');
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category
    );
    $ticket->forceFill(['created_at' => now()->subHours(2)])->saveQuietly();
    $rule = EscalationRule::create([
        'name' => 'Repeat critical notifications',
        'conditions' => [],
        'time_trigger_type' => 'created_at',
        'time_trigger_minutes' => 60,
        'repeat_interval_minutes' => 30,
        'actions' => [
            ['type' => 'notify_requester', 'value' => null],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    $service = app(EscalationService::class);
    $service->checkTicket($ticket);

    Carbon::setTestNow('2026-06-08 10:29:00');
    $service->checkTicket($ticket->fresh());

    Carbon::setTestNow('2026-06-08 10:30:00');
    $service->checkTicket($ticket->fresh());

    expect($rule->fresh()->execution_count)->toBe(2);
    $this->assertDatabaseCount('escalation_executions', 2);
    $this->assertDatabaseCount('help_desk_notifications', 2);

    Carbon::setTestNow();
});

test('changing an SLA due date creates a new escalation occurrence', function () {
    Carbon::setTestNow('2026-06-08 10:00:00');
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category,
        ['resolution_due_at' => now()->subHours(2)]
    );
    $rule = EscalationRule::create([
        'name' => 'Resolution SLA breach',
        'conditions' => [],
        'time_trigger_type' => 'resolution_due_at',
        'time_trigger_minutes' => 30,
        'actions' => [
            ['type' => 'notify_requester', 'value' => null],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    $service = app(EscalationService::class);
    $service->checkTicket($ticket);

    $ticket->updateQuietly(['resolution_due_at' => now()->subHour()]);
    $service->checkTicket($ticket->fresh());

    expect($rule->fresh()->execution_count)->toBe(2);
    $this->assertDatabaseCount('escalation_executions', 2);

    Carbon::setTestNow();
});

test('rule routes enforce permissions and reject invalid action values', function () {
    Permission::create(['name' => 'automation-rules.create']);
    $user = User::factory()->create();
    $payload = [
        'name' => 'Invalid priority rule',
        'trigger_event' => 'ticket_created',
        'conditions' => [],
        'actions' => [
            ['type' => 'set_priority', 'value' => 'urgent'],
        ],
        'priority' => 10,
        'is_active' => true,
    ];

    $this->actingAs($user)
        ->post(route('admin.automation-rules.store'), $payload)
        ->assertForbidden();

    $user->givePermissionTo('automation-rules.create');

    $this->actingAs($user)
        ->post(route('admin.automation-rules.store'), $payload)
        ->assertSessionHasErrors('actions.0.value');

    $this->assertDatabaseCount('automation_rules', 0);
});

test('changing escalation behavior clears prior execution reservations', function () {
    Permission::create(['name' => 'escalation-rules.edit']);
    $user = User::factory()->create();
    $user->givePermissionTo('escalation-rules.edit');
    $ticket = createRuleTestTicket(
        $this->requester,
        $this->department,
        $this->agent,
        $this->category
    );
    $ticket->forceFill(['created_at' => now()->subHours(2)])->saveQuietly();
    $rule = EscalationRule::create([
        'name' => 'Old escalation behavior',
        'conditions' => [],
        'time_trigger_type' => 'created_at',
        'time_trigger_minutes' => 60,
        'actions' => [
            ['type' => 'set_priority', 'value' => Ticket::PRIORITY_HIGH],
        ],
        'priority' => 10,
        'is_active' => true,
    ]);

    app(EscalationService::class)->checkTicket($ticket);
    $this->assertDatabaseCount('escalation_executions', 1);

    $this->actingAs($user)
        ->put(route('admin.escalation-rules.update', $rule), [
            'name' => $rule->name,
            'description' => null,
            'conditions' => [],
            'time_trigger_type' => 'created_at',
            'time_trigger_minutes' => 90,
            'repeat_interval_minutes' => null,
            'actions' => [
                ['type' => 'set_priority', 'value' => Ticket::PRIORITY_CRITICAL],
            ],
            'priority' => 10,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.escalation-rules.index'));

    $this->assertDatabaseCount('escalation_executions', 0);
});
