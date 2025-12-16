<?php

/**
 * Integration Test: Full Workflow
 * 
 * Tests the complete IT ticket workflow:
 * 1. User creates ticket
 * 2. LM/DLM approves
 * 3. Routes to IT.D
 * 4. IT managers notified
 * 
 * Run: php test-integration-workflow.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketApproval;
use App\Models\User;
use App\Models\WorkflowTemplate;
use App\Models\HelpDeskNotification;
use App\Services\ApprovalWorkflowService;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "========================================\n";
echo "  INTEGRATION TEST: IT WORKFLOW\n";
echo "========================================\n\n";

// Get test data
$itDept = Department::where('code', 'IT-SD')->first();
$category = TicketCategory::where('slug', 'hardware-issues')->first();
$requester = User::role('Requester')->where('is_active', true)->first();

if (!$itDept || !$category || !$requester) {
    echo "❌ Missing test data. Please run seeders first.\n";
    exit(1);
}

echo "Test Data:\n";
echo "  - IT Department: {$itDept->name} (ID: {$itDept->id})\n";
echo "  - Category: {$category->name} (ID: {$category->id})\n";
echo "  - Requester: {$requester->name} (ID: {$requester->id})\n";
echo "  - Requester Department: " . ($requester->department ? $requester->department->name : 'None') . "\n\n";

// Step 1: Create Ticket
echo "Step 1: Creating ticket...\n";
$ticket = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => 'Integration Test: Computer Issue',
    'description' => 'Testing complete workflow from creation to IT routing',
    'requester_id' => $requester->id,
    'category_id' => $category->id,
    'priority' => 'medium',
    'status' => 'open',
]);

echo "  ✅ Ticket created: {$ticket->ticket_number}\n";
echo "  - Status: {$ticket->status}\n";
echo "  - Assigned Team: " . ($ticket->assigned_team_id ? Department::find($ticket->assigned_team_id)->name : 'None') . "\n\n";

// Step 2: Initialize Workflow
echo "Step 2: Initializing workflow...\n";
$approvalService = app(ApprovalWorkflowService::class);
$approvalService->initializeWorkflow($ticket);
$ticket->refresh();

$approvals = $ticket->approvals()->where('status', 'pending')->get();
echo "  ✅ Workflow initialized\n";
echo "  - Pending Approvals: " . $approvals->count() . "\n";

if ($approvals->count() > 0) {
    foreach ($approvals as $approval) {
        $approver = User::find($approval->approver_id);
        echo "    - {$approval->approval_level}: " . ($approver ? $approver->name : 'Unassigned') . "\n";
    }
} else {
    echo "    - No approvals required (direct routing)\n";
}
echo "\n";

// Step 3: Check if routed to IT
if ($ticket->assigned_team_id) {
    $assignedTeam = Department::find($ticket->assigned_team_id);
    echo "Step 3: Ticket routing...\n";
    echo "  ✅ Ticket routed to: {$assignedTeam->name}\n";
    
    if ($assignedTeam->code === 'IT-SD') {
        echo "  ✅ Correctly routed to IT Department\n";
    } else {
        echo "  ⚠️  Routed to {$assignedTeam->name} instead of IT-SD\n";
    }
    echo "\n";
}

// Step 4: Check notifications
echo "Step 4: Checking notifications...\n";
$notifications = HelpDeskNotification::where('ticket_id', $ticket->id)
    ->orderBy('created_at', 'desc')
    ->get();

echo "  - Total Notifications: " . $notifications->count() . "\n";

if ($notifications->count() > 0) {
    foreach ($notifications->take(5) as $notification) {
        $user = User::find($notification->user_id);
        echo "    - {$notification->type}: {$notification->title} (to: " . ($user ? $user->name : 'Unknown') . ")\n";
    }
} else {
    echo "    ⚠️  No notifications found\n";
}
echo "\n";

// Step 5: If approval exists, test approval
if ($approvals->count() > 0) {
    $approval = $approvals->first();
    echo "Step 5: Testing approval...\n";
    
    if ($approval->approver_id) {
        $approver = User::find($approval->approver_id);
        echo "  - Approver: {$approver->name}\n";
        echo "  - Approval Level: {$approval->approval_level}\n";
        
        // Approve
        $approval->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);
        
        echo "  ✅ Approval marked as approved\n";
        
        // Process approval
        $approvalService->approve($approval);
        $ticket->refresh();
        
        echo "  ✅ Approval processed\n";
        echo "  - New Status: {$ticket->status}\n";
        echo "  - Assigned Team: " . ($ticket->assigned_team_id ? Department::find($ticket->assigned_team_id)->name : 'None') . "\n";
        
        // Check IT notifications
        $itNotifications = HelpDeskNotification::where('ticket_id', $ticket->id)
            ->whereHas('user', function($q) use ($itDept) {
                $q->where('department_id', $itDept->id);
            })
            ->count();
        
        echo "  - IT Department Notifications: {$itNotifications}\n";
        
        if ($itNotifications > 0) {
            echo "  ✅ IT managers were notified\n";
        } else {
            echo "  ⚠️  IT managers were not notified\n";
        }
    } else {
        echo "  ⚠️  Approval has no approver assigned\n";
    }
    echo "\n";
}

// Cleanup
echo "Cleaning up test data...\n";
$ticket->approvals()->delete();
$ticket->histories()->delete();
HelpDeskNotification::where('ticket_id', $ticket->id)->delete();
$ticket->delete();
echo "  ✅ Cleanup complete\n\n";

echo "========================================\n";
echo "  INTEGRATION TEST COMPLETE\n";
echo "========================================\n\n";
