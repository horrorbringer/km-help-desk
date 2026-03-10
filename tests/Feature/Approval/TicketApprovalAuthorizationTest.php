<?php

use App\Constants\ApprovalLevelConstants;
use App\Constants\RoleConstants;
use App\Http\Controllers\Admin\TicketApprovalController;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\TicketCategory;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

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