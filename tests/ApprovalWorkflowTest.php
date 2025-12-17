<?php

namespace Tests;

use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\TicketCategory;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\Log;

/**
 * Approval Workflow Test Scenarios
 * 
 * Run with: php artisan test --filter ApprovalWorkflowTest
 * Or use individual methods for manual testing
 */
class ApprovalWorkflowTest extends TestCase
{
    protected ApprovalWorkflowService $approvalService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->approvalService = app(ApprovalWorkflowService::class);
    }

    /**
     * Scenario 1: No Approval Required
     */
    public function test_no_approval_required()
    {
        $category = TicketCategory::where('slug', 'network-connectivity')->first();
        $requester = User::role('Requester')->first();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: No Approval Required',
            'description' => 'Testing direct routing',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket);

        $ticket->refresh();
        
        // Assertions
        $this->assertEquals(0, $ticket->approvals()->count(), 'No approvals should be created');
        $this->assertEquals('assigned', $ticket->status, 'Ticket should be assigned directly');
        $this->assertNotNull($ticket->assigned_team_id, 'Ticket should have assigned team');
    }

    /**
     * Scenario 2: LM Approval Only (Low Cost)
     */
    public function test_lm_approval_only()
    {
        $category = TicketCategory::where('slug', 'hardware-requests')->first();
        $requester = User::role('Requester')->first();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: LM Approval Only',
            'description' => 'Testing LM approval workflow',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'priority' => 'medium',
            'estimated_cost' => 500.00, // Below HOD threshold
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket);

        $ticket->refresh();
        
        // Assertions
        $this->assertEquals(1, $ticket->approvals()->count(), 'Should have 1 approval (LM)');
        $this->assertEquals('lm', $ticket->approvals()->first()->approval_level);
        $this->assertEquals('pending', $ticket->approvals()->first()->status);
        $this->assertEquals('pending', $ticket->status, 'Ticket should be pending approval');
    }

    /**
     * Scenario 3: LM + HOD Approval (High Cost)
     */
    public function test_lm_and_hod_approval()
    {
        $category = TicketCategory::where('slug', 'hardware-requests')->first();
        $requester = User::role('Requester')->first();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: LM + HOD Approval',
            'description' => 'Testing both approval levels',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'priority' => 'high',
            'estimated_cost' => 15000.00, // Above HOD threshold
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket);

        $ticket->refresh();
        
        // Initially only LM approval
        $this->assertEquals(1, $ticket->approvals()->count(), 'Should have 1 approval initially (LM)');
        
        // Approve LM
        $lmApproval = $ticket->approvals()->where('approval_level', 'lm')->first();
        $this->approvalService->approve($lmApproval, 'LM approved for testing');
        
        $ticket->refresh();
        
        // Now should have HOD approval
        $this->assertEquals(2, $ticket->approvals()->count(), 'Should have 2 approvals after LM approval');
        $hodApproval = $ticket->approvals()->where('approval_level', 'hod')->first();
        $this->assertNotNull($hodApproval, 'HOD approval should be created');
        $this->assertEquals('pending', $hodApproval->status, 'HOD approval should be pending');
    }

    /**
     * Scenario 4: Cost Threshold Edge Cases
     */
    public function test_cost_threshold_edge_cases()
    {
        $category = TicketCategory::where('slug', 'hardware-requests')->first();
        $requester = User::role('Requester')->first();

        // Test: Cost exactly at threshold
        $ticket1 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: Cost at Threshold',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'estimated_cost' => 1000.00, // Exactly at threshold
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket1);
        $lmApproval = $ticket1->approvals()->first();
        $this->approvalService->approve($lmApproval);
        $ticket1->refresh();

        $this->assertEquals(2, $ticket1->approvals()->count(), 'HOD approval should be created at threshold');

        // Test: Cost just below threshold
        $ticket2 = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: Cost Below Threshold',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'estimated_cost' => 999.99, // Just below threshold
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket2);
        $lmApproval2 = $ticket2->approvals()->first();
        $this->approvalService->approve($lmApproval2);
        $ticket2->refresh();

        $this->assertEquals(1, $ticket2->approvals()->count(), 'HOD approval should NOT be created below threshold');
    }

    /**
     * Scenario 5: Approval Rejection
     */
    public function test_approval_rejection()
    {
        $category = TicketCategory::where('slug', 'hardware-requests')->first();
        $requester = User::role('Requester')->first();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: Approval Rejection',
            'requester_id' => $requester->id,
            'category_id' => $category->id,
            'estimated_cost' => 500.00,
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket);
        $approval = $ticket->approvals()->first();
        $this->approvalService->reject($approval, 'Rejected for testing');

        $ticket->refresh();
        $approval->refresh();

        $this->assertEquals('rejected', $approval->status);
        $this->assertNotNull($approval->rejected_at);
        $this->assertNotNull($approval->comments);
    }

    /**
     * Scenario 6: Auto-Approve Permission
     */
    public function test_auto_approve_permission()
    {
        $category = TicketCategory::where('slug', 'hardware-requests')->first();
        $superAdmin = User::role('Super Admin')->first();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test: Auto-Approve',
            'requester_id' => $superAdmin->id,
            'category_id' => $category->id,
            'estimated_cost' => 5000.00,
            'status' => 'open',
        ]);

        $this->approvalService->initializeWorkflow($ticket);
        $ticket->refresh();

        // Super Admin should bypass approval
        $this->assertEquals(0, $ticket->approvals()->count(), 'No approvals for auto-approve users');
        $this->assertEquals('assigned', $ticket->status, 'Ticket should be assigned directly');
    }

    /**
     * Helper: Create test ticket with approval
     */
    public static function createTestTicket(array $data = []): Ticket
    {
        $defaults = [
            'ticket_number' => Ticket::generateTicketNumber(),
            'subject' => 'Test Ticket',
            'description' => 'Test description',
            'requester_id' => User::role('Requester')->first()->id,
            'category_id' => TicketCategory::where('slug', 'hardware-requests')->first()->id,
            'priority' => 'medium',
            'status' => 'open',
        ];

        $ticket = Ticket::create(array_merge($defaults, $data));
        app(ApprovalWorkflowService::class)->initializeWorkflow($ticket);
        
        return $ticket->fresh();
    }

    /**
     * Helper: Approve ticket at LM level
     */
    public static function approveLM(Ticket $ticket, ?string $comment = null): void
    {
        $approval = $ticket->approvals()->where('approval_level', 'lm')->first();
        if ($approval) {
            app(ApprovalWorkflowService::class)->approve($approval, $comment);
        }
    }

    /**
     * Helper: Approve ticket at HOD level
     */
    public static function approveHOD(Ticket $ticket, ?string $comment = null): void
    {
        $approval = $ticket->approvals()->where('approval_level', 'hod')->first();
        if ($approval) {
            app(ApprovalWorkflowService::class)->approve($approval, $comment);
        }
    }

    /**
     * Helper: Reject ticket approval
     */
    public static function rejectApproval(Ticket $ticket, ?string $comment = null): void
    {
        $approval = $ticket->currentApproval();
        if ($approval) {
            app(ApprovalWorkflowService::class)->reject($approval, $comment);
        }
    }
}

