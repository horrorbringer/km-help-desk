<?php

use App\Constants\RoleConstants;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Permission::findOrCreate('dashboard.view');
    Permission::findOrCreate('tickets.view');
    Permission::findOrCreate('tickets.assign');

    Role::findOrCreate(RoleConstants::REQUESTER)
        ->givePermissionTo(['dashboard.view', 'tickets.view']);
    Role::findOrCreate(RoleConstants::AGENT)
        ->givePermissionTo(['dashboard.view', 'tickets.view']);
});

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users without dashboard permission cannot visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertForbidden();
});

test('authenticated users with dashboard permission can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});

test('dashboard metrics only include tickets visible to the current user', function () {
    $requester = User::factory()->create();
    $requester->assignRole(RoleConstants::REQUESTER);

    $otherRequester = User::factory()->create();
    $department = Department::factory()->create([
        'name' => 'Support',
        'code' => 'SUP',
    ]);
    $category = TicketCategory::factory()->create([
        'name' => 'General',
        'slug' => 'general',
        'default_team_id' => $department->id,
    ]);

    $ownTicket = Ticket::factory()->create([
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_OPEN,
        'priority' => Ticket::PRIORITY_HIGH,
        'created_at' => now(),
    ]);

    Ticket::factory()->create([
        'requester_id' => $otherRequester->id,
        'category_id' => $category->id,
        'status' => Ticket::STATUS_RESOLVED,
        'priority' => Ticket::PRIORITY_LOW,
        'created_at' => now(),
    ]);

    $this->actingAs($requester)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.overview.total', 1)
            ->where('stats.overview.open', 1)
            ->where('stats.overview.resolved', 0)
            ->where('stats.status_breakdown.open', 1)
            ->missing('stats.status_breakdown.resolved')
            ->where('stats.priority_breakdown.high', 1)
            ->missing('stats.priority_breakdown.low')
            ->has('stats.recent_tickets', 1)
            ->where('stats.recent_tickets.0.id', $ownTicket->id)
        );
});

test('dashboard hides pending approval team tickets from agents', function () {
    $department = Department::factory()->create([
        'name' => 'Support',
        'code' => 'SUP',
    ]);

    $agent = User::factory()->create([
        'department_id' => $department->id,
    ]);
    $agent->assignRole(RoleConstants::AGENT);

    $requester = User::factory()->create();
    $category = TicketCategory::factory()->create([
        'name' => 'General',
        'slug' => 'general',
        'default_team_id' => $department->id,
    ]);

    $ticket = Ticket::factory()->create([
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'assigned_team_id' => $department->id,
        'status' => Ticket::STATUS_OPEN,
    ]);

    $ticket->approvals()->create([
        'approval_level' => 'line_manager',
        'approver_id' => $requester->id,
        'status' => 'pending',
        'sequence' => 1,
    ]);

    $this->actingAs($agent)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.overview.total', 0)
            ->has('stats.recent_tickets', 0)
        );
});
