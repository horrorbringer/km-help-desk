<?php

/**
 * Quick Approval Workflow Test Script
 * 
 * Run this script to quickly test approval workflow features:
 * php artisan tinker < test-approval-workflow.php
 * 
 * Or copy-paste into tinker:
 * php artisan tinker
 */

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketApproval;
use App\Models\Department;
use App\Models\User;
use App\Services\ApprovalWorkflowService;

echo "=== Approval Workflow Testing ===\n\n";

// Test 1: Check Categories
echo "1. Checking Category Settings...\n";
$categories = TicketCategory::select('name', 'requires_approval', 'requires_hod_approval', 'hod_approval_threshold')
    ->get();
foreach ($categories as $cat) {
    echo "   - {$cat->name}: requires_approval=" . ($cat->requires_approval ? 'YES' : 'NO');
    if ($cat->requires_hod_approval) {
        echo ", requires_hod=" . ($cat->requires_hod_approval ? 'YES' : 'NO');
        if ($cat->hod_approval_threshold) {
            echo ", threshold=\${$cat->hod_approval_threshold}";
        }
    }
    echo "\n";
}
echo "\n";

// Test 2: Check Departments
echo "2. Checking Departments...\n";
$departments = Department::select('id', 'name', 'code')->get();
foreach ($departments as $dept) {
    echo "   - {$dept->name} ({$dept->code}): ID={$dept->id}\n";
}
echo "\n";

// Test 3: Check Approvers
echo "3. Checking Available Approvers...\n";
$managers = User::whereHas('roles', function($q) {
    $q->whereIn('name', ['Manager', 'Line Manager', 'Super Admin']);
})->get(['id', 'name', 'email']);
echo "   Line Managers: " . $managers->count() . "\n";
foreach ($managers as $mgr) {
    echo "   - {$mgr->name} ({$mgr->email})\n";
}

$hods = User::whereHas('roles', function($q) {
    $q->whereIn('name', ['HOD', 'Head of Department', 'Director', 'Super Admin']);
})->get(['id', 'name', 'email']);
echo "   HODs: " . $hods->count() . "\n";
foreach ($hods as $hod) {
    echo "   - {$hod->name} ({$hod->email})\n";
}
echo "\n";

// Test 4: Create Test Ticket (No Approval Required)
echo "4. Testing Ticket Without Approval (Finance Queries)...\n";
$financeCategory = TicketCategory::where('slug', 'finance-queries')->first();
if ($financeCategory) {
    $ticket1 = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test Finance Query',
        'description' => 'Testing approval bypass',
        'requester_id' => User::first()->id,
        'category_id' => $financeCategory->id,
        'priority' => 'low',
        'status' => 'open',
    ]);
    
    $service = app(ApprovalWorkflowService::class);
    $service->initializeWorkflow($ticket1);
    
    $approvals = $ticket1->approvals()->count();
    echo "   Ticket ID: {$ticket1->id}\n";
    echo "   Approvals Created: {$approvals} (Expected: 0)\n";
    echo "   Status: {$ticket1->status}\n";
    echo "   Assigned Team: " . ($ticket1->assignedTeam ? $ticket1->assignedTeam->name : 'None') . "\n";
    echo "   ✅ " . ($approvals === 0 ? "PASS" : "FAIL") . "\n\n";
} else {
    echo "   ⚠️  Finance Queries category not found\n\n";
}

// Test 5: Create Test Ticket (With Approval Required)
echo "5. Testing Ticket With Approval (Hardware)...\n";
$hardwareCategory = TicketCategory::where('slug', 'hardware')->first();
if ($hardwareCategory) {
    $ticket2 = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test Hardware Request',
        'description' => 'Testing approval workflow',
        'requester_id' => User::first()->id,
        'category_id' => $hardwareCategory->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    $service = app(ApprovalWorkflowService::class);
    $service->initializeWorkflow($ticket2);
    
    $approvals = $ticket2->approvals()->count();
    $lmApproval = $ticket2->approvals()->where('approval_level', 'lm')->first();
    echo "   Ticket ID: {$ticket2->id}\n";
    echo "   Approvals Created: {$approvals} (Expected: 1)\n";
    if ($lmApproval) {
        echo "   LM Approval Status: {$lmApproval->status}\n";
        echo "   LM Approver: " . ($lmApproval->approver ? $lmApproval->approver->name : 'Not assigned') . "\n";
    }
    echo "   ✅ " . ($approvals === 1 && $lmApproval && $lmApproval->status === 'pending' ? "PASS" : "FAIL") . "\n\n";
} else {
    echo "   ⚠️  Hardware category not found\n\n";
}

// Test 6: Test Approval Process
echo "6. Testing Approval Process...\n";
$pendingApproval = TicketApproval::where('status', 'pending')->first();
if ($pendingApproval) {
    $ticket = $pendingApproval->ticket;
    echo "   Approving Ticket #{$ticket->id}...\n";
    
    $service = app(ApprovalWorkflowService::class);
    $service->approve($pendingApproval, 'Test approval comment');
    
    $pendingApproval->refresh();
    $ticket->refresh();
    
    echo "   Approval Status: {$pendingApproval->status} (Expected: approved)\n";
    echo "   Ticket Status: {$ticket->status} (Expected: assigned)\n";
    echo "   Assigned Team: " . ($ticket->assignedTeam ? $ticket->assignedTeam->name : 'None') . "\n";
    echo "   ✅ " . ($pendingApproval->status === 'approved' && $ticket->status === 'assigned' ? "PASS" : "FAIL") . "\n\n";
} else {
    echo "   ⚠️  No pending approvals found\n\n";
}

// Test 7: Summary
echo "=== Test Summary ===\n";
$totalTickets = Ticket::count();
$ticketsWithApprovals = Ticket::has('approvals')->count();
$pendingApprovals = TicketApproval::where('status', 'pending')->count();
$approvedApprovals = TicketApproval::where('status', 'approved')->count();
$rejectedApprovals = TicketApproval::where('status', 'rejected')->count();

echo "Total Tickets: {$totalTickets}\n";
echo "Tickets with Approvals: {$ticketsWithApprovals}\n";
echo "Pending Approvals: {$pendingApprovals}\n";
echo "Approved Approvals: {$approvedApprovals}\n";
echo "Rejected Approvals: {$rejectedApprovals}\n";
echo "\n";

echo "✅ Testing Complete!\n";
echo "Check the database and ticket history for detailed results.\n";

