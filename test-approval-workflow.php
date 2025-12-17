<?php

/**
 * Quick Approval Workflow Test Script
 * 
 * Run with: php test-approval-workflow.php
 * 
 * This script creates test tickets and demonstrates the approval workflow
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use App\Services\ApprovalWorkflowService;

echo "=== Approval Workflow Test Script ===\n\n";

$approvalService = app(ApprovalWorkflowService::class);

// Get test users
$requester = User::where('email', 'chanthou121@outlook.com')->first();
$lineManager = User::role('Line Manager')->first();
$hod = User::role('Head of Department')->first();

if (!$requester || !$lineManager || !$hod) {
    echo "❌ Error: Required test users not found. Please run seeders first.\n";
    exit(1);
}

echo "✓ Test users found\n";
echo "  - Requester: {$requester->name} ({$requester->email})\n";
echo "  - Line Manager: {$lineManager->name} ({$lineManager->email})\n";
echo "  - HOD: {$hod->name} ({$hod->email})\n\n";

// Test 1: No Approval Required
echo "--- Test 1: No Approval Required ---\n";
$category1 = TicketCategory::where('slug', 'network-connectivity')->first();
$ticket1 = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => '[TEST] Wi-Fi Connection Issue',
    'description' => 'Testing direct routing without approval',
    'requester_id' => $requester->id,
    'category_id' => $category1->id,
    'priority' => 'medium',
    'status' => 'open',
]);

$approvalService->initializeWorkflow($ticket1);
$ticket1->refresh();

echo "Ticket #{$ticket1->ticket_number} created\n";
echo "  Approvals: " . $ticket1->approvals()->count() . "\n";
echo "  Status: {$ticket1->status}\n";
echo ($ticket1->approvals()->count() === 0 ? "✓ PASS" : "✗ FAIL") . "\n\n";

// Test 2: LM Approval Only
echo "--- Test 2: LM Approval Only (Low Cost) ---\n";
$category2 = TicketCategory::where('slug', 'hardware-requests')->first();
$ticket2 = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => '[TEST] Request for Keyboard',
    'description' => 'Testing LM approval workflow',
    'requester_id' => $requester->id,
    'category_id' => $category2->id,
    'priority' => 'medium',
    'estimated_cost' => 50.00,
    'status' => 'open',
]);

$approvalService->initializeWorkflow($ticket2);
$ticket2->refresh();

echo "Ticket #{$ticket2->ticket_number} created\n";
echo "  Approvals: " . $ticket2->approvals()->count() . "\n";
echo "  Status: {$ticket2->status}\n";

$lmApproval = $ticket2->approvals()->where('approval_level', 'lm')->first();
if ($lmApproval) {
    echo "  LM Approval: {$lmApproval->status}\n";
    echo "  Approver: " . ($lmApproval->approver ? $lmApproval->approver->name : 'Not assigned') . "\n";
}

// Approve LM
if ($lmApproval) {
    $approvalService->approve($lmApproval, 'Test approval - within budget');
    $ticket2->refresh();
    echo "\n  After LM Approval:\n";
    echo "    Status: {$ticket2->status}\n";
    echo "    Total Approvals: " . $ticket2->approvals()->count() . "\n";
    echo "    HOD Approval Created: " . ($ticket2->approvals()->where('approval_level', 'hod')->exists() ? 'Yes' : 'No') . "\n";
    echo ($ticket2->approvals()->where('approval_level', 'hod')->count() === 0 ? "✓ PASS" : "✗ FAIL") . "\n\n";
} else {
    echo "✗ FAIL: LM approval not created\n\n";
}

// Test 3: LM + HOD Approval (High Cost)
echo "--- Test 3: LM + HOD Approval (High Cost) ---\n";
$ticket3 = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => '[TEST] Request for 10 Laptops',
    'description' => 'Testing both LM and HOD approval',
    'requester_id' => $requester->id,
    'category_id' => $category2->id,
    'priority' => 'high',
    'estimated_cost' => 15000.00, // Above $1,000 threshold
    'status' => 'open',
]);

$approvalService->initializeWorkflow($ticket3);
$ticket3->refresh();

echo "Ticket #{$ticket3->ticket_number} created\n";
echo "  Cost: $" . number_format($ticket3->estimated_cost, 2) . "\n";
echo "  Approvals: " . $ticket3->approvals()->count() . "\n";

$lmApproval3 = $ticket3->approvals()->where('approval_level', 'lm')->first();
if ($lmApproval3) {
    echo "  LM Approval: {$lmApproval3->status}\n";
    
    // Approve LM
    $approvalService->approve($lmApproval3, 'LM approved - needed for project');
    $ticket3->refresh();
    
    echo "\n  After LM Approval:\n";
    echo "    Total Approvals: " . $ticket3->approvals()->count() . "\n";
    
    $hodApproval = $ticket3->approvals()->where('approval_level', 'hod')->first();
    if ($hodApproval) {
        echo "    HOD Approval: {$hodApproval->status}\n";
        echo "    HOD Approver: " . ($hodApproval->approver ? $hodApproval->approver->name : 'Not assigned') . "\n";
        
        // Approve HOD
        $approvalService->approve($hodApproval, 'HOD approved - budget allocated');
        $ticket3->refresh();
        
        echo "\n  After HOD Approval:\n";
        echo "    Status: {$ticket3->status}\n";
        echo "    Assigned Team: " . ($ticket3->assignedTeam ? $ticket3->assignedTeam->name : 'None') . "\n";
        echo ($ticket3->status === 'assigned' ? "✓ PASS" : "✗ FAIL") . "\n\n";
    } else {
        echo "✗ FAIL: HOD approval not created after LM approval\n\n";
    }
} else {
    echo "✗ FAIL: LM approval not created\n\n";
}

// Test 4: Approval Rejection
echo "--- Test 4: Approval Rejection ---\n";
$ticket4 = Ticket::create([
    'ticket_number' => Ticket::generateTicketNumber(),
    'subject' => '[TEST] Request for Gaming Laptop',
    'description' => 'Testing rejection workflow',
    'requester_id' => $requester->id,
    'category_id' => $category2->id,
    'priority' => 'medium',
    'estimated_cost' => 2500.00,
    'status' => 'open',
]);

$approvalService->initializeWorkflow($ticket4);
$approval4 = $ticket4->approvals()->first();

if ($approval4) {
    $approvalService->reject($approval4, 'Rejected - not business justified');
    $ticket4->refresh();
    $approval4->refresh();
    
    echo "Ticket #{$ticket4->ticket_number} rejected\n";
    echo "  Approval Status: {$approval4->status}\n";
    echo "  Rejection Comment: {$approval4->comments}\n";
    echo "  Rejected At: {$approval4->rejected_at}\n";
    echo ($approval4->status === 'rejected' ? "✓ PASS" : "✗ FAIL") . "\n\n";
} else {
    echo "✗ FAIL: Approval not created\n\n";
}

// Summary
echo "=== Test Summary ===\n";
echo "All tests completed. Check results above.\n";
echo "\nTo view tickets in database:\n";
echo "  php artisan tinker\n";
echo "  Ticket::where('subject', 'like', '%[TEST]%')->get();\n";

