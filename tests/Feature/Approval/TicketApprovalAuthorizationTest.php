<?php

use App\Constants\ApprovalLevelConstants;
use App\Constants\RoleConstants;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\TicketCategory;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // Seed roles and permissions
    $this->artisan('db:seed', ['--class' => 'RolePermissionSeeder']);

    // Create test department
    $this->department = Department::factory()->create([
        'name' => 'Test Department',
        'code' => 'TEST-DEPT',
    ]);

    // Create test category
    $this->category = TicketCategory::factory()->create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'default_team_id' => $this->department->id,
        'requires_approval' => true,
    ]);

    // Create Super Admin
    $this->superAdmin = User::factory()->create();
    $this->superAdmin->assignRole(RoleConstants::SUPER_ADMIN);

    // Create Line Manager
    $this->lineManager = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $this->lineManager->assignRole(RoleConstants::LINE_MANAGER);

    // Create HOD
    $this->hod = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $this->hod->assignRole(RoleConstants::HEAD_OF_DEPARTMENT);

    // Create CEO
    $this->ceo = User::factory()->create();
    $this->ceo->assignRole(RoleConstants::CEO);

    // Create regular user (requester)
    $this->requester = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $this->requester->assignRole('Requester');

    // Create unauthorized user
    $this->unauthorizedUser = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $this->unauthorizedUser->assignRole('Requester');

    // Create agent in the same team as the ticket category
    $this->agent = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $this->agent->assignRole(RoleConstants::AGENT);
});

test('unrelated user cannot view the ticket approval screen', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => null,
        'status' => 'pending',
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->unauthorizedUser)
        ->get(route('admin.tickets.approval', $ticket))
        ->assertForbidden();
});

test('assigned approver can view the ticket approval screen', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => null,
        'status' => 'pending',
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->lineManager)
        ->get(route('admin.tickets.approval', $ticket))
        ->assertRedirect(route('admin.tickets.show', $ticket));
});

test('regular user does not see unassigned pending approvals', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => null,
        'status' => 'pending',
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => null,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->unauthorizedUser)
        ->get(route('admin.ticket-approvals.pending'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/PendingApprovals')
            ->has('approvals.data', 0)
        );
});

test('requester sees approval status without approval controls', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => null,
        'status' => 'pending',
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => null,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->requester)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/Show')
            ->where('ticket.data.current_approval.status', 'pending')
            ->where('ticket.data.current_approval.can_approve', false)
            ->where('ticket.data.approvals.0.can_approve', false)
        );
});

test('assigned approver receives approval controls', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => null,
        'status' => 'pending',
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->lineManager)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/Show')
            ->where('ticket.data.current_approval.can_approve', true)
            ->where('ticket.data.approvals.0.can_approve', true)
        );
});

test('agent cannot view team ticket while approval is pending', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->agent)
        ->get(route('admin.tickets.show', $ticket))
        ->assertForbidden();
});

test('agent ticket list hides team tickets while approval is pending', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->agent)
        ->get(route('admin.tickets.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/Index')
            ->has('tickets.data', 0)
        );
});

test('assigned approver can view team ticket while approval is pending', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->lineManager)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tickets/Show')
            ->where('ticket.data.current_approval.can_approve', true)
        );
});

test('requester only receives permitted ticket status transitions', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    $this->actingAs($this->requester)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ticket.data.status', Ticket::STATUS_OPEN)
            ->where('ticket.data.allowed_statuses', [
                Ticket::STATUS_CLOSED,
                Ticket::STATUS_CANCELLED,
            ])
        );
});

test('requester can only reopen their closed ticket', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_CLOSED,
    ]);

    $this->actingAs($this->requester)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ticket.data.status', Ticket::STATUS_CLOSED)
            ->where('ticket.data.allowed_statuses', [Ticket::STATUS_OPEN])
        );
});

test('ticket status lifecycle blocks direct open to resolved transition', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    expect($this->superAdmin->can('changeStatus', [$ticket, Ticket::STATUS_RESOLVED]))
        ->toBeFalse()
        ->and($this->superAdmin->can('changeStatus', [$ticket, Ticket::STATUS_IN_PROGRESS]))
        ->toBeTrue();
});

test('resolved ticket can only close or return to work', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_RESOLVED,
    ]);

    $this->actingAs($this->superAdmin)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ticket.data.allowed_statuses', [
                Ticket::STATUS_IN_PROGRESS,
                Ticket::STATUS_CLOSED,
            ])
        );
});

test('new tickets always start open even when another status is submitted', function () {
    $response = $this->actingAs($this->superAdmin)
        ->post(route('admin.tickets.store'), [
            'subject' => 'New ticket lifecycle test',
            'description' => 'New tickets must always enter the lifecycle as open.',
            'requester_id' => $this->requester->id,
            'assigned_team_id' => $this->department->id,
            'category_id' => $this->category->id,
            'status' => Ticket::STATUS_RESOLVED,
            'priority' => Ticket::PRIORITY_MEDIUM,
            'source' => 'web',
        ]);

    $ticket = Ticket::where('subject', 'New ticket lifecycle test')->firstOrFail();

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    expect($ticket->status)->toBe(Ticket::STATUS_OPEN);
});

test('pending approval locks user status changes except cancellation', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($this->superAdmin->can('changeStatus', [$ticket, Ticket::STATUS_IN_PROGRESS]))
        ->toBeFalse()
        ->and($this->superAdmin->can('changeStatus', [$ticket, Ticket::STATUS_CANCELLED]))
        ->toBeTrue();

    $this->actingAs($this->superAdmin)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ticket.data.allowed_statuses', [Ticket::STATUS_CANCELLED])
        );
});

test('bulk status cannot move ticket forward while approval is pending', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->superAdmin)
        ->post(route('admin.tickets.bulk-update'), [
            'ticket_ids' => [$ticket->id],
            'action' => 'status',
            'value' => Ticket::STATUS_IN_PROGRESS,
        ])
        ->assertRedirect(route('admin.tickets.index'))
        ->assertSessionHas('error');

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_OPEN);
});

test('agent cannot pick ticket while approval is pending', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'assigned_agent_id' => null,
        'status' => Ticket::STATUS_OPEN,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($this->agent)
        ->put(route('admin.tickets.update', $ticket), [
            'assigned_agent_id' => $this->agent->id,
        ])
        ->assertForbidden();

    expect($ticket->fresh()->assigned_agent_id)->toBeNull();
});

test('requester can resubmit their own rejected cancelled ticket', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_CANCELLED,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'rejected',
        'comments' => 'Need more detail',
        'sequence' => 1,
        'rejected_at' => now(),
    ]);

    $this->actingAs($this->requester)
        ->post(route('admin.tickets.resubmit', $ticket))
        ->assertRedirect(route('admin.tickets.show', $ticket))
        ->assertSessionHas('success');

    $ticket->refresh();

    expect($ticket->status)->toBe(Ticket::STATUS_OPEN)
        ->and($ticket->approvals()->where('status', 'pending')->exists())->toBeTrue();
});

test('agent cannot resubmit another requester rejected ticket', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_CANCELLED,
    ]);

    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'rejected',
        'comments' => 'Need more detail',
        'sequence' => 1,
        'rejected_at' => now(),
    ]);

    $this->actingAs($this->agent)
        ->post(route('admin.tickets.resubmit', $ticket))
        ->assertForbidden();

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_CANCELLED);
});

test('requester cannot see internal comments or private approval details', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
        'internal_note' => 'Staff-only ticket note',
    ]);

    TicketComment::create([
        'ticket_id' => $ticket->id,
        'user_id' => $this->lineManager->id,
        'body' => 'Public update',
        'is_internal' => false,
        'type' => 'comment',
    ]);
    TicketComment::create([
        'ticket_id' => $ticket->id,
        'user_id' => $this->lineManager->id,
        'body' => 'Private staff discussion',
        'is_internal' => true,
        'type' => 'comment',
    ]);
    TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'comments' => 'Private approval context',
        'sequence' => 1,
    ]);

    $this->actingAs($this->requester)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->missing('ticket.data.internal_note')
            ->has('ticket.data.comments', 1)
            ->where('ticket.data.comments.0.body', 'Public update')
            ->where('ticket.data.approvals.0.comments', null)
            ->where('ticket.data.approvals.0.approver.email', null)
        );
});

test('requester cannot create an internal comment', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    $this->actingAs($this->requester)
        ->post(route('admin.ticket-comments.store', $ticket), [
            'body' => 'Requester comment',
            'is_internal' => true,
        ])
        ->assertRedirect();

    expect($ticket->comments()->sole()->is_internal)->toBeFalse();
});

test('requester can change status but cannot change priority', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_MEDIUM,
    ]);

    expect($this->requester->can('tickets.change-status'))->toBeTrue()
        ->and($this->requester->can('tickets.change-priority'))->toBeFalse()
        ->and($this->requester->can('tickets.comment'))->toBeTrue()
        ->and($this->requester->can('tickets.manage-comments'))->toBeFalse();

    $this->actingAs($this->requester)
        ->put(route('admin.tickets.update', $ticket), [
            'priority' => Ticket::PRIORITY_HIGH,
        ])
        ->assertForbidden();

    $this->actingAs($this->requester)
        ->put(route('admin.tickets.update', $ticket), [
            'status' => Ticket::STATUS_CLOSED,
        ])
        ->assertRedirect();

    expect($ticket->fresh()->priority)->toBe(Ticket::PRIORITY_MEDIUM)
        ->and($ticket->fresh()->status)->toBe(Ticket::STATUS_CLOSED);
});

test('ticket payload exposes granular capabilities', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    $this->actingAs($this->requester)
        ->get(route('admin.tickets.show', $ticket))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ticket.data.capabilities.update_details', true)
            ->where('ticket.data.capabilities.change_priority', false)
            ->where('ticket.data.capabilities.comment', true)
            ->where('ticket.data.capabilities.manage_comments', false)
            ->where('ticket.data.capabilities.assign', false)
        );
});

test('resolution summary is required when resolving a ticket', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_IN_PROGRESS,
    ]);

    $this->actingAs($this->superAdmin)
        ->put(route('admin.tickets.update', $ticket), [
            'status' => Ticket::STATUS_RESOLVED,
        ])
        ->assertInvalid(['resolution_summary']);

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_IN_PROGRESS);
});

test('resolution summary is stored when resolving a ticket', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => Ticket::STATUS_IN_PROGRESS,
    ]);

    $this->actingAs($this->superAdmin)
        ->put(route('admin.tickets.update', $ticket), [
            'status' => Ticket::STATUS_RESOLVED,
            'resolution_summary' => 'Replaced the failed power supply and confirmed normal operation.',
        ])
        ->assertRedirect(route('admin.tickets.show', $ticket));

    expect($ticket->fresh()->status)->toBe(Ticket::STATUS_RESOLVED)
        ->and($ticket->fresh()->resolution_summary)
        ->toBe('Replaced the failed power supply and confirmed normal operation.');
});

test('super admin can approve any approval', function () {
    $this->actingAs($this->superAdmin);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Approved by Super Admin',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('success');

    $approval->refresh();
    expect($approval->status)->toBe('approved');
});

test('assigned approver can approve their own approval', function () {
    $this->actingAs($this->lineManager);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Approved by Line Manager',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('success');

    $approval->refresh();
    expect($approval->status)->toBe('approved');
});

test('user with required role can approve at their level', function () {
    $this->actingAs($this->hod);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::HEAD_OF_DEPARTMENT,
        'approver_id' => $this->hod->id,
        'status' => 'pending',
        'sequence' => 2,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Approved by HOD',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('success');

    $approval->refresh();
    expect($approval->status)->toBe('approved');
});

test('unauthorized user cannot approve approval', function () {
    $this->actingAs($this->unauthorizedUser);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Should not work',
    ]);

    $response->assertStatus(403);
    $response->assertSee('not authorized');

    $approval->refresh();
    expect($approval->status)->toBe('pending');
});

test('cannot approve already approved approval', function () {
    $this->actingAs($this->lineManager);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'approved',
        'sequence' => 1,
        'approved_at' => now(),
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Should not work',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('error');
    $response->assertSessionHas('error', function ($value) {
        return str_contains($value, 'already been approved');
    }
    );
});

test('cannot approve already rejected approval', function () {
    $this->actingAs($this->lineManager);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'rejected',
        'sequence' => 1,
        'rejected_at' => now(),
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Should not work',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('error');
    $response->assertSessionHas('error', function ($value) {
        return str_contains($value, 'already been rejected');
    }
    );
});

test('cannot approve approval for resolved ticket', function () {
    $this->actingAs($this->lineManager);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'resolved',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Should not work',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('error');
    $response->assertSessionHas('error', function ($value) {
        return str_contains($value, 'already resolved');
    }
    );
});

test('cannot approve out of sequence', function () {
    $this->actingAs($this->hod);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    // Create LM approval (pending, not approved)
    $lmApproval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    // Create HOD approval (should not be approvable until LM is approved)
    $hodApproval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::HEAD_OF_DEPARTMENT,
        'approver_id' => $this->hod->id,
        'status' => 'pending',
        'sequence' => 2,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $hodApproval), [
        'comments' => 'Should not work - out of sequence',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('error');
    $response->assertSessionHas('error', function ($value) {
        return str_contains($value, 'previous approvals');
    }
    );

    $hodApproval->refresh();
    expect($hodApproval->status)->toBe('pending');
});

test('can approve when previous approvals are approved', function () {
    $this->actingAs($this->hod);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    // Create and approve LM approval first
    $lmApproval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'approved',
        'sequence' => 1,
        'approved_at' => now(),
    ]);

    // Now HOD approval should be approvable
    $hodApproval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::HEAD_OF_DEPARTMENT,
        'approver_id' => $this->hod->id,
        'status' => 'pending',
        'sequence' => 2,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $hodApproval), [
        'comments' => 'Approved after LM',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('success');

    $hodApproval->refresh();
    expect($hodApproval->status)->toBe('approved');
});

test('deputy line manager can approve at lm level', function () {
    $dlm = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $dlm->assignRole(RoleConstants::DEPUTY_LINE_MANAGER);

    Auth::login($dlm);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $dlm->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.approve', $approval), [
        'comments' => 'Approved by DLM',
    ]);

    $response->assertRedirect(route('admin.tickets.show', $ticket));
    $response->assertSessionHas('success');

    $approval->refresh();
    expect($approval->status)->toBe('approved');
});

test('reject requires comments', function () {
    $this->actingAs($this->lineManager);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'pending',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
        'approver_id' => $this->lineManager->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $response = $this->post(route('admin.ticket-approvals.reject', $approval), [
        // No comments
    ]);

    $response->assertInvalid(['comments']);
});
