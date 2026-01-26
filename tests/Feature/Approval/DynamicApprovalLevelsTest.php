<?php

use App\Constants\ApprovalLevelConstants;
use App\Constants\RoleConstants;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\TicketCategory;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create required roles for testing
    $roles = [
        RoleConstants::DEPUTY_LINE_MANAGER,
        RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT,
        RoleConstants::FINANCE_MANAGER,
        RoleConstants::PROCUREMENT_MANAGER,
    ];
    
    foreach ($roles as $roleName) {
        Role::firstOrCreate(['name' => $roleName], [
            'guard_name' => 'web',
            'hierarchy_level' => 5,
            'is_system_role' => true,
        ]);
    }

    $this->department = Department::factory()->create([
        'name' => 'Test Department',
        'code' => 'TEST-DEPT',
    ]);

    $this->category = TicketCategory::factory()->create([
        'name' => 'Test Category',
        'slug' => 'test-category',
        'default_team_id' => $this->department->id,
        'requires_approval' => true,
    ]);

    $this->requester = User::factory()->create([
        'department_id' => $this->department->id,
    ]);

    $this->approvalService = app(ApprovalWorkflowService::class);
});

test('can create approval with deputy line manager level', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::DEPUTY_LINE_MANAGER,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe(ApprovalLevelConstants::DEPUTY_LINE_MANAGER);
    expect($approval->getLevelLabelAttribute())->toBe('Deputy Line Manager');
});

test('can create approval with deputy head of department level', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe(ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT);
    expect($approval->getLevelLabelAttribute())->toBe('Deputy Head of Department');
});

test('can create approval with deputy ceo level', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::DEPUTY_CEO,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe(ApprovalLevelConstants::DEPUTY_CEO);
    expect($approval->getLevelLabelAttribute())->toBe('Deputy CEO');
});

test('can create approval with custom finance manager level', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::FINANCE_MANAGER,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe(ApprovalLevelConstants::FINANCE_MANAGER);
    expect($approval->getLevelLabelAttribute())->toBe('Finance Manager');
});

test('can create approval with custom procurement manager level', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => ApprovalLevelConstants::PROCUREMENT_MANAGER,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe(ApprovalLevelConstants::PROCUREMENT_MANAGER);
    expect($approval->getLevelLabelAttribute())->toBe('Procurement Manager');
});

test('can find approver for deputy line manager level', function () {
    $dlm = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $dlm->assignRole(RoleConstants::DEPUTY_LINE_MANAGER);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approver = $this->approvalService->findApproverForLevel(
        $ticket,
        ApprovalLevelConstants::DEPUTY_LINE_MANAGER
    );

    expect($approver)->not->toBeNull();
    expect($approver->id)->toBe($dlm->id);
    expect($approver->hasRole(RoleConstants::DEPUTY_LINE_MANAGER))->toBeTrue();
});

test('can find approver for deputy head of department level', function () {
    $dhod = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $dhod->assignRole(RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approver = $this->approvalService->findApproverForLevel(
        $ticket,
        ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT
    );

    expect($approver)->not->toBeNull();
    expect($approver->id)->toBe($dhod->id);
    expect($approver->hasRole(RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT))->toBeTrue();
});

test('can find approver for finance manager level', function () {
    $financeManager = User::factory()->create([
        'department_id' => $this->department->id,
    ]);
    $financeManager->assignRole(RoleConstants::FINANCE_MANAGER);

    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $approver = $this->approvalService->findApproverForLevel(
        $ticket,
        ApprovalLevelConstants::FINANCE_MANAGER
    );

    expect($approver)->not->toBeNull();
    expect($approver->id)->toBe($financeManager->id);
    expect($approver->hasRole(RoleConstants::FINANCE_MANAGER))->toBeTrue();
});

test('getRolesForLevel returns correct roles for deputy levels', function () {
    $dlmRoles = ApprovalLevelConstants::getRolesForLevel(ApprovalLevelConstants::DEPUTY_LINE_MANAGER);
    expect($dlmRoles)->toContain(RoleConstants::DEPUTY_LINE_MANAGER);

    $dhodRoles = ApprovalLevelConstants::getRolesForLevel(ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT);
    expect($dhodRoles)->toContain(RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);

    $dceoRoles = ApprovalLevelConstants::getRolesForLevel(ApprovalLevelConstants::DEPUTY_CEO);
    expect($dceoRoles)->toContain(RoleConstants::DIRECTOR);
});

test('getHierarchyOrder returns correct order for all levels', function () {
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::LINE_MANAGER))->toBe(1);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::DEPUTY_LINE_MANAGER))->toBe(1);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::HEAD_OF_DEPARTMENT))->toBe(2);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT))->toBe(2);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::CEO))->toBe(3);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::DEPUTY_CEO))->toBe(3);
    expect(ApprovalLevelConstants::getHierarchyOrder(ApprovalLevelConstants::DIRECTOR))->toBe(3);
    expect(ApprovalLevelConstants::getHierarchyOrder('custom_level'))->toBe(99);
});

test('getLabel returns human readable labels for all levels', function () {
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::LINE_MANAGER))->toBe('Line Manager');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::DEPUTY_LINE_MANAGER))->toBe('Deputy Line Manager');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::HEAD_OF_DEPARTMENT))->toBe('Head of Department');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT))->toBe('Deputy Head of Department');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::CEO))->toBe('CEO');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::DEPUTY_CEO))->toBe('Deputy CEO');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::FINANCE_MANAGER))->toBe('Finance Manager');
    expect(ApprovalLevelConstants::getLabel(ApprovalLevelConstants::PROCUREMENT_MANAGER))->toBe('Procurement Manager');
});

test('can create approval with any custom level string', function () {
    $ticket = Ticket::factory()->create([
        'requester_id' => $this->requester->id,
        'category_id' => $this->category->id,
        'assigned_team_id' => $this->department->id,
        'status' => 'open',
    ]);

    $customLevel = 'custom_approval_level';
    $approval = TicketApproval::create([
        'ticket_id' => $ticket->id,
        'approval_level' => $customLevel,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    expect($approval->approval_level)->toBe($customLevel);
    // Custom levels get formatted label (first letter uppercase, underscores to spaces)
    expect($approval->getLevelLabelAttribute())->toBe('Custom approval level');
});

