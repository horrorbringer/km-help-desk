<?php

/**
 * V1 Feature Test Script
 * 
 * Tests all critical features for IT-focused V1 launch
 * 
 * Run: php test-v1-features.php
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
use App\Services\ApprovalWorkflowService;
use App\Services\WorkflowEngine;
use App\Services\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

echo "\n";
echo "========================================\n";
echo "  V1 FEATURE TEST SUITE\n";
echo "  IT-Focused Ticket System\n";
echo "========================================\n\n";

$results = [
    'passed' => 0,
    'failed' => 0,
    'warnings' => 0,
];

function test($name, $callback) {
    global $results;
    echo "Testing: $name... ";
    try {
        $result = $callback();
        if ($result === true || $result === null) {
            echo "✅ PASSED\n";
            $results['passed']++;
        } else {
            echo "⚠️  WARNING: $result\n";
            $results['warnings']++;
        }
    } catch (\Exception $e) {
        echo "❌ FAILED: " . $e->getMessage() . "\n";
        $results['failed']++;
    }
}

// ============================================
// TEST 1: Database Setup
// ============================================
echo "\n--- DATABASE SETUP ---\n";

test("IT Department exists", function() {
    $dept = Department::where('code', 'IT-SD')->first();
    if (!$dept) {
        throw new Exception("IT-SD department not found");
    }
    if (!$dept->is_support_team) {
        throw new Exception("IT-SD is not marked as support team");
    }
    return true;
});

test("IT Categories exist", function() {
    $categories = TicketCategory::whereHas('parent', function($q) {
        $q->where('slug', 'it-support');
    })->orWhere('slug', 'it-support')->get();
    
    if ($categories->isEmpty()) {
        throw new Exception("No IT categories found");
    }
    
    $required = ['hardware-issues', 'hardware-requests', 'application-access', 'network-connectivity'];
    $found = $categories->pluck('slug')->toArray();
    $missing = array_diff($required, $found);
    
    if (!empty($missing)) {
        return "Missing categories: " . implode(', ', $missing);
    }
    
    return true;
});

test("IT Categories have default team", function() {
    $categories = TicketCategory::whereHas('parent', function($q) {
        $q->where('slug', 'it-support');
    })->orWhere('slug', 'it-support')->get();
    
    foreach ($categories as $category) {
        if (!$category->default_team_id) {
            return "Category '{$category->name}' has no default team";
        }
        
        $team = Department::find($category->default_team_id);
        if (!$team || $team->code !== 'IT-SD') {
            return "Category '{$category->name}' default team is not IT-SD";
        }
    }
    
    return true;
});

// ============================================
// TEST 2: Roles & Users
// ============================================
echo "\n--- ROLES & USERS ---\n";

test("IT Department has HOD", function() {
    $hod = User::whereHas('department', function($q) {
        $q->where('code', 'IT-SD');
    })->whereHas('roles', function($q) {
        $q->where('name', 'Head of Department');
    })->where('is_active', true)->first();
    
    if (!$hod) {
        throw new Exception("No active HOD found for IT-SD");
    }
    return true;
});

test("IT Department has LM/DLM", function() {
    $lm = User::whereHas('department', function($q) {
        $q->where('code', 'IT-SD');
    })->whereHas('roles', function($q) {
        $q->whereIn('name', ['Line Manager', 'Deputy Line Manager']);
    })->where('is_active', true)->first();
    
    if (!$lm) {
        return "No active LM/DLM found for IT-SD (may be OK if using requester's department LM)";
    }
    return true;
});

test("IT Department has Agents", function() {
    $agents = User::whereHas('department', function($q) {
        $q->where('code', 'IT-SD');
    })->whereHas('roles', function($q) {
        $q->whereIn('name', ['Agent', 'Senior Agent']);
    })->where('is_active', true)->count();
    
    if ($agents === 0) {
        return "No active agents found for IT-SD";
    }
    return true;
});

// ============================================
// TEST 3: Workflow Templates
// ============================================
echo "\n--- WORKFLOW TEMPLATES ---\n";

test("IT Hardware Issue Workflow exists", function() {
    $template = WorkflowTemplate::where('name', 'IT Hardware Issue Workflow')
        ->where('is_active', true)
        ->first();
    
    if (!$template) {
        throw new Exception("IT Hardware Issue Workflow not found or inactive");
    }
    
    if (empty($template->workflow_steps)) {
        throw new Exception("Workflow template has no steps");
    }
    
    return true;
});

test("Workflow template has correct steps", function() {
    $template = WorkflowTemplate::where('name', 'IT Hardware Issue Workflow')->first();
    
    if (!$template) {
        throw new Exception("Template not found");
    }
    
    $steps = $template->workflow_steps ?? [];
    $hasNotification = false;
    $hasApproval = false;
    $hasRouting = false;
    
    foreach ($steps as $step) {
        if (($step['type'] ?? '') === 'notification') {
            $hasNotification = true;
        }
        if (($step['type'] ?? '') === 'approval') {
            $hasApproval = true;
        }
        if (($step['type'] ?? '') === 'routing') {
            $hasRouting = true;
        }
    }
    
    if (!$hasNotification) {
        return "Workflow missing notification step";
    }
    if (!$hasApproval) {
        return "Workflow missing approval step";
    }
    if (!$hasRouting) {
        return "Workflow missing routing step";
    }
    
    return true;
});

// ============================================
// TEST 4: Ticket Creation
// ============================================
echo "\n--- TICKET CREATION ---\n";

test("Can create ticket with IT category", function() {
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester user");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: Computer Issue',
        'description' => 'Testing ticket creation',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    if (!$ticket) {
        throw new Exception("Failed to create ticket");
    }
    
    // Cleanup
    $ticket->delete();
    
    return true;
});

test("Ticket auto-assigns requester", function() {
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester user");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: Auto-assign',
        'description' => 'Testing',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    if ($ticket->requester_id !== $requester->id) {
        $ticket->delete();
        throw new Exception("Requester not assigned correctly");
    }
    
    $ticket->delete();
    return true;
});

// ============================================
// TEST 5: Approval Workflow
// ============================================
echo "\n--- APPROVAL WORKFLOW ---\n";

test("ApprovalWorkflowService can find LM", function() {
    $approvalService = app(ApprovalWorkflowService::class);
    
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: LM Approval',
        'description' => 'Testing',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    $lm = $approvalService->findLineManager($ticket);
    
    $ticket->delete();
    
    if (!$lm) {
        return "No LM found (may be OK if requester has no department)";
    }
    
    return true;
});

test("ApprovalWorkflowService can find HOD", function() {
    $approvalService = app(ApprovalWorkflowService::class);
    
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: HOD Approval',
        'description' => 'Testing',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'high',
        'status' => 'open',
    ]);
    
    $hod = $approvalService->findHOD($ticket);
    
    $ticket->delete();
    
    if (!$hod) {
        return "No HOD found (may be OK if requester has no department)";
    }
    
    return true;
});

// ============================================
// TEST 6: Workflow Engine
// ============================================
echo "\n--- WORKFLOW ENGINE ---\n";

test("WorkflowEngine can execute workflow", function() {
    $workflowEngine = app(WorkflowEngine::class);
    
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: Workflow Engine',
        'description' => 'Testing',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    try {
        $workflowEngine->execute($ticket);
        $ticket->refresh();
        
        // Check if workflow was executed (either approval created or ticket routed)
        $hasApproval = $ticket->approvals()->exists();
        $isRouted = $ticket->assigned_team_id !== null;
        
        if (!$hasApproval && !$isRouted) {
            return "Workflow executed but no approval or routing occurred";
        }
        
        // Cleanup
        $ticket->approvals()->delete();
        $ticket->delete();
        
        return true;
    } catch (\Exception $e) {
        $ticket->approvals()->delete();
        $ticket->delete();
        throw $e;
    }
});

// ============================================
// TEST 7: Notifications
// ============================================
echo "\n--- NOTIFICATIONS ---\n";

test("NotificationService can create notifications", function() {
    $notificationService = app(NotificationService::class);
    
    $user = User::where('is_active', true)->first();
    
    if (!$user) {
        throw new Exception("No active user found");
    }
    
    $category = TicketCategory::where('slug', 'hardware-issues')->first();
    $requester = User::role('Requester')->where('is_active', true)->first();
    
    if (!$category || !$requester) {
        throw new Exception("Missing category or requester");
    }
    
    $ticket = Ticket::create([
        'ticket_number' => Ticket::generateTicketNumber(),
        'subject' => 'Test: Notification',
        'description' => 'Testing',
        'requester_id' => $requester->id,
        'category_id' => $category->id,
        'priority' => 'medium',
        'status' => 'open',
    ]);
    
    try {
        $notificationService->create(
            $user->id,
            'ticket_created',
            'Test Notification',
            'Test notification message',
            $ticket->id
        );
        
        $notification = DB::table('help_desk_notifications')
            ->where('user_id', $user->id)
            ->latest()
            ->first();
        
        $ticket->delete();
        
        if (!$notification) {
            return "Notification not created in database";
        }
        
        return true;
    } catch (\Exception $e) {
        $ticket->delete();
        throw $e;
    }
});

// ============================================
// TEST 8: Permissions
// ============================================
echo "\n--- PERMISSIONS ---\n";

test("Roles have permissions", function() {
    $roles = ['Super Admin', 'Head of Department', 'Line Manager', 'Agent', 'Requester'];
    
    foreach ($roles as $roleName) {
        $role = \Spatie\Permission\Models\Role::where('name', $roleName)->first();
        
        if (!$role) {
            return "Role '$roleName' not found";
        }
        
        $permissions = $role->permissions()->count();
        
        if ($permissions === 0) {
            return "Role '$roleName' has no permissions";
        }
    }
    
    return true;
});

// ============================================
// SUMMARY
// ============================================
echo "\n";
echo "========================================\n";
echo "  TEST SUMMARY\n";
echo "========================================\n";
echo "✅ Passed: {$results['passed']}\n";
echo "⚠️  Warnings: {$results['warnings']}\n";
echo "❌ Failed: {$results['failed']}\n";
echo "\n";

$total = $results['passed'] + $results['warnings'] + $results['failed'];
$successRate = $total > 0 ? round(($results['passed'] / $total) * 100, 1) : 0;

echo "Success Rate: {$successRate}%\n\n";

if ($results['failed'] === 0) {
    echo "🎉 All critical tests passed! System is ready for V1 launch.\n";
} else {
    echo "⚠️  Some tests failed. Please review before launching.\n";
}

echo "\n";
