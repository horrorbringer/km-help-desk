<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\User;
use App\Models\Department;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class ApprovalWorkflowService
{
    /**
     * Initialize approval workflow for a ticket
     * Based on workflow: User -> LM -> Category Team -> Result/HOD
     * 
     * Real-world improvements:
     * - Only require approval when category/priority requires it
     * - Route based on category's default team, not always ITD
     * - Allow bypass for routine/low-priority tickets
     */
    public function initializeWorkflow(Ticket $ticket): void
    {
        // Check if ticket requires approval workflow
        // Only create approval if:
        // 1. Category requires approval (can be configured)
        // 2. Priority is high/critical
        // 3. Requester doesn't have auto-approval permission
        // For now, we'll check priority and category
        
        $requiresApproval = $this->requiresApproval($ticket);
        
        if (!$requiresApproval) {
            // No approval needed - route directly to category's default team
            $this->routeDirectly($ticket);
            return;
        }

        // Create Line Manager approval
        $lmApproval = TicketApproval::create([
            'ticket_id' => $ticket->id,
            'approval_level' => 'lm',
            'status' => 'pending',
            'sequence' => 1,
        ]);

        // Find Line Manager (can be based on requester's department manager or assigned approver)
        $lmApprover = $this->findLineManager($ticket);
        if ($lmApprover) {
            $lmApproval->update(['approver_id' => $lmApprover->id]);
        }

        // Record in ticket history
        $ticket->histories()->create([
            'user_id' => Auth::id(),
            'action' => 'approval_requested',
            'field_name' => 'approval',
            'old_value' => null,
            'new_value' => 'Line Manager Approval',
            'description' => 'Ticket submitted for Line Manager approval',
            'created_at' => now(),
        ]);

        // Send notification to Line Manager
        try {
            $notificationService = app(NotificationService::class);
            if ($lmApprover) {
                $notificationService->notifyApprovalRequested($ticket, $lmApprover, 'lm');
                Log::info('Approval workflow initialized', [
                    'ticket_id' => $ticket->id,
                    'approval_level' => 'lm',
                    'approver_id' => $lmApprover->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send approval notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Process approval
     */
    public function approve(TicketApproval $approval, ?string $comments = null, ?int $routedToTeamId = null): void
    {
        $approval->update([
            'status' => 'approved',
            'comments' => $comments,
            'approved_at' => now(),
            'routed_to_team_id' => $routedToTeamId,
        ]);

        $ticket = $approval->ticket;
        $approver = $approval->approver ?? Auth::user();

        // Record in ticket history
        $ticket->histories()->create([
            'user_id' => Auth::id(),
            'action' => 'approved',
            'field_name' => 'approval',
            'old_value' => 'pending',
            'new_value' => 'approved',
            'description' => ucfirst($approval->approval_level) . ' approved the ticket' . ($comments ? ': ' . $comments : ''),
            'created_at' => now(),
        ]);

        // Send approval notification
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyApprovalApproved($ticket, $approver, $approval->approval_level, $comments);
        } catch (\Exception $e) {
            Log::warning('Failed to send approval approved notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Route ticket based on approval level
        if ($approval->approval_level === 'lm') {
            $this->routeAfterLMApproval($ticket, $routedToTeamId);
            // After LM approval, check if HOD approval is needed
            $this->checkNextApproval($ticket);
        } elseif ($approval->approval_level === 'hod') {
            $this->routeAfterHODApproval($ticket, $routedToTeamId);
            // After HOD approval, no further approvals needed (don't call checkNextApproval)
        }
    }

    /**
     * Process rejection
     * 
     * IMPORTANT: Rejected tickets are NOT deleted - they remain in the system for:
     * - Audit trail and compliance
     * - Resubmission capability
     * - Analytics and reporting
     * 
     * The ticket status is changed to 'cancelled' but the record is preserved.
     * Use soft delete (deleted_at) only if absolutely necessary for data retention policies.
     */
    public function reject(TicketApproval $approval, ?string $comments = null): void
    {
        $approval->update([
            'status' => 'rejected',
            'comments' => $comments,
            'rejected_at' => now(),
        ]);

        $ticket = $approval->ticket;
        $approver = $approval->approver ?? Auth::user();

        // Update ticket status to cancelled (NOT deleted - preserved for audit)
        $ticket->update(['status' => 'cancelled']);

        // Record in ticket history
        $ticket->histories()->create([
            'user_id' => Auth::id(),
            'action' => 'rejected',
            'field_name' => 'approval',
            'old_value' => 'pending',
            'new_value' => 'rejected',
            'description' => ucfirst($approval->approval_level) . ' rejected the ticket' . ($comments ? ': ' . $comments : ''),
            'created_at' => now(),
        ]);

        // Send notification to requester
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyApprovalRejected($ticket, $approver, $approval->approval_level, $comments);
            Log::info('Ticket rejected', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approval->approval_level,
                'note' => 'Ticket preserved for audit - not deleted',
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to send rejection notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Resubmit a rejected ticket for approval
     */
    public function resubmit(Ticket $ticket): void
    {
        // Check if ticket has been rejected
        if (!$ticket->hasRejectedApproval()) {
            throw new \Exception('Ticket has not been rejected and cannot be resubmitted.');
        }

        // Check if ticket is in cancelled status
        if ($ticket->status !== 'cancelled') {
            throw new \Exception('Only cancelled tickets can be resubmitted.');
        }

        // Update ticket status to open
        $ticket->update(['status' => 'open']);

        // Record in ticket history
        $ticket->histories()->create([
            'user_id' => Auth::id(),
            'action' => 'resubmitted',
            'field_name' => 'status',
            'old_value' => 'cancelled',
            'new_value' => 'open',
            'description' => 'Ticket resubmitted for approval after rejection',
            'created_at' => now(),
        ]);

        // Re-initialize the approval workflow
        $this->initializeWorkflow($ticket);

        Log::info('Ticket resubmitted', [
            'ticket_id' => $ticket->id,
            'resubmitted_by' => Auth::id(),
        ]);
    }

    /**
     * Route ticket after LM approval
     * Real-world improvement: Route based on category's default team, not always ITD
     */
    protected function routeAfterLMApproval(Ticket $ticket, ?int $routedToTeamId = null): void
    {
        // Real-world routing: Use category's default team
        // This ensures Finance tickets go to Finance, HR tickets go to HR, etc.
        $targetTeamId = $routedToTeamId;
        
        if (!$targetTeamId && $ticket->category && $ticket->category->default_team_id) {
            // Route to category's default team (e.g., IT category → IT Dept, Finance → Finance Dept)
            $targetTeamId = $ticket->category->default_team_id;
        }
        
        // Fallback: Try to find IT Department if no category team
        if (!$targetTeamId) {
            $itDepartment = Department::where('code', 'IT-SD')
                ->orWhere('name', 'like', '%IT%')
                ->orWhere('name', 'like', '%Information Technology%')
                ->first();
            $targetTeamId = $itDepartment ? $itDepartment->id : null;
        }

        if ($targetTeamId) {
            $ticket->update([
                'assigned_team_id' => $targetTeamId,
                'status' => 'assigned',
            ]);

            $ticket->histories()->create([
                'user_id' => Auth::id(),
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $targetTeamId,
                'description' => 'Ticket routed to IT Department after LM approval',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Route ticket after HOD approval
     */
    protected function routeAfterHODApproval(Ticket $ticket, ?int $routedToTeamId = null): void
    {
        // HOD can route to different destinations
        if ($routedToTeamId) {
            $ticket->update([
                'assigned_team_id' => $routedToTeamId,
                'status' => 'assigned',
            ]);

            $team = Department::find($routedToTeamId);
            $ticket->histories()->create([
                'user_id' => Auth::id(),
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $routedToTeamId,
                'description' => 'Ticket routed to ' . ($team ? $team->name : 'team') . ' after HOD approval',
                'created_at' => now(),
            ]);
        } else {
            // Default: Mark as resolved/completed
            $ticket->update(['status' => 'resolved']);
        }
    }

    /**
     * Check if next approval is needed
     * Only creates HOD approval if:
     * 1. HOD approval is required
     * 2. No pending HOD approval already exists
     * 3. Previous approval was LM (not HOD) - prevents duplicate HOD approvals
     */
    protected function checkNextApproval(Ticket $ticket): void
    {
        // Check if HOD approval is needed
        $needsHODApproval = $this->requiresHODApproval($ticket);

        if ($needsHODApproval) {
            // Check if there's already a pending HOD approval
            $existingPendingHOD = $ticket->approvals()
                ->where('approval_level', 'hod')
                ->where('status', 'pending')
                ->exists();

            // Check if there's already an approved HOD approval (don't create another)
            $existingApprovedHOD = $ticket->approvals()
                ->where('approval_level', 'hod')
                ->where('status', 'approved')
                ->exists();

            // Only create HOD approval if:
            // 1. No pending HOD approval exists
            // 2. No approved HOD approval exists (to prevent duplicates)
            if (!$existingPendingHOD && !$existingApprovedHOD) {
                // Get the highest sequence number to ensure proper ordering
                $maxSequence = $ticket->approvals()->max('sequence') ?? 0;
                
                $hodApproval = TicketApproval::create([
                    'ticket_id' => $ticket->id,
                    'approval_level' => 'hod',
                    'status' => 'pending',
                    'sequence' => $maxSequence + 1,
                ]);

                // Find HOD (Head of Department)
                $hodApprover = $this->findHOD($ticket);
                if ($hodApprover) {
                    $hodApproval->update(['approver_id' => $hodApprover->id]);
                }

                $ticket->histories()->create([
                    'user_id' => Auth::id(),
                    'action' => 'approval_requested',
                    'field_name' => 'approval',
                    'old_value' => null,
                    'new_value' => 'HOD Approval',
                    'description' => 'Ticket submitted for Head of Department approval',
                    'created_at' => now(),
                ]);

                // Send notification to HOD
                try {
                    $notificationService = app(NotificationService::class);
                    if ($hodApprover) {
                        $notificationService->notifyApprovalRequested($ticket, $hodApprover, 'hod');
                    }
                } catch (\Exception $e) {
                    Log::warning('Failed to send HOD approval notification', [
                        'ticket_id' => $ticket->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * Determine if ticket requires approval workflow
     * Real-world: Only require approval when necessary
     */
    protected function requiresApproval(Ticket $ticket): bool
    {
        // Don't require approval for:
        // 1. Categories marked as "no approval required"
        if ($ticket->category && !$ticket->category->requires_approval) {
            return false;
        }
        
        // 2. Tickets from users with auto-approval permission
        if ($ticket->requester) {
            // Check if user has auto-approve permission
            // Using Gate::forUser to check permission for the requester
            try {
                if (Gate::forUser($ticket->requester)->allows('tickets.auto-approve')) {
                    return false;
                }
            } catch (\Exception $e) {
                // If permission doesn't exist or check fails, continue with approval requirement
                Log::debug('Auto-approve permission check failed', [
                    'user_id' => $ticket->requester->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        // 3. Low priority routine tickets (if category allows)
        // This can be made more sophisticated with category settings
        
        // Default: Require approval if category doesn't specify otherwise
        return $ticket->category ? $ticket->category->requires_approval : true;
    }

    /**
     * Route ticket directly without approval
     */
    protected function routeDirectly(Ticket $ticket): void
    {
        // Route directly to category's default team
        if ($ticket->category && $ticket->category->default_team_id) {
            $ticket->update([
                'assigned_team_id' => $ticket->category->default_team_id,
                'status' => 'assigned',
            ]);

            $ticket->histories()->create([
                'user_id' => Auth::id(),
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $ticket->category->default_team_id,
                'description' => 'Ticket routed directly to ' . ($ticket->category->defaultTeam->name ?? 'team') . ' (no approval required)',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Determine if ticket requires HOD approval
     * Real-world: Consider multiple factors, not just priority
     */
    protected function requiresHODApproval(Ticket $ticket): bool
    {
        // Real-world logic: Require HOD approval when:
        // 1. Category explicitly requires HOD approval
        if ($ticket->category && $ticket->category->requires_hod_approval) {
            return true;
        }
        
        // 2. Priority is high/critical (unless category overrides)
        $priorityBased = in_array($ticket->priority, ['high', 'critical']);
        
        // 3. Cost exceeds threshold (if cost field exists and category has threshold)
        // Future: $costExceedsThreshold = $ticket->estimated_cost && 
        //         $ticket->category->hod_approval_threshold &&
        //         $ticket->estimated_cost > $ticket->category->hod_approval_threshold;
        
        // Return true if priority-based OR category requires it
        return $priorityBased || ($ticket->category && $ticket->category->requires_hod_approval);
    }

    /**
     * Find Line Manager for ticket
     */
    protected function findLineManager(Ticket $ticket): ?User
    {
        // Option 1: Requester's department manager
        if ($ticket->requester && $ticket->requester->department_id) {
            // Find manager in the same department (can be based on role)
            $manager = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Manager', 'Line Manager', 'Super Admin']);
                })
                ->where('is_active', true)
                ->first();

            if ($manager) {
                return $manager;
            }
        }

        // Option 2: Assigned team manager
        if ($ticket->assignedTeam) {
            $manager = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Manager', 'Line Manager', 'Super Admin']);
                })
                ->where('is_active', true)
                ->first();

            if ($manager) {
                return $manager;
            }
        }

        // Fallback: First active manager
        return User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Manager', 'Line Manager', 'Super Admin']);
        })
        ->where('is_active', true)
        ->first();
    }

    /**
     * Find Head of Department for ticket
     */
    protected function findHOD(Ticket $ticket): ?User
    {
        // Find HOD (can be based on department or organization level)
        $hod = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['HOD', 'Head of Department', 'Director', 'Super Admin']);
        })
        ->where('is_active', true)
        ->first();

        return $hod;
    }
}

