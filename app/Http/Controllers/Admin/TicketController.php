<?php

namespace App\Http\Controllers\Admin;

use App\Constants\RoleConstants;
use App\Http\Controllers\Controller;
use App\Http\Requests\TicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\CustomField;
use App\Models\Department;
use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketCustomFieldValue;
use App\Models\User;
use App\Services\AutomationService;
use App\Services\EscalationService;
use App\Services\NotificationService;
use App\Services\SearchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403, 'You do not have permission to view tickets.');

        $filters = $request->only([
            'q',
            'status',
            'priority',
            'team',
            'agent',
            'category',
            'project',
            'requester',
            'date_from',
            'date_to',
            'sla_breached',
            'tags',
            'approval_status',
            'order_by',
            'order_dir',
        ]);

        // Use optimized search service with user context for visibility filtering
        $searchService = app(SearchService::class);
        $tickets = $searchService->searchTickets($filters, 30, Auth::user())
            ->withQueryString()
            ->through(fn ($ticket) => TicketResource::make($ticket)->resolve());

        // Get pending approvals count (same logic as TicketApprovalController::pending)
        $user = Auth::user();
        $pendingApprovalsQuery = \App\Models\TicketApproval::where('status', 'pending')
            ->whereHas('ticket', function ($query) {
                $query->whereNotIn('status', ['resolved', 'closed', 'cancelled']);
            });

        // Users without assignment authority only see approvals assigned to them.
        // Unassigned approvals are reserved for users who can assign tickets.
        if (! $user->can('tickets.assign')) {
            $pendingApprovalsQuery->where('approver_id', $user->id);
        }

        $pendingApprovalsCount = $pendingApprovalsQuery->count();

        // Get rejected tickets count (same logic as TicketController::rejected)
        $rejectedTicketsQuery = Ticket::whereHas('approvals', function ($query) {
            $query->where('status', 'rejected');
        });

        // Apply visibility filters based on user role
        if (! $user->can('tickets.assign')) {
            // Regular users (Requester/Agent) can only see:
            // 1. Tickets they created (requester)
            // 2. Tickets assigned to them (agent)
            // 3. Tickets assigned to their team (agent)
            $rejectedTicketsQuery->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id) // Own tickets
                    ->orWhere('assigned_agent_id', $user->id) // Assigned to me
                    ->orWhere(function ($subQ) use ($user) {
                        // Assigned to my team
                        $subQ->where('assigned_team_id', $user->department_id)
                            ->whereNotNull('assigned_team_id');
                    });
            });
        }
        // If user can assign tickets, they see all rejected tickets (no additional filter)

        $rejectedTicketsCount = $rejectedTicketsQuery->count();

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
            'options' => $this->filterOptions(),
            'counts' => [
                'pending_approvals' => $pendingApprovalsCount,
                'rejected_tickets' => $rejectedTicketsCount,
            ],
        ]);
    }

    public function create(): Response
    {
        abort_unless(Auth::user()->can('tickets.create'), 403, 'You do not have permission to create tickets.');

        return Inertia::render('Admin/Tickets/Form', [
            'ticket' => null,
            'formOptions' => $this->formOptions(),
        ]);
    }

    public function store(TicketRequest $request): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.create'), 403, 'You do not have permission to create tickets.');

        try {
            $data = $this->preparePayload($request->validated());

            $ticket = Ticket::create($data);

            $this->syncRelations($ticket, $request->validated());

            // Synchronous because workflow may update ticket status or routing.
            try {
                $approvalService = app(\App\Services\ApprovalWorkflowService::class);
                $approvalService->initializeWorkflow($ticket);
            } catch (\Exception $e) {
                \Log::warning('Approval workflow service failed on ticket creation', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Queue heavy operations to run asynchronously (non-blocking)
            // This allows the response to return immediately while processing continues in background

            // Execute automation rules (async)
            dispatch(function () use ($ticket) {
                try {
                    $automationService = app(AutomationService::class);
                    $automationService->onTicketCreated($ticket);
                } catch (\Exception $e) {
                    \Log::warning('Automation service failed on ticket creation', [
                        'ticket_id' => $ticket->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            })->afterResponse();

            // Send notifications (async)
            dispatch(function () use ($ticket) {
                try {
                    $notificationService = app(NotificationService::class);
                    // Notify requester
                    $notificationService->notifyTicketCreated($ticket);

                    // Notify assignment (includes Telegram group notification)
                    $notificationService->notifyTicketAssigned($ticket);

                    // Notify teammates of the requester
                    $notificationService->notifyTeammates($ticket);
                } catch (\Exception $e) {
                    \Log::error('Notification service failed on ticket creation', [
                        'ticket_id' => $ticket->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            })->afterResponse();

            // Clear search cache (async)
            dispatch(function () {
                try {
                    app(SearchService::class)->clearCache();
                } catch (\Exception $e) {
                    \Log::warning('Search service failed to clear cache', [
                        'error' => $e->getMessage(),
                    ]);
                }
            })->afterResponse();

            // Refresh the ticket to ensure all relations are loaded
            $ticket->refresh();

            return redirect()
                ->route('admin.tickets.show', $ticket->id)
                ->with('success', 'Ticket created successfully!');
        } catch (\Exception $e) {
            \Log::error('Failed to create ticket', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to create ticket: '.$e->getMessage());
        }
    }

    public function show(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403, 'You do not have permission to view tickets.');

        $user = Auth::user();

        // Apply visibility check for all tickets (not just rejected)
        $canView = $this->canUserViewTicket($user, $ticket);

        if (! $canView) {
            abort(403, 'You do not have permission to view this ticket.');
        }

        $ticket->load([
            'requester',
            'assignedTeam',
            'assignedAgent',
            'category',
            'project',
            'slaPolicy',
            'tags',
            'watchers',
            'comments.user',
            'comments.replies.user',
            'comments.parent.user',
            'attachments.uploader',
            'histories.user',
            'customFieldValues.customField',
            'approvals.approver',
            'approvals.routedToTeam',
        ]);

        // Get agents for assignment (users with Agent or Senior Agent role in the assigned team)
        $agents = collect();
        if ($ticket->assigned_team_id) {
            $agents = User::where('department_id', $ticket->assigned_team_id)
                ->whereHas('roles', function ($query) {
                    $query->whereIn('name', ['Agent', 'Senior Agent']);
                })
                ->where('is_active', true)
                ->select('id', 'name', 'email', 'avatar')
                ->orderBy('name')
                ->get();
        }

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => TicketResource::make($ticket),
            'departments' => Department::where('is_active', true)->select('id', 'name')->orderBy('name')->get(),
            'agents' => $agents,
            'options' => $this->filterOptions(),
        ]);
    }

    public function edit(Ticket $ticket): Response
    {
        $this->authorize('update', $ticket);

        $ticket->load([
            'requester:id,name',
            'assignedTeam:id,name',
            'assignedAgent:id,name',
            'category:id,name',
            'project:id,name',
            'slaPolicy:id,name',
            'tags:id,name,color',
            'watchers:id,name',
            'customFieldValues.customField',
        ]);

        return Inertia::render('Admin/Tickets/Form', [
            'ticket' => TicketResource::make($ticket),
            'formOptions' => $this->formOptions(),
        ]);
    }

    public function update(TicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);

        try {
            $originalData = $ticket->getOriginal();
            $validated = $request->validated();
            $data = $this->preparePayload($validated, $ticket);
            $user = Auth::user();

            $detailFields = array_diff(array_keys($data), [
                'status',
                'resolution_summary',
                'priority',
                'assigned_agent_id',
                'assigned_team_id',
            ]);
            if ($detailFields && ! $user->can('update', $ticket)) {
                abort(403, 'You do not have permission to update ticket details.');
            }

            if (isset($data['priority'])
                && $data['priority'] !== $originalData['priority']
                && ! $user->can('tickets.change-priority')) {
                abort(403, 'You do not have permission to change ticket priority.');
            }

            // Check if this is a simple "pick ticket" operation (agent picking ticket)
            $isPickingTicket = isset($data['assigned_agent_id']) &&
                               $data['assigned_agent_id'] == $user->id &&
                               ! $user->can('tickets.assign') &&
                               count($validated) === 1; // Only assigned_agent_id in request

            if (array_key_exists('assigned_agent_id', $data)
                && ! $user->can('assignAgent', [$ticket, $data['assigned_agent_id']])) {
                return redirect()
                    ->back()
                    ->withInput()
                    ->with('error', $ticket->hasPendingApproval()
                        ? 'This ticket is waiting for approval. It cannot be picked or reassigned until approval is completed.'
                        : 'You can only pick tickets assigned to your team or unassigned tickets. Only managers and admins can assign tickets to others.');
            }

            // Check if user is trying to change status and has permission
            if (isset($data['status']) && $data['status'] !== $originalData['status']) {
                if (! $user->can('changeStatus', [$ticket, $data['status']])) {
                    // Check if user is the requester
                    if ($ticket->requester_id === $user->id) {
                        return redirect()
                            ->back()
                            ->withInput()
                            ->with('error', 'As the requester, you can only close or cancel your tickets, or reopen closed/cancelled tickets. Please contact an agent to change the status to other values.');
                    }

                    return redirect()
                        ->back()
                        ->withInput()
                        ->with('error', 'You can only change the status of tickets assigned to you or your team. Managers and admins can change any ticket status.');
                }
            }

            // Track changes - normalize values for comparison
            // Skip array values (they're handled by syncRelations)
            $changes = [];
            foreach ($data as $key => $value) {
                // Skip array values - they're handled separately by syncRelations
                if (is_array($value)) {
                    continue;
                }

                $oldValue = $originalData[$key] ?? null;
                $newValue = $value;

                // Normalize null/empty string comparisons
                if (($oldValue === null || $oldValue === '') && ($newValue === null || $newValue === '')) {
                    continue; // Both are empty, no change
                }

                // Normalize for comparison (convert to string for comparison)
                $oldNormalized = $oldValue === null ? null : (string) $oldValue;
                $newNormalized = $newValue === null ? null : (string) $newValue;

                if ($oldNormalized !== $newNormalized) {
                    $changes[$key] = [
                        'old' => $oldValue,
                        'new' => $newValue,
                    ];
                }
            }

            $statusChanged = isset($changes['status']);

            // For simple pick operations, skip heavy logging
            if (! $isPickingTicket) {
                if (isset($data['status'])) {
                    \Log::info('TicketController::update - Status field in data', [
                        'ticket_id' => $ticket->id,
                        'old_status' => $originalData['status'] ?? null,
                        'new_status' => $data['status'],
                        'status_in_changes' => isset($changes['status']),
                    ]);
                }

                \Log::info('TicketController::update - Changes detected', [
                    'ticket_id' => $ticket->id,
                    'changes_count' => count($changes),
                    'changes' => $changes,
                ]);
            }

            // Handle agent picking ticket - keep team assignment
            if (isset($data['assigned_agent_id']) && $data['assigned_agent_id'] == $user->id && ! $user->can('tickets.assign')) {
                // Agent is picking ticket - keep team assignment if ticket is assigned to their team
                if ($ticket->assigned_team_id && $ticket->assigned_team_id == $user->department_id) {
                    // Don't clear team assignment when agent picks
                    // The team assignment stays, agent just claims it
                    // Ensure team assignment is preserved in the data
                    if (! isset($data['assigned_team_id'])) {
                        $data['assigned_team_id'] = $ticket->assigned_team_id;
                    }
                }
            }

            $ticket->update($data);

            $this->syncRelations($ticket, $request->validated());

            // Record history for changes
            foreach ($changes as $field => $change) {
                $action = match ($field) {
                    'status' => 'status_changed',
                    'priority' => 'priority_changed',
                    'assigned_agent_id' => 'assigned',
                    'assigned_team_id' => 'assigned',
                    'category_id' => 'category_changed',
                    'sla_policy_id' => 'sla_changed',
                    default => 'field_changed',
                };

                // Get human-readable values for certain fields
                $oldValue = $this->formatHistoryValue($field, $change['old']);
                $newValue = $this->formatHistoryValue($field, $change['new']);

                $ticket->histories()->create([
                    'user_id' => Auth::id(),
                    'action' => $action,
                    'field_name' => $field,
                    'old_value' => $oldValue,
                    'new_value' => $newValue,
                    'description' => ucfirst(str_replace('_', ' ', $field))." changed from {$oldValue} to {$newValue}",
                    'created_at' => now(),
                ]);
            }

            // For simple pick operations, skip heavy operations and return quickly
            if ($isPickingTicket) {
                // Skip heavy operations (automation, escalation, notifications, cache) for instant response
                // These can be handled later by a scheduled job or on the next page load
                // The ticket assignment is already saved, so the user gets immediate feedback

                // Return immediately for fast response
                return redirect()
                    ->route('admin.tickets.show', $ticket)
                    ->with('success', 'Ticket picked successfully!');
            }

            // Execute heavy operations (automation, escalation, cache clearing) asynchronously
            // This ensures the user gets an immediate response while emails and rules process in the background
            $updatedById = Auth::id();
            dispatch(function () use ($ticket, $statusChanged, $originalData, $changes, $updatedById) {
                try {
                    // Execute automation rules
                    $automationService = app(AutomationService::class);
                    $automationService->onTicketUpdated($ticket, $originalData);

                    if ($statusChanged) {
                        $automationService->onTicketStatusChanged($ticket, $originalData);
                    }

                    $updatedBy = User::find($updatedById);
                    if ($updatedBy) {
                        app(NotificationService::class)->notifyTicketLifecycleUpdate(
                            $ticket,
                            $updatedBy,
                            $changes
                        );
                    }

                    // Check for escalation
                    $escalationService = app(EscalationService::class);
                    $escalationService->checkTicket($ticket);

                    // Clear search cache
                    app(SearchService::class)->clearCache();
                } catch (\Exception $e) {
                    \Log::error('Background processing failed on ticket update', [
                        'ticket_id' => $ticket->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            })->afterResponse();

            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('success', 'Ticket updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('TicketController::update - Validation error', [
                'ticket_id' => $ticket->id,
                'errors' => $e->errors(),
            ]);
            throw $e; // Re-throw to let Laravel handle it
        } catch (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('TicketController::update - Error', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()
                ->back()
                ->withInput()
                ->with('error', 'Failed to update ticket: '.$e->getMessage());
        }
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.delete'), 403, 'You do not have permission to delete tickets.');

        $ticket->delete();

        return redirect()
            ->route('admin.tickets.index')
            ->with('success', 'Ticket deleted.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        $request->validate([
            'ticket_ids' => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['exists:tickets,id'],
            'action' => ['required', 'string', 'in:status,priority,assign_agent,assign_team,add_tags,remove_tags'],
            'value' => ['required'],
        ]);

        $ticketIds = $request->input('ticket_ids');
        $action = $request->input('action');
        $value = $request->input('value');

        // Check permission based on action type
        // Each bulk action uses its dedicated permission.
        if (in_array($action, ['assign_agent', 'assign_team'])) {
            abort_unless(Auth::user()->can('tickets.assign'), 403, 'You do not have permission to assign tickets.');
        } elseif ($action === 'priority') {
            abort_unless(Auth::user()->can('tickets.change-priority'), 403, 'You do not have permission to change ticket priority.');
        } elseif ($action !== 'status') {
            abort_unless(Auth::user()->can('tickets.update-details'), 403, 'You do not have permission to edit ticket details.');
        }

        $tickets = Ticket::whereIn('id', $ticketIds)->get();
        $updatedCount = 0;
        $failedCount = 0;
        $failedMessages = [];
        $notificationService = app(NotificationService::class);

        \Log::info('TicketController::bulkUpdate - Starting bulk update', [
            'action' => $action,
            'value' => $value,
            'ticket_count' => count($tickets),
        ]);

        foreach ($tickets as $ticket) {
            $changed = false;

            // Refresh ticket to ensure relationships are loaded
            $ticket->refresh();
            $ticket->load(['requester', 'assignedAgent', 'assignedTeam', 'category', 'project']);

            if (! Auth::user()->can('view', $ticket)) {
                $failedCount++;
                $failedMessages[] = "Ticket #{$ticket->ticket_number}: You do not have permission to access this ticket.";

                continue;
            }

            switch ($action) {
                case 'status':
                    // Check if user can change status for this ticket
                    if (! Auth::user()->can('changeStatus', [$ticket, $value])) {
                        \Log::warning('TicketController::bulkUpdate - User attempted to change status without permission', [
                            'ticket_id' => $ticket->id,
                            'ticket_number' => $ticket->ticket_number,
                            'user_id' => Auth::id(),
                            'assigned_agent_id' => $ticket->assigned_agent_id,
                            'assigned_team_id' => $ticket->assigned_team_id,
                            'requester_id' => $ticket->requester_id,
                            'new_status' => $value,
                        ]);
                        $failedCount++;
                        // Check if user is the requester
                        if ($ticket->hasPendingApproval() && $value !== Ticket::STATUS_CANCELLED) {
                            $failedMessages[] = "Ticket #{$ticket->ticket_number}: Approval is still pending. Only cancellation is allowed until approval is completed.";
                        } elseif ($ticket->requester_id === Auth::id()) {
                            $failedMessages[] = "Ticket #{$ticket->ticket_number}: As the requester, you can only close or cancel your tickets, or reopen closed/cancelled tickets.";
                        } else {
                            $failedMessages[] = "Ticket #{$ticket->ticket_number}: You can only change the status of tickets assigned to you or your team. Managers and admins can change any ticket status.";
                        }

                        continue 2; // Skip this ticket (continue outer foreach loop)
                    }

                    if (in_array($value, Ticket::STATUSES)) {
                        $oldStatus = $ticket->status;
                        $ticket->status = $value;

                        // Update resolved_at or closed_at based on status
                        if ($value === 'resolved' && ! $ticket->resolved_at) {
                            $ticket->resolved_at = now();
                        } elseif ($value === 'closed' && ! $ticket->closed_at) {
                            $ticket->closed_at = now();
                        } elseif (! in_array($value, ['resolved', 'closed'])) {
                            $ticket->resolved_at = null;
                            $ticket->closed_at = null;
                        }

                        $ticket->save();
                        $changed = true;

                        // Record history
                        $ticket->histories()->create([
                            'user_id' => Auth::id(),
                            'action' => 'status_changed',
                            'field_name' => 'status',
                            'old_value' => $oldStatus,
                            'new_value' => $value,
                            'description' => "Status changed from {$oldStatus} to {$value}",
                            'created_at' => now(),
                        ]);

                        // Execute automation in background
                        dispatch(function () use ($ticket) {
                            try {
                                $automationService = app(AutomationService::class);
                                $automationService->onTicketStatusChanged($ticket);
                            } catch (\Exception $e) {
                                \Log::error('Background status automation failed', [
                                    'ticket_id' => $ticket->id,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        })->afterResponse();

                        // Hardcoded notifications removed - now handled by AutomationService
                    }
                    break;

                case 'priority':
                    if (in_array($value, Ticket::PRIORITIES)) {
                        $oldPriority = $ticket->priority;
                        $ticket->priority = $value;
                        $ticket->save();
                        $changed = true;

                        // Record history
                        $ticket->histories()->create([
                            'user_id' => Auth::id(),
                            'action' => 'priority_changed',
                            'field_name' => 'priority',
                            'old_value' => $oldPriority,
                            'new_value' => $value,
                            'description' => "Priority changed from {$oldPriority} to {$value}",
                            'created_at' => now(),
                        ]);

                        // Execute automation in background
                        dispatch(function () use ($ticket) {
                            try {
                                $automationService = app(AutomationService::class);
                                $automationService->onTicketUpdated($ticket);
                            } catch (\Exception $e) {
                                \Log::error('Background priority automation failed', [
                                    'ticket_id' => $ticket->id,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        })->afterResponse();
                    }
                    break;

                case 'assign_agent':
                    $user = Auth::user();
                    $agent = User::find($value);

                    if (! $agent) {
                        $failedCount++;
                        $failedMessages[] = "Ticket #{$ticket->ticket_number}: Invalid agent selected.";

                        continue 2;
                    }

                    // Check if user is assigning to themselves (picking/claiming)
                    $isPickingSelf = $value == $user->id;

                    if (! $user->can('assignAgent', [$ticket, (int) $value])) {
                        \Log::warning('TicketController::bulkUpdate - User attempted unauthorized agent assignment', [
                            'ticket_id' => $ticket->id,
                            'user_id' => Auth::id(),
                            'target_agent_id' => $value,
                            'is_picking_self' => $isPickingSelf,
                        ]);
                        $failedCount++;
                        $failedMessages[] = $ticket->hasPendingApproval()
                            ? "Ticket #{$ticket->ticket_number}: Approval is still pending. The ticket cannot be picked or reassigned yet."
                            : "Ticket #{$ticket->ticket_number}: You can only pick tickets assigned to your team or unassigned tickets. Only managers and admins can assign tickets to others.";

                        continue 2;
                    }

                    // User has permission or is picking a valid ticket
                    $oldAgent = $ticket->assigned_agent_id;

                    // If reassigning to a different agent, notify the old agent
                    $shouldNotifyOldAgent = $oldAgent && $oldAgent != $value && $value;

                    $ticket->assigned_agent_id = $value;
                    // Keep team assignment when agent picks (don't clear it)
                    // Only clear team assignment if manager/admin is explicitly reassigning to a different agent
                    if ($user->can('tickets.assign') && $oldAgent && $oldAgent != $value) {
                        // Manager/admin reassigning to different agent - clear team assignment
                        $ticket->assigned_team_id = null;
                    } elseif (! $user->can('tickets.assign') && $isPickingSelf && $ticket->assigned_team_id && $ticket->assigned_team_id == $user->department_id) {
                        // Agent picking ticket assigned to their team - keep team assignment
                        // Team assignment is already set, no need to change it
                    }
                    $ticket->save();
                    $changed = true;

                    // Refresh to load relationships
                    $ticket->refresh();
                    $ticket->load(['requester', 'assignedAgent', 'assignedTeam']);

                    // Record history
                    $ticket->histories()->create([
                        'user_id' => Auth::id(),
                        'action' => 'assigned',
                        'field_name' => 'assigned_agent_id',
                        'old_value' => $oldAgent,
                        'new_value' => $value,
                        'description' => "Assigned to {$agent->name}",
                        'created_at' => now(),
                    ]);

                    // Execute automation in background
                    dispatch(function () use ($ticket) {
                        try {
                            $automationService = app(AutomationService::class);
                            $automationService->onTicketUpdated($ticket);
                        } catch (\Exception $e) {
                            \Log::error('Background assignment automation failed', [
                                'ticket_id' => $ticket->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    })->afterResponse();
                    break;

                case 'assign_team':
                    // Check if user has permission to assign tickets
                    if (! Auth::user()->can('tickets.assign')) {
                        \Log::warning('TicketController::bulkUpdate - User attempted to assign ticket without permission', [
                            'ticket_id' => $ticket->id,
                            'user_id' => Auth::id(),
                            'action' => 'assign_team',
                        ]);
                        $failedCount++;
                        $failedMessages[] = "Ticket #{$ticket->ticket_number}: You don't have permission to assign tickets. Only managers and admins can reassign tickets.";

                        continue 2; // Skip this ticket (continue outer foreach loop)
                    }

                    $team = Department::find($value);
                    if ($team) {
                        $oldTeam = $ticket->assigned_team_id;
                        $oldAgent = $ticket->assigned_agent_id;

                        // If ticket was assigned to an agent, notify them of team reassignment
                        $shouldNotifyOldAgent = $oldAgent && $oldAgent;

                        $ticket->assigned_team_id = $value;
                        $ticket->assigned_agent_id = null; // Clear agent assignment when assigning team
                        $ticket->save();
                        $changed = true;

                        // Refresh to load relationships
                        $ticket->refresh();
                        $ticket->load(['requester', 'assignedAgent', 'assignedTeam']);

                        // Record history
                        $ticket->histories()->create([
                            'user_id' => Auth::id(),
                            'action' => 'assigned',
                            'field_name' => 'assigned_team_id',
                            'old_value' => $oldTeam,
                            'new_value' => $value,
                            'description' => "Assigned to team {$team->name}",
                            'created_at' => now(),
                        ]);

                        // Execute automation
                        $automationService = app(AutomationService::class);
                        $automationService->onTicketUpdated($ticket);
                    }
                    break;

                case 'add_tags':
                    $tagIds = is_array($value) ? $value : [$value];
                    $existingTagIds = $ticket->tags()->pluck('tags.id')->toArray();
                    $newTagIds = array_diff($tagIds, $existingTagIds);

                    if (! empty($newTagIds)) {
                        $ticket->tags()->attach($newTagIds);
                        $changed = true;

                        $tagNames = Tag::whereIn('id', $newTagIds)->pluck('name')->join(', ');
                        $ticket->histories()->create([
                            'user_id' => Auth::id(),
                            'action' => 'tagged',
                            'field_name' => 'tags',
                            'old_value' => null,
                            'new_value' => $tagNames,
                            'description' => "Added tags: {$tagNames}",
                            'created_at' => now(),
                        ]);
                    }
                    break;

                case 'remove_tags':
                    $tagIds = is_array($value) ? $value : [$value];
                    $removedTags = $ticket->tags()->whereIn('tags.id', $tagIds)->get();

                    if ($removedTags->isNotEmpty()) {
                        $ticket->tags()->detach($tagIds);
                        $changed = true;

                        $tagNames = $removedTags->pluck('name')->join(', ');
                        $ticket->histories()->create([
                            'user_id' => Auth::id(),
                            'action' => 'untagged',
                            'field_name' => 'tags',
                            'old_value' => $tagNames,
                            'new_value' => null,
                            'description' => "Removed tags: {$tagNames}",
                            'created_at' => now(),
                        ]);
                    }
                    break;
            }

            if ($changed) {
                $updatedCount++;
            }
        }

        // Clear search cache asynchronously
        dispatch(function () {
            try {
                app(SearchService::class)->clearCache();
            } catch (\Exception $e) {
                \Log::error('Background search cache clearing failed', [
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();

        // Build response message
        if ($failedCount > 0 && $updatedCount > 0) {
            // Some succeeded, some failed
            $message = "Successfully updated {$updatedCount} ticket(s). {$failedCount} ticket(s) could not be updated.";
            if (! empty($failedMessages)) {
                $message .= ' '.implode(' ', array_slice($failedMessages, 0, 3)); // Show first 3 error messages
                if (count($failedMessages) > 3) {
                    $message .= ' (and '.(count($failedMessages) - 3).' more)';
                }
            }

            return redirect()
                ->route('admin.tickets.index')
                ->with('warning', $message)
                ->with('error_details', $failedMessages);
        } elseif ($failedCount > 0) {
            // All failed
            $message = "Failed to update {$failedCount} ticket(s).";
            if (! empty($failedMessages)) {
                $message .= ' '.implode(' ', array_slice($failedMessages, 0, 2)); // Show first 2 error messages
                if (count($failedMessages) > 2) {
                    $message .= ' (and '.(count($failedMessages) - 2).' more)';
                }
            }

            return redirect()
                ->route('admin.tickets.index')
                ->with('error', $message)
                ->with('error_details', $failedMessages);
        } elseif ($updatedCount > 0) {
            // All succeeded
            $message = "Successfully updated {$updatedCount} ticket(s).";

            return redirect()
                ->route('admin.tickets.index')
                ->with('success', $message);
        } else {
            // Nothing changed
            $message = 'No tickets were updated.';

            return redirect()
                ->route('admin.tickets.index')
                ->with('info', $message);
        }
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.delete'), 403, 'You do not have permission to delete tickets.');

        $request->validate([
            'ticket_ids' => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['exists:tickets,id'],
        ]);

        $ticketIds = $request->input('ticket_ids');
        $count = Ticket::whereIn('id', $ticketIds)->delete();

        // Clear search cache
        app(SearchService::class)->clearCache();

        return redirect()
            ->route('admin.tickets.index')
            ->with('success', "Successfully deleted {$count} ticket(s).");
    }

    protected function preparePayload(array $data, ?Ticket $ticket = null): array
    {
        // Convert empty strings to null for optional fields
        $optionalFields = ['assigned_agent_id', 'project_id', 'sla_policy_id', 'ticket_number'];
        foreach ($optionalFields as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        if (! $ticket && empty($data['ticket_number'])) {
            $data['ticket_number'] = Ticket::generateTicketNumber();
        }

        // Auto-detect source if not provided or empty
        if (! $ticket && (empty($data['source']) || ! in_array($data['source'], Ticket::SOURCES))) {
            $data['source'] = $this->detectSource(request());
        }

        if (! empty($data['sla_policy_id'])) {
            $sla = SlaPolicy::find($data['sla_policy_id']);

            if ($sla) {
                $data['first_response_due_at'] = $data['first_response_due_at']
                    ?? now()->addMinutes($sla->response_time);
                $data['resolution_due_at'] = $data['resolution_due_at']
                    ?? now()->addMinutes($sla->resolution_time);
            }
        }

        return Arr::except($data, ['tag_ids', 'watcher_ids', 'custom_fields']);
    }

    /**
     * Auto-detect ticket source based on request headers and user agent
     */
    protected function detectSource(Request $request): string
    {
        $userAgent = $request->userAgent() ?? '';
        $userAgentLower = strtolower($userAgent);

        // Check for mobile app identifier in headers or user agent
        // Common patterns: "KimmixApp", "MobileApp", custom headers
        if ($request->hasHeader('X-Client-Type') ||
            $request->hasHeader('X-App-Version') ||
            strpos($userAgentLower, 'kimmix') !== false ||
            strpos($userAgentLower, 'mobile-app') !== false ||
            strpos($userAgentLower, 'android') !== false && strpos($userAgentLower, 'wv') !== false ||
            strpos($userAgentLower, 'ios') !== false && strpos($userAgentLower, 'safari') === false) {
            return 'mobile_app';
        }

        // Check for phone integration (could be via API with specific header)
        if ($request->hasHeader('X-Source') && strtolower($request->header('X-Source')) === 'phone') {
            return 'phone';
        }

        // Check for email source (could be via email-to-ticket integration)
        if ($request->hasHeader('X-Source') && strtolower($request->header('X-Source')) === 'email') {
            return 'email';
        }

        // Check if it's a mobile browser (but not the app)
        if (preg_match('/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i', $userAgent)) {
            // Still consider it web if accessed via browser
            return 'web';
        }

        // Default to web for browser-based requests
        return 'web';
    }

    protected function syncRelations(Ticket $ticket, array $data): void
    {
        if (array_key_exists('tag_ids', $data)) {
            $ticket->tags()->sync($data['tag_ids'] ?? []);
        }

        if (array_key_exists('watcher_ids', $data)) {
            $ticket->watchers()->sync($data['watcher_ids'] ?? []);
        }

        // Sync custom field values
        if (array_key_exists('custom_fields', $data) && is_array($data['custom_fields'])) {
            foreach ($data['custom_fields'] as $fieldId => $value) {
                $customField = CustomField::find($fieldId);
                if (! $customField) {
                    continue;
                }

                // Handle empty values
                if ($value === null || $value === '' || (is_array($value) && empty($value))) {
                    TicketCustomFieldValue::where('ticket_id', $ticket->id)
                        ->where('custom_field_id', $fieldId)
                        ->delete();

                    continue;
                }

                // Handle multiselect (array)
                if ($customField->field_type === 'multiselect' && is_array($value)) {
                    $value = json_encode($value);
                }

                // Handle boolean
                if ($customField->field_type === 'boolean') {
                    $value = $value ? '1' : '0';
                }

                TicketCustomFieldValue::updateOrCreate(
                    [
                        'ticket_id' => $ticket->id,
                        'custom_field_id' => $fieldId,
                    ],
                    [
                        'value' => $value,
                    ]
                );
            }
        }
    }

    /**
     * Get available statuses based on current user role.
     * Requesters are restricted to 'open' only.
     */
    protected function getAvailableStatuses(): array
    {
        $user = Auth::user();

        // Determine available statuses based on role
        $statuses = Ticket::STATUSES;
        $isPrivileged = $user->hasAnyRole(array_merge(
            RoleConstants::getManagementRoles(),
            RoleConstants::getAgentRoles(),
            RoleConstants::getExecutiveRoles()
        )) || $user->hasRole(RoleConstants::SUPER_ADMIN) || $user->hasRole(RoleConstants::IT_ADMINISTRATOR);

        if (! $isPrivileged) {
            // Requesters can only see/select 'open'
            return ['open'];
        }

        return $statuses;
    }

    protected function filterOptions(): array
    {
        return [
            'statuses' => $this->getAvailableStatuses(),
            'priorities' => Ticket::PRIORITIES,
            'teams' => Department::select('id', 'name')->orderBy('name')->get(),
            'agents' => User::select('id', 'name')->orderBy('name')->get(),
            'categories' => TicketCategory::active()->select('id', 'name')->orderBy('name')->get(),
            'projects' => Project::select('id', 'name')->orderBy('name')->get(),
            'requesters' => User::select('id', 'name')->orderBy('name')->get(),
            'tags' => Tag::select('id', 'name', 'color')->orderBy('name')->get(),
        ];
    }

    protected function formOptions(): array
    {
        $user = Auth::user();

        // Check if user can create tickets on behalf of others
        // IMPORTANT: Check department-limited roles FIRST to override permission
        // Most managers manage their department/team, not cross-functional teams
        $isHOD = $user->hasRole(RoleConstants::HEAD_OF_DEPARTMENT);
        $isLineManager = $user->hasRole(RoleConstants::LINE_MANAGER);
        $isDepartmentManager = $user->hasAnyRole([
            RoleConstants::IT_MANAGER,
            RoleConstants::OPERATIONS_MANAGER,
            RoleConstants::FINANCE_MANAGER,
            RoleConstants::HR_MANAGER,
            RoleConstants::PROCUREMENT_MANAGER,
            RoleConstants::SAFETY_MANAGER,
        ]);
        $isExecutiveOrAdmin = $user->hasAnyRole(RoleConstants::getExecutiveRoles());
        $isProjectManager = $user->hasRole(RoleConstants::PROJECT_MANAGER);
        $hasCreateOnBehalfPermission = $user->can('tickets.create-on-behalf');

        // Optimize: Load user roles once to avoid multiple queries
        $user->load('roles');

        // Filter requesters based on permission and role
        if (($isHOD || $isLineManager || $isDepartmentManager) && $user->department_id) {
            // Department managers can only select users from their own department
            // This is a business rule: They manage their department/team, not cross-functional teams
            // - HOD: Manages entire department (multiple teams)
            // - Line Manager: Manages small team (5-20 people) within department
            // - IT Manager, Finance Manager, HR Manager, etc.: Manage their specific department
            $requesters = User::select('id', 'name', 'avatar')
                ->where('department_id', $user->department_id)
                ->orderBy('name')
                ->get();
            $canCreateOnBehalf = true; // Can create on behalf, but limited to their department
        } elseif ($isExecutiveOrAdmin || $isProjectManager) {
            // Executives (CEO, Director) and Project Managers can select ALL users
            // - Executives: Oversee entire organization, may need to create tickets for anyone
            // - Project Manager: Works across departments on projects, may need to create tickets for cross-functional teams
            $requesters = User::select('id', 'name', 'avatar')->orderBy('name')->get();
            $canCreateOnBehalf = true;
        } elseif ($hasCreateOnBehalfPermission) {
            // Fallback: Any other role with permission (shouldn't happen, but just in case)
            $requesters = User::select('id', 'name', 'avatar')->orderBy('name')->get();
            $canCreateOnBehalf = true;
        } else {
            // Regular users (Requesters, Agents) can only select themselves
            // Ensure avatar is included even for single user
            $requesters = collect([$user->only(['id', 'name', 'avatar'])]);
            $canCreateOnBehalf = false;
        }

        // Filter agents: Only show users with Agent or Senior Agent roles
        // Optimize: Use eager loading and cache role names
        $agentRoleNames = RoleConstants::getAgentRoles();
        $agents = User::select('users.id', 'users.name', 'users.department_id', 'users.avatar')
            ->with(['department:id,name', 'roles:id,name'])
            ->where('users.is_active', true)
            ->whereHas('roles', function ($roleQuery) use ($agentRoleNames) {
                $roleQuery->whereIn('name', $agentRoleNames);
            })
            ->orderBy('users.name')
            ->get()
            ->map(function ($agent) {
                // Get primary role (first agent role found)
                $primaryRole = $agent->roles->first();

                return [
                    'id' => $agent->id,
                    'name' => $agent->name,
                    'avatar' => $agent->avatar,
                    'role' => $primaryRole ? $primaryRole->name : null,
                    'department' => $agent->department ? $agent->department->name : null,
                ];
            });

        // Optimize: Cache settings to avoid multiple queries
        $canAssign = $user->can('tickets.assign');
        $isAgent = $user->hasAnyRole(RoleConstants::getAgentRoles());
        $isManager = $user->hasAnyRole(RoleConstants::getManagementRoles()) || $isExecutiveOrAdmin || $isHOD;
        $isInternal = $isAgent || $isManager;

        $enableAdvancedOptions = $canAssign ? \App\Models\Setting::get('enable_advanced_options', true) : false;
        $enableSlaOptions = $canAssign ? \App\Models\Setting::get('enable_sla_options', true) : false;
        $enableCustomFields = $canAssign ? \App\Models\Setting::get('enable_custom_fields', true) : false;
        $enableTags = $canAssign ? \App\Models\Setting::get('enable_tags', true) : false;
        $enableWatchers = $canAssign ? \App\Models\Setting::get('enable_watchers', true) : false;

        // Departments: Show all support teams for internal users, but keep IT-SD for external users
        $departmentsQuery = Department::where('is_active', true)->select('id', 'name')->orderBy('name');
        if (! $isInternal) {
            $departmentsQuery->where('code', 'IT-SD');
        } else {
            $departmentsQuery->where('is_support_team', true);
        }

        return [
            'statuses' => $this->getAvailableStatuses(),
            'priorities' => Ticket::PRIORITIES,
            'sources' => Ticket::SOURCES,
            'departments' => $departmentsQuery->get(),
            'agents' => $agents,
            'categories' => TicketCategory::active()->select('id', 'name')->orderBy('name')->get(),
            'projects' => Project::select('id', 'name')->orderBy('name')->get(),
            'requesters' => $requesters,
            'can_create_on_behalf' => $canCreateOnBehalf,
            'is_hod' => $isHOD,
            'is_internal' => $isInternal,
            'sla_policies' => SlaPolicy::select('id', 'name')->orderBy('name')->get(),
            'tags' => Tag::select('id', 'name', 'color')->orderBy('name')->get(),
            // Advanced Options settings
            // Disable advanced options for agents (users without tickets.assign permission)
            'enable_advanced_options' => $enableAdvancedOptions,
            'enable_sla_options' => $enableSlaOptions,
            'enable_custom_fields' => $enableCustomFields,
            'enable_tags' => $enableTags,
            'enable_watchers' => $enableWatchers,
            'customFields' => CustomField::active()->ordered()->get()->map(function ($field) {
                // Transform options from associative array to array of objects
                $options = [];
                if ($field->options && is_array($field->options)) {
                    // Check if options is already in the correct format (array of objects)
                    if (isset($field->options[0]) && is_array($field->options[0]) && isset($field->options[0]['label'])) {
                        $options = $field->options;
                    } else {
                        // Transform associative array to array of objects
                        foreach ($field->options as $key => $value) {
                            $options[] = [
                                'label' => $value,
                                'value' => is_numeric($key) ? $value : $key,
                            ];
                        }
                    }
                }

                return [
                    'id' => $field->id,
                    'name' => $field->name,
                    'label' => $field->label,
                    'field_type' => $field->field_type,
                    'options' => $options,
                    'default_value' => $field->default_value,
                    'is_required' => $field->is_required,
                    'placeholder' => $field->placeholder,
                    'help_text' => $field->help_text,
                ];
            }),
        ];
    }

    /**
     * Format history value for display
     */
    protected function formatHistoryValue(string $field, $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        return match ($field) {
            'assigned_agent_id' => \App\Models\User::find($value)?->name ?? $value,
            'assigned_team_id' => \App\Models\Department::find($value)?->name ?? $value,
            'category_id' => \App\Models\TicketCategory::find($value)?->name ?? $value,
            'sla_policy_id' => \App\Models\SlaPolicy::find($value)?->name ?? $value,
            'status' => ucfirst($value),
            'priority' => ucfirst($value),
            default => (string) $value,
        };
    }

    /**
     * Export tickets to CSV
     */
    public function export(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_unless(Auth::user()->can('tickets.view'), 403, 'You do not have permission to view tickets.');

        $filters = $request->only([
            'q',
            'status',
            'priority',
            'team',
            'agent',
            'category',
            'project',
            'requester',
            'date_from',
            'date_to',
            'sla_breached',
            'tags',
        ]);

        // Build query manually for export (without pagination)
        $query = Ticket::query()
            ->with([
                'requester:id,name,email',
                'assignedTeam:id,name',
                'assignedAgent:id,name',
                'category:id,name',
                'project:id,name,code',
                'slaPolicy:id,name',
                'tags:id,name,color',
            ]);

        // Apply filters (same logic as SearchService)
        if (! empty($filters['q'])) {
            $searchTerm = $filters['q'];
            $query->where(function ($q) use ($searchTerm) {
                $q->where('ticket_number', 'like', "%{$searchTerm}%")
                    ->orWhere('subject', 'like', "%{$searchTerm}%")
                    ->orWhere('description', 'like', "%{$searchTerm}%")
                    ->orWhereHas('requester', function ($reqQuery) use ($searchTerm) {
                        $reqQuery->where('name', 'like', "%{$searchTerm}%")
                            ->orWhere('email', 'like', "%{$searchTerm}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (! empty($filters['priority'])) {
            if (is_array($filters['priority'])) {
                $query->whereIn('priority', $filters['priority']);
            } else {
                $query->where('priority', $filters['priority']);
            }
        }

        if (! empty($filters['team'])) {
            $query->where('assigned_team_id', $filters['team']);
        }

        if (! empty($filters['agent'])) {
            $query->where('assigned_agent_id', $filters['agent']);
        }

        if (! empty($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }

        if (! empty($filters['project'])) {
            $query->where('project_id', $filters['project']);
        }

        if (! empty($filters['requester'])) {
            $query->where('requester_id', $filters['requester']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (! empty($filters['sla_breached'])) {
            $query->where(function ($q) {
                $q->where('response_sla_breached', true)
                    ->orWhere('resolution_sla_breached', true);
            });
        }

        if (! empty($filters['tags'])) {
            $tagIds = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
            $query->whereHas('tags', function ($tagQuery) use ($tagIds) {
                $tagQuery->whereIn('tags.id', $tagIds);
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        $filename = 'tickets_export_'.date('Y-m-d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($tickets) {
            $file = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($file, [
                'Ticket Number',
                'Subject',
                'Description',
                'Status',
                'Priority',
                'Source',
                'Requester',
                'Assigned Team',
                'Assigned Agent',
                'Category',
                'Project',
                'SLA Policy',
                'Tags',
                'Created At',
                'Updated At',
                'Resolved At',
                'Closed At',
            ]);

            // Add data rows
            foreach ($tickets as $ticket) {
                fputcsv($file, [
                    $ticket->ticket_number,
                    $ticket->subject,
                    $ticket->description,
                    ucfirst($ticket->status),
                    ucfirst($ticket->priority),
                    ucfirst($ticket->source),
                    $ticket->requester?->name ?? '',
                    $ticket->assignedTeam?->name ?? '',
                    $ticket->assignedAgent?->name ?? '',
                    $ticket->category?->name ?? '',
                    $ticket->project?->name ?? '',
                    $ticket->slaPolicy?->name ?? '',
                    $ticket->tags->pluck('name')->join(', '),
                    $ticket->created_at->format('Y-m-d H:i:s'),
                    $ticket->updated_at->format('Y-m-d H:i:s'),
                    $ticket->resolved_at?->format('Y-m-d H:i:s') ?? '',
                    $ticket->closed_at?->format('Y-m-d H:i:s') ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Show rejected tickets
     * Visibility rules:
     * - Requester: Can see their own rejected tickets
     * - Manager/Admin: Can see all rejected tickets
     * - Agent: Can see rejected tickets assigned to them or their team
     */
    public function rejected(Request $request): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403, 'You do not have permission to view tickets.');

        $user = Auth::user();

        $query = Ticket::with([
            'requester:id,name',
            'category:id,name',
            'assignedTeam:id,name',
            'approvals' => function ($q) {
                $q->where('status', 'rejected')
                    ->orderBy('rejected_at', 'desc')
                    ->limit(1)
                    ->with('approver:id,name');
            },
        ])
            ->whereHas('approvals', function ($query) {
                $query->where('status', 'rejected');
            });

        // Apply visibility filters based on user role
        // Admin/Manager can see all rejected tickets
        if (! $user->can('tickets.assign')) {
            // Regular users (Requester/Agent) can only see:
            // 1. Tickets they created (requester)
            // 2. Tickets assigned to them (agent)
            // 3. Tickets assigned to their team (agent)
            $query->where(function ($q) use ($user) {
                $q->where('requester_id', $user->id) // Own tickets
                    ->orWhere('assigned_agent_id', $user->id) // Assigned to them
                    ->orWhereHas('assignedTeam', function ($teamQuery) use ($user) {
                        // Tickets in their department/team
                        if ($user->department_id) {
                            $teamQuery->where('id', $user->department_id);
                        }
                    });
            });
        }

        $tickets = $query
            ->orderBy('updated_at', 'desc')
            ->paginate(20)
            ->through(fn ($ticket) => TicketResource::make($ticket)->resolve());

        return Inertia::render('Admin/Tickets/RejectedTickets', [
            'tickets' => $tickets,
        ]);
    }

    /**
     * Resubmit a rejected ticket
     */
    public function resubmit(Ticket $ticket): RedirectResponse
    {
        $this->authorize('resubmit', $ticket);

        try {
            $approvalService = app(\App\Services\ApprovalWorkflowService::class);
            $approvalService->resubmit($ticket);

            return redirect()
                ->route('admin.tickets.show', $ticket)
                ->with('success', 'Ticket resubmitted successfully. A new approval request has been created.');
        } catch (\Exception $e) {
            \Log::error('Failed to resubmit ticket', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->back()
                ->with('error', 'Failed to resubmit ticket: '.$e->getMessage());
        }
    }

    /**
     * Check if user can view a specific ticket
     *
     * Visibility Rules:
     * - Admin/Manager with tickets.assign: Can see ALL tickets
     * - Manager without tickets.assign: Can see tickets in their department
     * - Agent: Can see tickets assigned to them or their team
     * - Requester: Can see tickets they created or are watching
     */
    protected function canUserViewTicket(\App\Models\User $user, Ticket $ticket): bool
    {
        // Admins and Managers with assign permission can see all tickets
        if ($user->can('tickets.assign')) {
            return true;
        }

        // Check if user is the requester
        if ($ticket->requester_id === $user->id) {
            return true;
        }

        if ($ticket->approvals()->where('status', 'pending')->exists()) {
            return $ticket->approvals()
                ->where('approver_id', $user->id)
                ->exists();
        }

        // Check if user is the assigned agent
        if ($ticket->assigned_agent_id === $user->id) {
            return true;
        }

        // Check if ticket is assigned to user's team/department
        // Only Agents and Managers can see tickets assigned to their team
        // Requesters can only see tickets they created or are watching
        if ($ticket->assigned_team_id && $user->department_id === $ticket->assigned_team_id) {
            // Allow if user is an Agent, Senior Agent, or Manager
            if ($user->hasAnyRole(array_merge(RoleConstants::getAgentRoles(), [RoleConstants::MANAGER]))) {
                return true;
            }
        }

        // Check if user is watching the ticket
        if ($ticket->watchers()->where('users.id', $user->id)->exists()) {
            return true;
        }

        // For managers: can see tickets in their department (even if not assigned)
        // Check if user has Manager role using Spatie's HasRoles trait
        if ($user->hasRole(RoleConstants::MANAGER) && $user->department_id) {
            if ($ticket->assignedTeam && $ticket->assignedTeam->id === $user->department_id) {
                return true;
            }
        }

        return false;
    }
}
