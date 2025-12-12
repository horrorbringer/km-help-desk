<?php

namespace App\Services;

use App\Constants\RoleConstants;

use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\User;
use App\Models\Department;
use App\Services\NotificationService;
use App\Helpers\LogHelper;
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
        // Check if there are already pending approvals - don't create duplicates
        $existingPendingApproval = $ticket->approvals()
            ->where('status', 'pending')
            ->exists();
        
        if ($existingPendingApproval) {
            // Only log warnings in development/staging (duplicate initialization is rare)
            LogHelper::warning('Attempted to initialize workflow but pending approval already exists', [
                'ticket_id' => $ticket->id,
            ]);
            return;
        }
        
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
                // Single log after operation completes (reduces redundant logging)
                LogHelper::workflow('Approval workflow initialized', [
                    'ticket_id' => $ticket->id,
                    'approval_level' => 'lm',
                    'approver_id' => $lmApprover->id,
                ]);
            } else {
                LogHelper::warning('No Line Manager approver found for ticket', [
                    'ticket_id' => $ticket->id,
                    'requester_id' => $ticket->requester_id,
                    'requester_department_id' => $ticket->requester?->department_id,
                ]);
            }
        } catch (\Exception $e) {
            // Only include trace in development to reduce log size
            LogHelper::error('Failed to send approval notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], includeTrace: true);
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
            // Single log after operation completes
            LogHelper::workflow('Approval approved', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approval->approval_level,
                'approver_id' => $approver->id,
            ]);
        } catch (\Exception $e) {
            LogHelper::error('Failed to send approval approved notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], includeTrace: true);
        }

        // Route ticket based on approval level
        if ($approval->approval_level === 'lm') {
            // After LM approval, check if HOD approval is needed
            $needsHODApproval = $this->requiresHODApproval($ticket);
            
            if ($needsHODApproval) {
                // HOD approval is still needed - don't route yet, just check and create HOD approval
                $this->checkNextApproval($ticket);
                // Keep ticket in pending state until HOD approves
                // Don't route yet - wait for final approval
            } else {
                // No HOD approval needed - route immediately after LM approval
                $this->routeAfterLMApproval($ticket, $routedToTeamId);
            }
        } elseif ($approval->approval_level === 'hod') {
            // After HOD approval, this is the final approval - route now
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
            // Single log after operation completes
            LogHelper::workflow('Approval rejected', [
                'ticket_id' => $ticket->id,
                'approval_level' => $approval->approval_level,
                'approver_id' => $approver->id,
            ]);
        } catch (\Exception $e) {
            LogHelper::error('Failed to send rejection notification', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], includeTrace: true);
        }
    }

    /**
     * Resubmit a rejected ticket for approval
     * 
     * Real-world improvements:
     * - Limit resubmissions to prevent infinite loops (max 3 times)
     * - Clear any pending approvals before resubmitting
     * - Require ticket changes before allowing resubmission
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

        // Count rejected approvals to determine resubmission count
        $rejectedCount = $ticket->approvals()
            ->where('status', 'rejected')
            ->count();
        
        // Limit resubmissions to prevent infinite loops (max 3 resubmissions = 4 total attempts)
        $maxResubmissions = 3;
        if ($rejectedCount >= $maxResubmissions) {
            throw new \Exception("Ticket has been rejected {$rejectedCount} times. Maximum resubmission limit ({$maxResubmissions}) reached. Please create a new ticket or contact an administrator.");
        }

        // Clear any pending approvals (shouldn't exist, but safety check)
        $pendingApprovals = $ticket->approvals()
            ->where('status', 'pending')
            ->get();
        
        foreach ($pendingApprovals as $approval) {
            $approval->update([
                'status' => 'rejected',
                'comments' => ($approval->comments ?? '') . ' [Cancelled due to resubmission]',
                'rejected_at' => now(),
            ]);
            Log::info('Cancelled pending approval due to resubmission', [
                'ticket_id' => $ticket->id,
                'approval_id' => $approval->id,
                'approval_level' => $approval->approval_level,
            ]);
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
            'description' => "Ticket resubmitted for approval after rejection (Attempt {$rejectedCount} of {$maxResubmissions})",
            'created_at' => now(),
        ]);

        // Re-initialize the approval workflow
        $this->initializeWorkflow($ticket);

        Log::info('Ticket resubmitted', [
            'ticket_id' => $ticket->id,
            'resubmitted_by' => Auth::id(),
            'rejection_count' => $rejectedCount,
            'max_resubmissions' => $maxResubmissions,
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

            $team = Department::find($targetTeamId);
            $ticket->histories()->create([
                'user_id' => Auth::id(),
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $targetTeamId,
                'description' => 'Ticket routed to ' . ($team ? $team->name : 'team') . ' after LM approval',
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Route ticket after HOD approval
     */
    protected function routeAfterHODApproval(Ticket $ticket, ?int $routedToTeamId = null): void
    {
        // HOD can route to different destinations, or use category's default team
        $teamId = $routedToTeamId ?? $ticket->category?->default_team_id;
        
        if ($teamId) {
            $ticket->update([
                'assigned_team_id' => $teamId,
                'status' => 'assigned',
            ]);

            $team = Department::find($teamId);
            $ticket->histories()->create([
                'user_id' => Auth::id(),
                'action' => 'routed',
                'field_name' => 'assigned_team_id',
                'old_value' => null,
                'new_value' => $teamId,
                'description' => 'Ticket routed to ' . ($team ? $team->name : 'team') . ' after HOD approval',
                'created_at' => now(),
            ]);
        } else {
            // Fallback: If no team specified and category has no default team, mark as resolved
            // This should rarely happen if categories are properly configured
            Log::warning('HOD approval completed but no team to route to', [
                'ticket_id' => $ticket->id,
                'category_id' => $ticket->category_id,
            ]);
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
                        Log::info('Sending HOD approval requested notification', [
                            'ticket_id' => $ticket->id,
                            'approval_level' => 'hod',
                            'approver_id' => $hodApprover->id,
                            'approver_email' => $hodApprover->email,
                        ]);
                        $notificationService->notifyApprovalRequested($ticket, $hodApprover, 'hod');
                        Log::info('HOD approval requested notification sent successfully', [
                            'ticket_id' => $ticket->id,
                        ]);
                    } else {
                        Log::warning('No HOD approver found for ticket', [
                            'ticket_id' => $ticket->id,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send HOD approval notification', [
                        'ticket_id' => $ticket->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }
        }
    }

    /**
     * Determine if ticket requires approval workflow
     * Real-world: Only require approval when necessary
     * 
     * IMPORTANT: Even if a category doesn't require approval, we should still
     * require approval if the cost exceeds a threshold. This prevents users
     * from bypassing approval by selecting a non-approval category but entering
     * a high cost.
     */
    protected function requiresApproval(Ticket $ticket): bool
    {
        // 1. Check if cost exceeds threshold (takes precedence over category setting)
        // This ensures high-cost tickets always require approval, even if category doesn't
        if ($ticket->category && $ticket->category->hod_approval_threshold) {
            $ticketCost = $ticket->estimated_cost ?? 0;
            if ($ticketCost >= $ticket->category->hod_approval_threshold) {
                // Only log in development/staging (cost threshold logic is expected behavior)
                LogHelper::debug('Approval required due to cost threshold', [
                    'ticket_id' => $ticket->id,
                    'cost' => $ticketCost,
                    'threshold' => $ticket->category->hod_approval_threshold,
                ]);
                return true; // Cost exceeds threshold - require approval
            }
        }
        
        // 2. Check if category requires approval
        if ($ticket->category && $ticket->category->requires_approval) {
            return true;
        }
        
        // 3. Tickets from users with auto-approval permission (skip approval)
        if ($ticket->requester) {
            // Check if user has auto-approve permission
            // Using Gate::forUser to check permission for the requester
            try {
                if (Gate::forUser($ticket->requester)->allows('tickets.auto-approve')) {
                    // Only log in development (auto-approval is expected behavior)
                    LogHelper::debug('Auto-approval granted for user', [
                        'ticket_id' => $ticket->id,
                        'user_id' => $ticket->requester->id,
                    ]);
                    return false;
                }
            } catch (\Exception $e) {
                // If permission doesn't exist or check fails, continue with approval requirement
                // Only log in development (permission check failures are expected)
                LogHelper::debug('Auto-approve permission check failed', [
                    'user_id' => $ticket->requester->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        // 4. If category doesn't require approval and cost is below threshold, no approval needed
        if ($ticket->category && !$ticket->category->requires_approval) {
            // Only log in development (no approval needed is expected behavior)
            LogHelper::debug('No approval required - category does not require approval', [
                'ticket_id' => $ticket->id,
                'category' => $ticket->category->name,
            ]);
            return false;
        }
        
        // 5. Default: Require approval if category doesn't specify otherwise
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
        // 1. Priority is high/critical
        $priorityBased = in_array($ticket->priority, ['high', 'critical']);
        
        // 2. Cost exceeds threshold (if cost field exists and category has threshold)
        // This takes precedence over category flag for cost-based decisions
        $costExceedsThreshold = false;
        if ($ticket->category && $ticket->category->hod_approval_threshold) {
            $ticketCost = $ticket->estimated_cost ?? 0;
            if ($ticketCost >= $ticket->category->hod_approval_threshold) {
                $costExceedsThreshold = true;
                Log::info('HOD approval required due to cost threshold', [
                    'ticket_id' => $ticket->id,
                    'cost' => $ticketCost,
                    'threshold' => $ticket->category->hod_approval_threshold,
                    'category' => $ticket->category->name,
                ]);
            } else {
                Log::info('HOD approval NOT required - cost below threshold', [
                    'ticket_id' => $ticket->id,
                    'cost' => $ticketCost,
                    'threshold' => $ticket->category->hod_approval_threshold,
                    'category' => $ticket->category->name,
                ]);
            }
        }
        
        // 3. Category explicitly requires HOD approval (only if no cost threshold or cost not set)
        // If category has a threshold, we use cost-based logic instead
        $categoryRequiresHOD = false;
        if ($ticket->category && $ticket->category->requires_hod_approval) {
            // If category has a threshold, only require HOD if cost exceeds it
            // Otherwise, use the category flag
            if ($ticket->category->hod_approval_threshold) {
                // Category has threshold - use cost-based logic (already checked above)
                $categoryRequiresHOD = false; // Cost-based logic handles this
            } else {
                // Category requires HOD but no threshold - always require HOD
                $categoryRequiresHOD = true;
                Log::info('HOD approval required due to category flag (no threshold)', [
                    'ticket_id' => $ticket->id,
                    'category' => $ticket->category->name,
                ]);
            }
        }
        
        // Return true if priority-based OR cost exceeds threshold OR category requires it (without threshold)
        $requiresHOD = $priorityBased || $costExceedsThreshold || $categoryRequiresHOD;
        
        if ($requiresHOD) {
            Log::info('HOD approval required', [
                'ticket_id' => $ticket->id,
                'priority_based' => $priorityBased,
                'category_requires' => $ticket->category && $ticket->category->requires_hod_approval,
                'cost_exceeds' => $costExceedsThreshold,
            ]);
        }
        
        return $requiresHOD;
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
                    $query->whereIn('name', RoleConstants::getApprovalRoles());
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
                    $query->whereIn('name', RoleConstants::getApprovalRoles());
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
        // Priority 1: Find HOD in the ticket's assigned team/department
        if ($ticket->assigned_team_id) {
            $hod = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Head of Department', 'HOD']);
                })
                ->where('is_active', true)
                ->first();
            
            if ($hod) {
                Log::info('HOD found in assigned team', [
                    'ticket_id' => $ticket->id,
                    'hod_id' => $hod->id,
                    'hod_name' => $hod->name,
                    'department_id' => $ticket->assigned_team_id,
                ]);
                return $hod;
            }
        }
        
        // Priority 1.5: Find HOD in category's default team (if ticket not yet assigned)
        if ($ticket->category && $ticket->category->default_team_id) {
            $hod = User::where('department_id', $ticket->category->default_team_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Head of Department', 'HOD']);
                })
                ->where('is_active', true)
                ->first();
            
            if ($hod) {
                Log::info('HOD found in category default team', [
                    'ticket_id' => $ticket->id,
                    'hod_id' => $hod->id,
                    'hod_name' => $hod->name,
                    'category_id' => $ticket->category_id,
                    'default_team_id' => $ticket->category->default_team_id,
                ]);
                return $hod;
            }
        }
        
        // Priority 2: Find HOD in requester's department
        if ($ticket->requester && $ticket->requester->department_id) {
            $hod = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Head of Department', 'HOD']);
                })
                ->where('is_active', true)
                ->first();
            
            if ($hod) {
                Log::info('HOD found in requester department', [
                    'ticket_id' => $ticket->id,
                    'hod_id' => $hod->id,
                    'hod_name' => $hod->name,
                    'requester_department_id' => $ticket->requester->department_id,
                ]);
                return $hod;
            }
        }
        
        // Priority 3: Find any Head of Department (prioritize HOD role over Super Admin)
        $hod = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Head of Department', 'HOD']);
        })
        ->where('is_active', true)
        ->first();
        
        if ($hod) {
            Log::info('HOD found (any department)', [
                'ticket_id' => $ticket->id,
                'hod_id' => $hod->id,
                'hod_name' => $hod->name,
                'hod_department_id' => $hod->department_id,
            ]);
            return $hod;
        }
        
        // Priority 4: Fallback to Director
        $director = User::whereHas('roles', function ($query) {
            $query->where('name', 'Director');
        })
        ->where('is_active', true)
        ->first();
        
        if ($director) {
            Log::warning('HOD not found, using Director as fallback', [
                'ticket_id' => $ticket->id,
                'director_id' => $director->id,
                'director_name' => $director->name,
            ]);
            return $director;
        }
        
        // Priority 5: Last resort - Super Admin (only if no HOD/Director found)
        $superAdmin = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::SUPER_ADMIN);
        })
        ->where('is_active', true)
        ->first();
        
        if ($superAdmin) {
            Log::warning('HOD and Director not found, using Super Admin as last resort', [
                'ticket_id' => $ticket->id,
                'super_admin_id' => $superAdmin->id,
                'super_admin_name' => $superAdmin->name,
                'note' => 'This should not happen if HOD users are properly configured',
            ]);
        }
        
        return $superAdmin;
    }
}

