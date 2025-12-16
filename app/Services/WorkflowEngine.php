<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\WorkflowTemplate;
use App\Models\TicketApproval;
use App\Models\Department;
use App\Services\ApprovalWorkflowService;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Workflow Engine Service
 * 
 * Executes workflow templates for tickets.
 * Supports complex conditional logic and multi-step workflows.
 */
class WorkflowEngine
{
    protected ApprovalWorkflowService $approvalService;
    protected NotificationService $notificationService;

    public function __construct(
        ApprovalWorkflowService $approvalService,
        NotificationService $notificationService
    ) {
        $this->approvalService = $approvalService;
        $this->notificationService = $notificationService;
    }

    /**
     * Execute workflow for a ticket
     */
    public function execute(Ticket $ticket): void
    {
        // Prevent duplicate workflow initialization
        $existingPendingApproval = $ticket->approvals()
            ->where('status', 'pending')
            ->exists();
        
        if ($existingPendingApproval) {
            Log::info('Workflow already initialized for ticket, skipping', [
                'ticket_id' => $ticket->id,
            ]);
            return;
        }
        
        $template = WorkflowTemplate::forTicket($ticket);
        
        if (!$template) {
            // Fallback to default workflow - call initializeDefaultWorkflow directly to avoid circular call
            Log::info('No workflow template found, using default workflow', [
                'ticket_id' => $ticket->id,
            ]);
            // Use reflection or make the method public, or call it directly
            // Since initializeDefaultWorkflow is protected, we'll use a flag to skip template check
            $this->approvalService->initializeWorkflow($ticket, true);
            return;
        }

        Log::info('Executing workflow template', [
            'ticket_id' => $ticket->id,
            'template_id' => $template->id,
            'template_name' => $template->name,
        ]);

        // Evaluate approval rules first (can skip steps)
        $skippedSteps = $this->evaluateApprovalRules($ticket, $template);

        // Execute workflow steps
        $this->executeWorkflowSteps($ticket, $template, $skippedSteps);
    }

    /**
     * Evaluate approval rules (can skip steps)
     * 
     * @return array Array of step IDs to skip
     */
    protected function evaluateApprovalRules(Ticket $ticket, WorkflowTemplate $template): array
    {
        $skippedSteps = [];

        if (empty($template->approval_rules)) {
            return $skippedSteps;
        }

        foreach ($template->approval_rules as $rule) {
            if ($this->evaluateCondition($ticket, $rule['condition'] ?? [])) {
                $action = $rule['action'] ?? null;
                
                if ($action === 'auto_approve_and_route') {
                    $this->autoApproveAndRoute($ticket, $template);
                    return []; // Skip all steps
                }
                
                if ($action === 'skip_approval' && isset($rule['skip_steps'])) {
                    $skippedSteps = array_merge($skippedSteps, $rule['skip_steps']);
                }
                
                break; // First matching rule wins
            }
        }

        return $skippedSteps;
    }

    /**
     * Execute workflow steps
     */
    protected function executeWorkflowSteps(Ticket $ticket, WorkflowTemplate $template, array $skippedSteps): void
    {
        if (empty($template->workflow_steps)) {
            return;
        }

        foreach ($template->workflow_steps as $step) {
            $stepId = $step['step_id'] ?? null;
            
            // Skip if step is in skipped list
            if ($stepId && in_array($stepId, $skippedSteps)) {
                continue;
            }

            $stepType = $step['type'] ?? null;

            match ($stepType) {
                'approval' => $this->createApproval($ticket, $step),
                'conditional_approval' => $this->createConditionalApproval($ticket, $step),
                'notification' => $this->sendNotification($ticket, $step),
                'routing' => $this->routeTicket($ticket, $step),
                'conditional_routing' => $this->routeConditionally($ticket, $step),
                'assignment' => $this->assignTicket($ticket, $step),
                default => null,
            };
        }
    }

    /**
     * Create approval step
     */
    protected function createApproval(Ticket $ticket, array $step): void
    {
        $approvalLevel = $step['approval_level'] ?? 'lm';
        $approverType = $step['approver_type'] ?? 'line_manager';
        
        // Check if approval already exists to prevent duplicates
        $existingApproval = \App\Models\TicketApproval::where('ticket_id', $ticket->id)
            ->where('approval_level', $approvalLevel)
            ->where('status', 'pending')
            ->exists();
        
        if ($existingApproval) {
            Log::info('Approval already exists, skipping creation', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approvalLevel,
            ]);
            return;
        }
        
        // Create approval directly without triggering workflow initialization
        $this->createApprovalDirectly($ticket, $approvalLevel, $approverType);
    }
    
    /**
     * Create approval directly without triggering workflow initialization
     * This prevents infinite loops when called from workflow templates
     */
    protected function createApprovalDirectly(Ticket $ticket, string $approvalLevel, string $approverType): void
    {
        // Get the highest sequence number to ensure proper ordering
        $maxSequence = $ticket->approvals()->max('sequence') ?? 0;
        
        $approval = \App\Models\TicketApproval::create([
            'ticket_id' => $ticket->id,
            'approval_level' => $approvalLevel,
            'status' => 'pending',
            'sequence' => $maxSequence + 1,
        ]);
        
        // Find approver based on type
        $approver = null;
        if ($approvalLevel === 'lm' || $approverType === 'line_manager') {
            $approver = $this->approvalService->findLineManager($ticket);
        } elseif ($approvalLevel === 'hod' || $approverType === 'head_of_department') {
            $approver = $this->approvalService->findHOD($ticket);
        }
        
        if ($approver) {
            $approval->update(['approver_id' => $approver->id]);
        }
        
        // Record in ticket history
        $ticket->histories()->create([
            'user_id' => \Illuminate\Support\Facades\Auth::id() ?? $ticket->requester_id,
            'action' => 'approval_requested',
            'field_name' => 'approval',
            'old_value' => null,
            'new_value' => ucfirst($approvalLevel) . ' Approval',
            'description' => 'Ticket submitted for ' . ucfirst($approvalLevel) . ' approval',
            'created_at' => now(),
        ]);
        
        // Send notification
        if ($approver) {
            try {
                $this->notificationService->notifyApprovalRequested($ticket, $approver, $approvalLevel);
            } catch (\Exception $e) {
                Log::error('Failed to send approval notification', [
                    'ticket_id' => $ticket->id,
                    'approval_level' => $approvalLevel,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Create conditional approval
     */
    protected function createConditionalApproval(Ticket $ticket, array $step): void
    {
        $condition = $step['condition'] ?? [];
        
        if ($this->evaluateCondition($ticket, $condition)) {
            $this->createApproval($ticket, $step);
        } else {
            // Execute if_false action
            $ifFalse = $step['if_false'] ?? 'skip_step';
            if ($ifFalse === 'route_directly') {
                $this->routeDirectly($ticket);
            }
        }
    }

    /**
     * Send notification (informational only, no approval required)
     */
    protected function sendNotification(Ticket $ticket, array $step): void
    {
        $notifyType = $step['notify_type'] ?? 'head_of_department';
        $notifyUser = $this->findApprover($ticket, $notifyType);
        
        if ($notifyUser) {
            try {
                // Send informational notification (not approval request)
                $this->notificationService->create(
                    $notifyUser->id,
                    'ticket_created',
                    "New Ticket: {$ticket->ticket_number}",
                    "Ticket #{$ticket->ticket_number} has been created: {$ticket->subject}",
                    $ticket->id
                );
                
                Log::info('Notification sent (informational)', [
                    'ticket_id' => $ticket->id,
                    'notify_type' => $notifyType,
                    'user_id' => $notifyUser->id,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send notification', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Route ticket
     */
    protected function routeTicket(Ticket $ticket, array $step): void
    {
        $routeTo = $step['route_to'] ?? null;
        
        if ($routeTo === 'category_default_team' && $ticket->category?->default_team_id) {
            $ticket->update([
                'assigned_team_id' => $ticket->category->default_team_id,
                'status' => 'assigned',
            ]);
            
            // Log routing
            $ticket->histories()->create([
                'user_id' => \Illuminate\Support\Facades\Auth::id() ?? $ticket->requester_id,
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $ticket->category->default_team_id,
                'description' => 'Ticket routed to ' . ($ticket->category->defaultTeam->name ?? 'team'),
                'created_at' => now(),
            ]);

            // Notify department managers when ticket is routed to their team
            try {
                $this->notificationService->notifyDepartmentManagers($ticket);
            } catch (\Exception $e) {
                Log::warning('Failed to notify department managers after workflow routing', [
                    'ticket_id' => $ticket->id,
                    'team_id' => $ticket->category->default_team_id,
                    'error' => $e->getMessage(),
                ]);
            }
        } elseif (isset($step['team_id'])) {
            $ticket->update([
                'assigned_team_id' => $step['team_id'],
                'status' => 'assigned',
            ]);
            
            // Log routing
            $team = \App\Models\Department::find($step['team_id']);
            $ticket->histories()->create([
                'user_id' => \Illuminate\Support\Facades\Auth::id() ?? $ticket->requester_id,
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $step['team_id'],
                'description' => 'Ticket routed to ' . ($team->name ?? 'team'),
                'created_at' => now(),
            ]);

            // Notify department managers when ticket is routed to their team
            try {
                $this->notificationService->notifyDepartmentManagers($ticket);
            } catch (\Exception $e) {
                Log::warning('Failed to notify department managers after workflow routing', [
                    'ticket_id' => $ticket->id,
                    'team_id' => $step['team_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Assign ticket to a user
     */
    protected function assignTicket(Ticket $ticket, array $step): void
    {
        $assignTo = $step['assign_to'] ?? 'line_manager';
        
        if ($assignTo === 'line_manager' || $assignTo === 'approver') {
            // Assign to the approver who just approved (LM/DLM)
            $lastApproval = $ticket->approvals()
                ->where('status', 'approved')
                ->orderBy('approved_at', 'desc')
                ->first();
            
            if ($lastApproval && $lastApproval->approver_id) {
                $ticket->update([
                    'assigned_agent_id' => $lastApproval->approver_id,
                ]);
                
                Log::info('Ticket assigned to approver', [
                    'ticket_id' => $ticket->id,
                    'assigned_agent_id' => $lastApproval->approver_id,
                ]);
            }
        } elseif (isset($step['user_id'])) {
            $ticket->update([
                'assigned_agent_id' => $step['user_id'],
            ]);
        }
    }

    /**
     * Route conditionally
     */
    protected function routeConditionally(Ticket $ticket, array $step): void
    {
        $condition = $step['condition'] ?? [];
        
        if ($this->evaluateCondition($ticket, $condition)) {
            $this->routeTicket($ticket, $step);
        }
    }

    /**
     * Route directly without approval
     */
    protected function routeDirectly(Ticket $ticket): void
    {
        if ($ticket->category?->default_team_id) {
            $ticket->update([
                'assigned_team_id' => $ticket->category->default_team_id,
                'status' => 'assigned',
            ]);
        }
    }

    /**
     * Auto approve and route
     */
    protected function autoApproveAndRoute(Ticket $ticket, WorkflowTemplate $template): void
    {
        // Route directly
        $this->routeDirectly($ticket);
        
        // Log auto-approval
        $ticket->histories()->create([
            'user_id' => Auth::id() ?? $ticket->requester_id,
            'action' => 'auto_approved',
            'field_name' => 'approval',
            'old_value' => null,
            'new_value' => 'auto_approved',
            'description' => 'Ticket auto-approved based on workflow rules',
            'created_at' => now(),
        ]);
    }

    /**
     * Evaluate condition (simple rule engine)
     */
    protected function evaluateCondition(Ticket $ticket, array $condition): bool
    {
        if (empty($condition)) {
            return false;
        }

        if (isset($condition['and'])) {
            return collect($condition['and'])->every(fn($c) => $this->evaluateSingleCondition($ticket, $c));
        }

        if (isset($condition['or'])) {
            return collect($condition['or'])->some(fn($c) => $this->evaluateSingleCondition($ticket, $c));
        }

        return $this->evaluateSingleCondition($ticket, $condition);
    }

    /**
     * Evaluate single condition
     * 
     * Supports:
     * - ['field', 'operator', 'value']
     * - ['field', 'in', [array]]
     * - Nested fields: 'category.name', 'requester.department_id'
     */
    protected function evaluateSingleCondition(Ticket $ticket, array $condition): bool
    {
        if (count($condition) < 3) {
            return false;
        }

        [$field, $operator, $value] = $condition;

        // Support nested field access (e.g., 'category.name', 'requester.department_id')
        $ticketValue = data_get($ticket, $field);

        return match ($operator) {
            '==' => $ticketValue == $value,
            '!=' => $ticketValue != $value,
            '>' => $ticketValue > $value,
            '>=' => $ticketValue >= $value,
            '<' => $ticketValue < $value,
            '<=' => $ticketValue <= $value,
            'in' => in_array($ticketValue, (array)$value),
            'not_in' => !in_array($ticketValue, (array)$value),
            'contains' => str_contains((string)$ticketValue, (string)$value),
            default => false,
        };
    }

    /**
     * Create approval for specific level
     */
    protected function createApprovalForLevel(Ticket $ticket, string $level, string $approverType): void
    {
        $approver = $this->findApprover($ticket, $approverType);
        
        if (!$approver) {
            Log::warning('Approver not found for workflow step', [
                'ticket_id' => $ticket->id,
                'level' => $level,
                'approver_type' => $approverType,
            ]);
            return;
        }

        $maxSequence = $ticket->approvals()->max('sequence') ?? 0;

        $approval = TicketApproval::create([
            'ticket_id' => $ticket->id,
            'approval_level' => $level,
            'status' => 'pending',
            'sequence' => $maxSequence + 1,
            'approver_id' => $approver->id,
        ]);

        // Send notification
        try {
            $this->notificationService->notifyApprovalRequested($ticket, $approver, $level);
        } catch (\Exception $e) {
            Log::error('Failed to send approval notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Find approver based on type
     */
    protected function findApprover(Ticket $ticket, string $approverType): ?\App\Models\User
    {
        return match ($approverType) {
            'line_manager' => $this->approvalService->findLineManager($ticket),
            'head_of_department', 'hod' => $this->approvalService->findHOD($ticket),
            default => null,
        };
    }
}
