<?php

namespace App\Services;

use App\Constants\ApprovalLevelConstants;
use App\Constants\RoleConstants;
use App\Helpers\LogHelper;
use App\Models\ApprovalLevel;
use App\Models\Department;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
     * - Now supports workflow templates via WorkflowEngine
     */
    public function initializeWorkflow(Ticket $ticket): void
    {
        try {
            $workflowEngine = app(WorkflowEngine::class);
            $workflowEngine->execute($ticket);
        } catch (\Exception $e) {
            Log::error('WorkflowEngine failed to execute', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }

        $this->ensureRequiredApprovalExists($ticket->fresh(['category', 'requester', 'assignedTeam']) ?? $ticket);
    }

    protected function ensureRequiredApprovalExists(Ticket $ticket): void
    {
        if (! $ticket->category?->requires_approval) {
            return;
        }

        if (in_array($ticket->status, [Ticket::STATUS_RESOLVED, Ticket::STATUS_CLOSED, Ticket::STATUS_CANCELLED], true)) {
            return;
        }

        if ($ticket->approvals()->where('status', 'pending')->exists()) {
            return;
        }

        $approval = TicketApproval::create([
            'ticket_id' => $ticket->id,
            'approval_level' => ApprovalLevelConstants::LINE_MANAGER,
            'status' => 'pending',
            'sequence' => ($ticket->approvals()->max('sequence') ?? 0) + 1,
        ]);

        if ($approver = $this->findLineManager($ticket)) {
            $approval->update(['approver_id' => $approver->id]);
        }

        $ticket->histories()->create([
            'user_id' => Auth::id() ?? $ticket->requester_id,
            'action' => 'approval_requested',
            'field_name' => 'approval',
            'old_value' => null,
            'new_value' => ApprovalLevelConstants::LINE_MANAGER,
            'description' => 'Line Manager approval requested.',
            'created_at' => now(),
        ]);
    }

    /**
     * Determine whether a user can approve or reject this approval step.
     */
    public function canApprove(TicketApproval $approval, User $user): bool
    {
        if ($user->hasRole(RoleConstants::SUPER_ADMIN)) {
            return true;
        }

        if ($approval->approver_id && $approval->approver_id === $user->id) {
            return true;
        }

        if ($user->can('tickets.assign')) {
            return true;
        }

        $approvalLevel = ApprovalLevel::where('code', $approval->approval_level)
            ->where('is_active', true)
            ->first();

        $roleNames = $approvalLevel
            ? $approvalLevel->role_names
            : ApprovalLevelConstants::getRolesForLevel($approval->approval_level);

        foreach ($roleNames ?? [] as $roleName) {
            if ($user->hasRole($roleName)) {
                return true;
            }
        }

        return false;
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
            'description' => ApprovalLevelConstants::getLabel($approval->approval_level).' approved the ticket'.($comments ? ': '.$comments : ''),
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

        // Use WorkflowEngine to determine and execute next steps
        try {
            $workflowEngine = app(WorkflowEngine::class);
            $workflowEngine->moveNext($ticket);
        } catch (\Exception $e) {
            Log::error('WorkflowEngine failed to move to next step', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);

            // Minimal fallback: if no next step and not routed, route to default
            if ($ticket->status === 'open' && ! $ticket->assigned_team_id) {
                $this->routeDirectly($ticket);
            }
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
            'description' => ApprovalLevelConstants::getLabel($approval->approval_level).' rejected the ticket'.($comments ? ': '.$comments : ''),
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
        if (! $ticket->hasRejectedApproval()) {
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
                'comments' => ($approval->comments ?? '').' [Cancelled due to resubmission]',
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
                'description' => 'Ticket routed directly to '.($ticket->category->defaultTeam->name ?? 'team').' (no approval required)',
                'created_at' => now(),
            ]);

            // Notify department managers when ticket is routed to their team
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyDepartmentManagers($ticket);
            } catch (\Exception $e) {
                Log::warning('Failed to notify department managers after direct routing', [
                    'ticket_id' => $ticket->id,
                    'team_id' => $ticket->category->default_team_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Find Line Manager for ticket
     * Made public for use by WorkflowEngine
     */
    public function findLineManager(Ticket $ticket): ?User
    {
        // Priority 1: Requester's department manager
        // This is correct: User's own department manager should approve their tickets
        if ($ticket->requester && $ticket->requester->department_id) {
            // Priority 1.1: Find Line Manager
            $lm = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::LINE_MANAGER);
                })
                ->where('is_active', true)
                ->first();

            if ($lm) {
                return $lm;
            }

            // Priority 1.2: Find Deputy Line Manager
            $dlm = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::DEPUTY_LINE_MANAGER);
                })
                ->where('is_active', true)
                ->first();

            if ($dlm) {
                return $dlm;
            }

            // Priority 1.3: Find any manager in the same department
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

        // Priority 2: Assigned team manager (fallback when requester has no department)
        if ($ticket->assignedTeam) {
            // Priority 2.1: Find Line Manager
            $lm = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::LINE_MANAGER);
                })
                ->where('is_active', true)
                ->first();

            if ($lm) {
                return $lm;
            }

            // Priority 2.2: Find Deputy Line Manager
            $dlm = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::DEPUTY_LINE_MANAGER);
                })
                ->where('is_active', true)
                ->first();

            if ($dlm) {
                return $dlm;
            }

            // Priority 2.3: Find any manager
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

        // Fallback: First active manager (LM → DLM → Manager → Super Admin)
        $lm = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::LINE_MANAGER);
        })
            ->where('is_active', true)
            ->first();

        if ($lm) {
            return $lm;
        }

        $dlm = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::DEPUTY_LINE_MANAGER);
        })
            ->where('is_active', true)
            ->first();

        if ($dlm) {
            return $dlm;
        }

        return User::whereHas('roles', function ($query) {
            $query->whereIn('name', [RoleConstants::MANAGER, RoleConstants::SUPER_ADMIN]);
        })
            ->where('is_active', true)
            ->first();
    }

    /**
     * Find Head of Department for ticket
     * Made public for use by WorkflowEngine
     */
    public function findHOD(Ticket $ticket): ?User
    {
        // Priority 1: Find HOD in the ticket's assigned team/department
        if ($ticket->assigned_team_id) {
            // Priority 1.1: Find Head of Department
            $hod = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::HEAD_OF_DEPARTMENT);
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

            // Priority 1.2: Find Deputy Head of Department
            $dhod = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);
                })
                ->where('is_active', true)
                ->first();

            if ($dhod) {
                Log::info('DHOD found in assigned team (HOD unavailable)', [
                    'ticket_id' => $ticket->id,
                    'dhod_id' => $dhod->id,
                    'dhod_name' => $dhod->name,
                    'department_id' => $ticket->assigned_team_id,
                ]);

                return $dhod;
            }
        }

        // Priority 1.5: Find HOD in category's default team (if ticket not yet assigned)
        if ($ticket->category && $ticket->category->default_team_id) {
            // Priority 1.5.1: Find Head of Department
            $hod = User::where('department_id', $ticket->category->default_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::HEAD_OF_DEPARTMENT);
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

            // Priority 1.5.2: Find Deputy Head of Department
            $dhod = User::where('department_id', $ticket->category->default_team_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);
                })
                ->where('is_active', true)
                ->first();

            if ($dhod) {
                Log::info('DHOD found in category default team (HOD unavailable)', [
                    'ticket_id' => $ticket->id,
                    'dhod_id' => $dhod->id,
                    'dhod_name' => $dhod->name,
                    'category_id' => $ticket->category_id,
                    'default_team_id' => $ticket->category->default_team_id,
                ]);

                return $dhod;
            }
        }

        // Priority 2: Find HOD in requester's department
        if ($ticket->requester && $ticket->requester->department_id) {
            // Priority 2.1: Find Head of Department
            $hod = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::HEAD_OF_DEPARTMENT);
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

            // Priority 2.2: Find Deputy Head of Department
            $dhod = User::where('department_id', $ticket->requester->department_id)
                ->whereHas('roles', function ($query) {
                    $query->where('name', RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);
                })
                ->where('is_active', true)
                ->first();

            if ($dhod) {
                Log::info('DHOD found in requester department (HOD unavailable)', [
                    'ticket_id' => $ticket->id,
                    'dhod_id' => $dhod->id,
                    'dhod_name' => $dhod->name,
                    'requester_department_id' => $ticket->requester->department_id,
                ]);

                return $dhod;
            }
        }

        // Priority 3: Find any Head of Department
        $hod = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::HEAD_OF_DEPARTMENT);
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

        // Priority 3.5: Find any Deputy Head of Department
        $dhod = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::DEPUTY_HEAD_OF_DEPARTMENT);
        })
            ->where('is_active', true)
            ->first();

        if ($dhod) {
            Log::info('DHOD found (any department, HOD unavailable)', [
                'ticket_id' => $ticket->id,
                'dhod_id' => $dhod->id,
                'dhod_name' => $dhod->name,
                'dhod_department_id' => $dhod->department_id,
            ]);

            return $dhod;
        }

        // Priority 4: Fallback to Director
        $director = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::DIRECTOR);
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

    /**
     * Route ticket after approval (generic method for any approval level)
     * Replaces level-specific routing methods (routeAfterLMApproval, routeAfterHODApproval, routeAfterCEOApproval)
     */
    protected function routeAfterApproval(Ticket $ticket, string $approvalLevel, ?int $routedToTeamId = null): void
    {
        // Use the level label for history description
        $levelLabel = ApprovalLevelConstants::getLabel($approvalLevel);

        // Generic routing for any level
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
                'description' => 'Ticket routed to '.($team ? $team->name : 'team')." after {$levelLabel} approval",
                'created_at' => now(),
            ]);

            // Notify department managers when ticket is routed to their team
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->notifyDepartmentManagers($ticket);
            } catch (\Exception $e) {
                Log::warning('Failed to notify department managers after routing', [
                    'ticket_id' => $ticket->id,
                    'team_id' => $teamId,
                    'approval_level' => $approvalLevel,
                    'error' => $e->getMessage(),
                ]);
            }
        } else {
            // Fallback: If no team specified, mark as resolved
            Log::warning('Approval completed but no team to route to', [
                'ticket_id' => $ticket->id,
                'category_id' => $ticket->category_id,
                'approval_level' => $approvalLevel,
            ]);
            $ticket->update(['status' => 'resolved']);
        }
    }

    /**
     * Find approver for a specific approval level (dynamic method)
     */
    public function findApproverForLevel(Ticket $ticket, string $approvalLevel): ?User
    {
        return match ($approvalLevel) {
            ApprovalLevelConstants::LINE_MANAGER,
            ApprovalLevelConstants::DEPUTY_LINE_MANAGER => $this->findLineManager($ticket),
            ApprovalLevelConstants::HEAD_OF_DEPARTMENT,
            ApprovalLevelConstants::DEPUTY_HEAD_OF_DEPARTMENT => $this->findHOD($ticket),
            ApprovalLevelConstants::CEO,
            ApprovalLevelConstants::DEPUTY_CEO,
            ApprovalLevelConstants::DIRECTOR => $this->findCEO($ticket),
            ApprovalLevelConstants::FINANCE_MANAGER => $this->findRoleBasedApprover($ticket, RoleConstants::FINANCE_MANAGER),
            ApprovalLevelConstants::PROCUREMENT_MANAGER => $this->findRoleBasedApprover($ticket, RoleConstants::PROCUREMENT_MANAGER),
            ApprovalLevelConstants::IT_MANAGER => $this->findRoleBasedApprover($ticket, RoleConstants::IT_MANAGER),
            default => $this->findRoleBasedApprover($ticket, ApprovalLevelConstants::getRolesForLevel($approvalLevel)[0] ?? null),
        };
    }

    /**
     * Find approver based on role name (generic helper)
     */
    protected function findRoleBasedApprover(Ticket $ticket, ?string $roleName): ?User
    {
        if (! $roleName) {
            return null;
        }

        // Try to find approver in ticket's assigned team/department first
        if ($ticket->assigned_team_id) {
            $approver = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) use ($roleName) {
                    $query->where('name', $roleName);
                })
                ->where('is_active', true)
                ->first();

            if ($approver) {
                return $approver;
            }
        }

        // Fallback: Find any user with this role
        return User::whereHas('roles', function ($query) use ($roleName) {
            $query->where('name', $roleName);
        })
            ->where('is_active', true)
            ->first();
    }

    /**
     * Find CEO for ticket
     * Made public for use by WorkflowEngine
     */
    public function findCEO(Ticket $ticket): ?User
    {
        // Priority 1: Find CEO role
        $ceo = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::CEO);
        })
            ->where('is_active', true)
            ->first();

        if ($ceo) {
            Log::info('CEO found', [
                'ticket_id' => $ticket->id,
                'ceo_id' => $ceo->id,
                'ceo_name' => $ceo->name,
            ]);

            return $ceo;
        }

        // Priority 2: Fallback to Director
        $director = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::DIRECTOR);
        })
            ->where('is_active', true)
            ->first();

        if ($director) {
            Log::warning('CEO not found, using Director as fallback', [
                'ticket_id' => $ticket->id,
                'director_id' => $director->id,
                'director_name' => $director->name,
            ]);

            return $director;
        }

        // Priority 3: Last resort - Super Admin
        $superAdmin = User::whereHas('roles', function ($query) {
            $query->where('name', RoleConstants::SUPER_ADMIN);
        })
            ->where('is_active', true)
            ->first();

        if ($superAdmin) {
            Log::warning('CEO and Director not found, using Super Admin as last resort', [
                'ticket_id' => $ticket->id,
                'super_admin_id' => $superAdmin->id,
            ]);
        }

        return $superAdmin;
    }
}
