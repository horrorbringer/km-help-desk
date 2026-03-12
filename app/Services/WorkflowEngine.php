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
use App\Traits\HandlesRuleLogic;

/**
 * Workflow Engine Service
 * 
 * Executes workflow templates for tickets.
 * Supports complex conditional logic and multi-step workflows.
 */
class WorkflowEngine
{
    use HandlesRuleLogic;

    protected ApprovalWorkflowService $approvalService;
    protected NotificationService $notificationService;
    protected TicketActionService $actionService;

    public function __construct(
        ApprovalWorkflowService $approvalService,
        NotificationService $notificationService,
        TicketActionService $actionService
    ) {
        $this->approvalService = $approvalService;
        $this->notificationService = $notificationService;
        $this->actionService = $actionService;
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
            // No workflow template found - route directly to category default team
            Log::info('No workflow template found, routing directly', [
                'ticket_id' => $ticket->id,
            ]);
            $this->routeDirectly($ticket);
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
     * Move to the next step in the workflow
     */
    public function moveNext(Ticket $ticket): void
    {
        $template = WorkflowTemplate::forTicket($ticket);
        if (!$template) {
            return;
        }

        // What steps are already completed?
        // For approvals, we check existing approval records
        $completedSteps = [];
        $approvals = $ticket->approvals()->get();
        
        foreach ($template->workflow_steps as $step) {
            $stepType = $step['type'] ?? null;
            
            if ($stepType === 'approval' || $stepType === 'conditional_approval') {
                $approvalLevel = $step['approval_level'] ?? null;
                $approval = $approvals->where('approval_level', $approvalLevel)->first();
                
                if ($approval && $approval->status === 'approved') {
                    $completedSteps[] = $step['step_id'];
                    continue;
                }
                
                // If there's a pending or rejected approval, we stop here
                break;
            }
            
            // For non-approval steps (notification, etc.), check history if we've done them?
            // Simple approach: non-approvals are executed as we pass them.
            // If they are before the first incomplete approval, they are "done".
        }

        $this->executeWorkflowSteps($ticket, $template, $completedSteps);
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
            if ($this->evaluateConditionGroup($ticket, $rule['condition'] ?? [])) {
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

            // --- PERMISSION BYPASS: Skip approval steps for users with 'tickets.auto-approve' permission ---
            if (in_array($stepType, ['approval', 'conditional_approval'])) {
                if (Auth::check() && Auth::user()->can('tickets.auto-approve')) {
                    Log::info('User bypassing approval step via permission', [
                        'ticket_id' => $ticket->id,
                        'user_id' => Auth::id(),
                        'step_id' => $stepId
                    ]);
                    continue; // Auto-skip this step
                }

                // --- SELF-APPROVAL BYPASS: Skip if requester IS the approver ---
                $approverType = $step['approver_type'] ?? null;
                if ($approverType) {
                    $potentialApprover = $this->findApprover($ticket, $approverType);
                    if ($potentialApprover && $potentialApprover->id === $ticket->requester_id) {
                        Log::info('Requester is the approver, skipping step', [
                            'ticket_id' => $ticket->id,
                            'approver_id' => $potentialApprover->id,
                            'step_id' => $stepId
                        ]);
                        continue; // Auto-skip self-approval
                    }
                }
            }

            $isBlocking = match ($stepType) {
                'approval' => $this->createApproval($ticket, $step),
                'conditional_approval' => $this->createConditionalApproval($ticket, $step),
                'notification' => $this->sendNotification($ticket, $step),
                'routing' => $this->routeTicket($ticket, $step),
                'conditional_routing' => $this->routeConditionally($ticket, $step),
                'assignment' => $this->assignTicket($ticket, $step),
                default => false,
            };

            // If a step is blocking (like a pending approval), stop processing further steps
            if ($isBlocking) {
                break;
            }
        }
    }

    /**
     * Create approval step
     */
    protected function createApproval(Ticket $ticket, array $step): bool
    {
        $approvalLevel = $step['approval_level'] ?? 'lm';
        $approverType = $step['approver_type'] ?? 'line_manager';
        $statusLabel = $step['status_label'] ?? null;
        
        // Check if approval already exists
        $existingApproval = \App\Models\TicketApproval::where('ticket_id', $ticket->id)
            ->where('approval_level', $approvalLevel)
            ->first();
        
        if ($existingApproval) {
            // It's blocking if it's still pending
            return $existingApproval->status === 'pending';
        }
        
        // Create approval directly
        $this->createApprovalDirectly($ticket, $approvalLevel, $approverType, $step);
        
        // When we create a new approval, we update ticket status to pending
        // If a status label is provided (e.g. "Awaiting CEO"), we could store it in a field or description
        $updateData = ['status' => 'pending'];
        
        $ticket->update($updateData);

        return true; // Yes, blocking
    }
    
    /**
     * Create approval directly without triggering workflow initialization
     * This prevents infinite loops when called from workflow templates
     */
    protected function createApprovalDirectly(Ticket $ticket, string $approvalLevel, string $approverType, array $step = []): void
    {
        // Get the highest sequence number to ensure proper ordering
        $maxSequence = $ticket->approvals()->max('sequence') ?? 0;
        
        $approval = \App\Models\TicketApproval::create([
            'ticket_id' => $ticket->id,
            'approval_level' => $approvalLevel,
            'status_label' => $step['status_label'] ?? null,
            'status' => 'pending',
            'sequence' => $maxSequence + 1,
        ]);
        
        // Find approver based on type
        $approver = $this->findApprover($ticket, $approverType);
        
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

        // --- NEW: Auto-Notify Requester ---
        $autoNotify = $step['auto_notify'] ?? true;
        if ($autoNotify) {
            try {
                $statusLabel = $step['status_label'] ?? null;
                $displayLabel = $statusLabel ?: \App\Constants\ApprovalLevelConstants::getLabel($approvalLevel);
                
                $this->notificationService->notifyRequester(
                    $ticket,
                    'workflow_stage',
                    'Workflow Update',
                    "Your ticket #{$ticket->ticket_number} is now: *{$displayLabel}*"
                );
            } catch (\Exception $e) {
                Log::warning('Failed to send requester workflow update', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Create conditional approval
     */
    protected function createConditionalApproval(Ticket $ticket, array $step): bool
    {
        $condition = $step['condition'] ?? [];
        
        if ($this->evaluateConditionGroup($ticket, $condition)) {
            return $this->createApproval($ticket, $step);
        } else {
            // Execute if_false action
            $ifFalse = $step['if_false'] ?? 'skip_step';
            if ($ifFalse === 'route_directly') {
                $this->routeDirectly($ticket);
                return true; // We routed, so we can stop or continue? Usually terminal.
            }
        }
        return false; // Not blocking because condition failed
    }

    /**
     * Send notification (informational only, no approval required)
     */
    protected function sendNotification(Ticket $ticket, array $step): bool
    {
        $notifyType = $step['notify_type'] ?? 'head_of_department';
        
        // Handle Team Notifications (Group)
        if ($notifyType === 'assigned_team' || $notifyType === 'team') {
            $teamId = ($notifyType === 'assigned_team') 
                ? $ticket->assigned_team_id 
                : ($step['team_id'] ?? $ticket->category?->default_team_id);

            if ($teamId) {
                try {
                    $this->notificationService->notifyTeam($teamId, $ticket);
                    Log::info('Workflow notification sent to team', ['ticket_id' => $ticket->id, 'team_id' => $teamId]);
                } catch (\Exception $e) {
                    Log::error('Failed to send workflow team notification', ['ticket_id' => $ticket->id, 'error' => $e->getMessage()]);
                }
            }
            return false;
        }

        // Handle Individual Notifications
        $notifyUser = $this->findApprover($ticket, $notifyType);
        
        if ($notifyUser) {
            try {
                $this->notificationService->create(
                    $notifyUser->id,
                    'ticket_created',
                    "New Ticket: {$ticket->ticket_number}",
                    "Ticket #{$ticket->ticket_number} has been created: {$ticket->subject}",
                    $ticket->id
                );
            } catch (\Exception $e) {
                Log::error('Failed to send notification', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        return false; // Not blocking
    }

    /**
     * Route ticket
     * @return bool Always true (blocks further steps as it's a terminal action)
     */
    protected function routeTicket(Ticket $ticket, array $step): bool
    {
        $routeTo = $step['route_to'] ?? null;
        $actions = [];

        // If routing to category default, ONLY do it if ticket isn't already assigned
        if ($routeTo === 'category_default_team') {
            if ($ticket->assigned_team_id) {
                Log::info('Skipping workflow category routing: ticket already has an assigned team', [
                    'ticket_id' => $ticket->id,
                    'assigned_team_id' => $ticket->assigned_team_id
                ]);
                
                // Still mark as terminal/blocking so we don't hit further routing steps
                $ticket->update(['status' => 'assigned']);
                return true;
            }

            if ($ticket->category?->default_team_id) {
                $actions[] = ['type' => 'assign_to_team', 'value' => $ticket->category->default_team_id];
                $actions[] = ['type' => 'set_status', 'value' => 'assigned'];
                $actions[] = ['type' => 'notify_manager', 'value' => null];
            }
        } elseif (isset($step['team_id'])) {
            // If explicit team ID is provided in the step, we assume it's a forced override
            $actions[] = ['type' => 'assign_to_team', 'value' => $step['team_id']];
            $actions[] = ['type' => 'set_status', 'value' => 'assigned'];
            $actions[] = ['type' => 'notify_manager', 'value' => null];
        }

        if (!empty($actions)) {
            $this->actionService->executeActions($ticket, $actions, 'workflow_engine', 0);
        }
        return true;
    }

    /**
     * Assign ticket to a user
     * @return bool Always false (non-blocking)
     */
    protected function assignTicket(Ticket $ticket, array $step): bool
    {
        $assignTo = $step['assign_to'] ?? 'line_manager';
        $actions = [];

        if ($assignTo === 'line_manager' || $assignTo === 'approver') {
            // Assign to the approver who just approved (LM/DLM)
            $lastApproval = $ticket->approvals()
                ->where('status', 'approved')
                ->orderBy('approved_at', 'desc')
                ->first();
            
            if ($lastApproval && $lastApproval->approver_id) {
                $actions[] = ['type' => 'assign_to_agent', 'value' => $lastApproval->approver_id];
            }
        } elseif (isset($step['user_id'])) {
            $actions[] = ['type' => 'assign_to_agent', 'value' => $step['user_id']];
        }

        if (!empty($actions)) {
            $this->actionService->executeActions($ticket, $actions, 'workflow_engine', 0);
        }
        return false;
    }

    /**
     * Route conditionally
     * @return bool True if condition met and routed
     */
    protected function routeConditionally(Ticket $ticket, array $step): bool
    {
        $condition = $step['condition'] ?? [];
        
        if ($this->evaluateConditionGroup($ticket, $condition)) {
            return $this->routeTicket($ticket, $step);
        }
        return false;
    }

    /**
     * Route directly without approval
     */
    protected function routeDirectly(Ticket $ticket): void
    {
        // Only route directly if the ticket does NOT already have an assigned team
        // This respects manual assignments made during ticket creation
        if (!$ticket->assigned_team_id && $ticket->category?->default_team_id) {
            $ticket->update([
                'assigned_team_id' => $ticket->category->default_team_id,
                'status' => 'assigned',
            ]);
            
            Log::info('Ticket auto-routed to category default team', [
                'ticket_id' => $ticket->id,
                'team_id' => $ticket->category->default_team_id
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
     * Evaluate a condition group (supports 'and'/'or' nested structures)
     */
    protected function evaluateConditionGroup(Ticket $ticket, array $condition): bool
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
     */
    protected function evaluateSingleCondition(Ticket $ticket, array $condition): bool
    {
        if (count($condition) < 3) {
            return false;
        }

        [$field, $operator, $value] = $condition;

        // Support nested field access (e.g., 'category.name', 'requester.department_id')
        $ticketValue = $this->getTicketValue($ticket, $field);

        // Delegate to the HandlesRuleLogic trait's evaluateCondition
        return $this->evaluateCondition($ticketValue, $operator, $value);
    }

    /**
     * Find approver based on type
     */
    protected function findApprover(Ticket $ticket, string $approverType): ?\App\Models\User
    {
        return match ($approverType) {
            'line_manager', 'lm' => $this->approvalService->findLineManager($ticket),
            'head_of_department', 'hod' => $this->approvalService->findHOD($ticket),
            'ceo', 'director' => $this->approvalService->findCEO($ticket),
            'requester' => $ticket->requester,
            'assigned_agent', 'agent' => $ticket->assignedAgent,
            default => null,
        };
    }
}