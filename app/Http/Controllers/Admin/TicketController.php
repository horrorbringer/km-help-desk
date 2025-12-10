<?php

namespace App\Http\Controllers\Admin;

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
        $tickets = $searchService->searchTickets($filters, 15, Auth::user())
            ->withQueryString()
            ->through(fn ($ticket) => TicketResource::make($ticket)->resolve());

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => $filters,
            'options' => $this->filterOptions(),
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

            // Execute automation rules (wrap in try-catch to prevent failures from blocking ticket creation)
            try {
                $automationService = app(AutomationService::class);
                $automationService->onTicketCreated($ticket);
            } catch (\Exception $e) {
                \Log::warning('Automation service failed on ticket creation', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Initialize approval workflow (wrap in try-catch to prevent failures from blocking ticket creation)
            try {
                $approvalService = app(\App\Services\ApprovalWorkflowService::class);
                $approvalService->initializeWorkflow($ticket);
            } catch (\Exception $e) {
                \Log::warning('Approval workflow service failed on ticket creation', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Send notifications (wrap in try-catch to prevent failures from blocking ticket creation)
            try {
                \Log::info('TicketController::store - Calling notification service', [
                    'ticket_id' => $ticket->id,
                    'assigned_agent_id' => $ticket->assigned_agent_id,
                    'assigned_team_id' => $ticket->assigned_team_id,
                ]);
                $notificationService = app(NotificationService::class);
                $notificationService->notifyTicketCreated($ticket);
                
                // If ticket was created with an assigned agent, also send assignment notification
                if ($ticket->assigned_agent_id) {
                    \Log::info('TicketController::store - Ticket created with assigned agent, calling notifyTicketAssigned', [
                        'ticket_id' => $ticket->id,
                        'assigned_agent_id' => $ticket->assigned_agent_id,
                    ]);
                    $notificationService->notifyTicketAssigned($ticket);
                }
            } catch (\Exception $e) {
                \Log::error('Notification service failed on ticket creation', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }

            // Clear search cache (wrap in try-catch to prevent failures from blocking ticket creation)
            try {
                app(SearchService::class)->clearCache();
            } catch (\Exception $e) {
                \Log::warning('Search service failed to clear cache', [
                    'error' => $e->getMessage(),
                ]);
            }

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
                ->with('error', 'Failed to create ticket: ' . $e->getMessage());
        }
    }

    public function show(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403, 'You do not have permission to view tickets.');

        $user = Auth::user();
        
        // Apply visibility check for all tickets (not just rejected)
        $canView = $this->canUserViewTicket($user, $ticket);
        
        if (!$canView) {
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

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => TicketResource::make($ticket),
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function edit(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.edit'), 403, 'You do not have permission to edit tickets.');

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
        abort_unless(Auth::user()->can('tickets.edit'), 403, 'You do not have permission to edit tickets.');

        $originalData = $ticket->getOriginal();
        $data = $this->preparePayload($request->validated(), $ticket);
        
        // Check if user is trying to change status and has permission
        if (isset($data['status']) && $data['status'] !== $originalData['status']) {
            if (!$this->canUserChangeStatus(Auth::user(), $ticket)) {
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
        
        // Debug: Log status field specifically
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

        $statusChanged = isset($changes['status']);
        
        $ticket->update($data);

        $this->syncRelations($ticket, $request->validated());
        
        // Refresh ticket to ensure all relationships are loaded for notifications
        $ticket->refresh();
        $ticket->load(['requester', 'assignedAgent', 'assignedTeam', 'category', 'project']);

        // Record history for changes
        foreach ($changes as $field => $change) {
            $action = match($field) {
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
                'description' => ucfirst(str_replace('_', ' ', $field)) . " changed from {$oldValue} to {$newValue}",
                'created_at' => now(),
            ]);
        }

        // Execute automation rules
        $automationService = app(AutomationService::class);
        $automationService->onTicketUpdated($ticket);
        
        if ($statusChanged) {
            $automationService->onTicketStatusChanged($ticket);
        }

        // Check for escalation
        $escalationService = app(EscalationService::class);
        $escalationService->checkTicket($ticket);

        // Send notifications if there were changes
        \Log::info('TicketController::update - Checking for notifications', [
            'ticket_id' => $ticket->id,
            'changes_count' => count($changes),
            'changes_keys' => array_keys($changes),
        ]);
        
        if (!empty($changes)) {
            try {
                $notificationService = app(NotificationService::class);
                
                \Log::info('TicketController::update - Calling notification service', [
                    'ticket_id' => $ticket->id,
                ]);
                
                // Check if ticket was assigned (agent or team)
                // Only send assignment email if:
                // 1. New assignment (old was null/empty, new is not null)
                // 2. Reassignment (old was not null, new is different and not null)
                if (isset($changes['assigned_agent_id'])) {
                    $oldAgent = $changes['assigned_agent_id']['old'];
                    $newAgent = $changes['assigned_agent_id']['new'];
                    \Log::info('TicketController::update - Assignment change detected', [
                        'ticket_id' => $ticket->id,
                        'old_agent' => $oldAgent,
                        'new_agent' => $newAgent,
                    ]);
                    // Only notify if there's a new assignment (not unassigning)
                    if ($newAgent && $oldAgent != $newAgent) {
                        \Log::info('TicketController::update - Calling notifyTicketAssigned', [
                            'ticket_id' => $ticket->id,
                        ]);
                        $notificationService->notifyTicketAssigned($ticket);
                    }
                } elseif (isset($changes['assigned_team_id'])) {
                    $oldTeam = $changes['assigned_team_id']['old'];
                    $newTeam = $changes['assigned_team_id']['new'];
                    \Log::info('TicketController::update - Team assignment change detected', [
                        'ticket_id' => $ticket->id,
                        'old_team' => $oldTeam,
                        'new_team' => $newTeam,
                    ]);
                    // Only notify if there's a new assignment (not unassigning)
                    if ($newTeam && $oldTeam != $newTeam) {
                        \Log::info('TicketController::update - Calling notifyTicketAssigned for team', [
                            'ticket_id' => $ticket->id,
                        ]);
                        $notificationService->notifyTicketAssigned($ticket);
                    }
                }
                
                \Log::info('TicketController::update - Calling notifyTicketUpdated', [
                    'ticket_id' => $ticket->id,
                ]);
                $notificationService->notifyTicketUpdated($ticket, Auth::user(), $changes);

                // Check if ticket was resolved or closed
                // Also check the ticket's current status after update (in case changes array missed it)
                $currentStatus = strtolower(trim((string) $ticket->status));
                
                if (isset($changes['status'])) {
                    $oldStatus = $changes['status']['old'] ?? null;
                    $newStatus = trim((string) $changes['status']['new']);
                    \Log::info('TicketController::update - Status change detected', [
                        'ticket_id' => $ticket->id,
                        'old_status' => $oldStatus,
                        'new_status' => $newStatus,
                        'current_status' => $ticket->status,
                        'status_is_resolved' => (strtolower($newStatus) === 'resolved'),
                        'status_is_closed' => (strtolower($newStatus) === 'closed'),
                    ]);
                    
                    // Check if ticket was resolved (use case-insensitive comparison to be safe)
                    if (strtolower($newStatus) === 'resolved') {
                        \Log::info('TicketController::update - Calling notifyTicketResolved', [
                            'ticket_id' => $ticket->id,
                            'new_status' => $newStatus,
                        ]);
                        $notificationService->notifyTicketResolved($ticket, Auth::user());
                    }
                    
                    // Check if ticket was closed (use case-insensitive comparison to be safe)
                    if (strtolower($newStatus) === 'closed') {
                        \Log::info('TicketController::update - Calling notifyTicketClosed', [
                            'ticket_id' => $ticket->id,
                            'new_status' => $newStatus,
                        ]);
                        $notificationService->notifyTicketClosed($ticket, Auth::user());
                    }
                } else {
                    // Fallback: Check current status even if not in changes array
                    // This handles cases where status might have been set differently
                    \Log::info('TicketController::update - No status in changes, checking current status', [
                        'ticket_id' => $ticket->id,
                        'current_status' => $ticket->status,
                    ]);
                    
                    if ($currentStatus === 'resolved') {
                        \Log::info('TicketController::update - Current status is resolved, calling notifyTicketResolved', [
                            'ticket_id' => $ticket->id,
                        ]);
                        $notificationService->notifyTicketResolved($ticket, Auth::user());
                    }
                    
                    if ($currentStatus === 'closed') {
                        \Log::info('TicketController::update - Current status is closed, calling notifyTicketClosed', [
                            'ticket_id' => $ticket->id,
                        ]);
                        $notificationService->notifyTicketClosed($ticket, Auth::user());
                    }
                }
            } catch (\Exception $e) {
                \Log::error('TicketController::update - Notification error', [
                    'ticket_id' => $ticket->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        } else {
            \Log::info('TicketController::update - No changes detected, skipping notifications', [
                'ticket_id' => $ticket->id,
            ]);
        }

        // Clear search cache
        app(SearchService::class)->clearCache();

        return redirect()
            ->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
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
        abort_unless(Auth::user()->can('tickets.edit'), 403, 'You do not have permission to edit tickets.');

        $request->validate([
            'ticket_ids' => ['required', 'array', 'min:1'],
            'ticket_ids.*' => ['exists:tickets,id'],
            'action' => ['required', 'string', 'in:status,priority,assign_agent,assign_team,add_tags,remove_tags'],
            'value' => ['required'],
        ]);

        $ticketIds = $request->input('ticket_ids');
        $action = $request->input('action');
        $value = $request->input('value');

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

            switch ($action) {
                case 'status':
                    // Check if user can change status for this ticket
                    if (!$this->canUserChangeStatus(Auth::user(), $ticket)) {
                        \Log::warning('TicketController::bulkUpdate - User attempted to change status without permission', [
                            'ticket_id' => $ticket->id,
                            'ticket_number' => $ticket->ticket_number,
                            'user_id' => Auth::id(),
                            'assigned_agent_id' => $ticket->assigned_agent_id,
                            'assigned_team_id' => $ticket->assigned_team_id,
                        ]);
                        $failedCount++;
                        $failedMessages[] = "Ticket #{$ticket->ticket_number}: You can only change the status of tickets assigned to you or your team. Managers and admins can change any ticket status.";
                        continue 2; // Skip this ticket (continue outer foreach loop)
                    }
                    
                    if (in_array($value, Ticket::STATUSES)) {
                        $oldStatus = $ticket->status;
                        $ticket->status = $value;
                        
                        // Update resolved_at or closed_at based on status
                        if ($value === 'resolved' && !$ticket->resolved_at) {
                            $ticket->resolved_at = now();
                        } elseif ($value === 'closed' && !$ticket->closed_at) {
                            $ticket->closed_at = now();
                        } elseif (!in_array($value, ['resolved', 'closed'])) {
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

                        // Execute automation
                        $automationService = app(AutomationService::class);
                        $automationService->onTicketStatusChanged($ticket);

                        // Send email notifications for status changes
                        try {
                            \Log::info('TicketController::bulkUpdate - Status changed, sending notifications', [
                                'ticket_id' => $ticket->id,
                                'old_status' => $oldStatus,
                                'new_status' => $value,
                            ]);

                            // Send update notification
                            $notificationService->notifyTicketUpdated($ticket, Auth::user(), [
                                'status' => [
                                    'old' => $oldStatus,
                                    'new' => $value,
                                ],
                            ]);

                            // Send resolved notification if status is resolved
                            if (strtolower($value) === 'resolved') {
                                \Log::info('TicketController::bulkUpdate - Calling notifyTicketResolved', [
                                    'ticket_id' => $ticket->id,
                                ]);
                                $notificationService->notifyTicketResolved($ticket, Auth::user());
                            }

                            // Send closed notification if status is closed
                            if (strtolower($value) === 'closed') {
                                \Log::info('TicketController::bulkUpdate - Calling notifyTicketClosed', [
                                    'ticket_id' => $ticket->id,
                                ]);
                                $notificationService->notifyTicketClosed($ticket, Auth::user());
                            }
                        } catch (\Exception $e) {
                            \Log::error('TicketController::bulkUpdate - Notification error for status change', [
                                'ticket_id' => $ticket->id,
                                'error' => $e->getMessage(),
                                'trace' => $e->getTraceAsString(),
                            ]);
                        }
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

                        // Send email notification for priority change
                        try {
                            \Log::info('TicketController::bulkUpdate - Priority changed, sending update notification', [
                                'ticket_id' => $ticket->id,
                                'old_priority' => $oldPriority,
                                'new_priority' => $value,
                            ]);
                            $notificationService->notifyTicketUpdated($ticket, Auth::user(), [
                                'priority' => [
                                    'old' => $oldPriority,
                                    'new' => $value,
                                ],
                            ]);
                        } catch (\Exception $e) {
                            \Log::error('TicketController::bulkUpdate - Notification error for priority change', [
                                'ticket_id' => $ticket->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                    break;

                case 'assign_agent':
                    // Check if user has permission to assign tickets
                    if (!Auth::user()->can('tickets.assign')) {
                        \Log::warning('TicketController::bulkUpdate - User attempted to assign ticket without permission', [
                            'ticket_id' => $ticket->id,
                            'user_id' => Auth::id(),
                            'action' => 'assign_agent',
                        ]);
                        $failedCount++;
                        $failedMessages[] = "Ticket #{$ticket->ticket_number}: You don't have permission to assign tickets. Only managers and admins can reassign tickets.";
                        continue 2; // Skip this ticket (continue outer foreach loop)
                    }
                    
                    $agent = User::find($value);
                    if ($agent) {
                        $oldAgent = $ticket->assigned_agent_id;
                        
                        // Restriction: Agents without tickets.assign can only pick unassigned tickets or reassign their own tickets
                        // Managers/Admins with tickets.assign can reassign any ticket
                        // Note: We already checked tickets.assign permission above, so if we reach here, user has permission
                        // But we can add additional logic for agents who might have edit but not assign permission
                        // Actually, since we already checked tickets.assign above, all users here have assign permission
                        // So no additional restriction needed - managers/admins can reassign any ticket
                        
                        // If reassigning to a different agent, notify the old agent
                        $shouldNotifyOldAgent = $oldAgent && $oldAgent != $value && $value;
                        
                        $ticket->assigned_agent_id = $value;
                        $ticket->assigned_team_id = null; // Clear team assignment when assigning agent
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

                        // Send email notification for assignment
                        try {
                            \Log::info('TicketController::bulkUpdate - Agent assigned, sending notifications', [
                                'ticket_id' => $ticket->id,
                                'old_agent' => $oldAgent,
                                'new_agent' => $value,
                            ]);
                            
                            // Notify new agent
                            $notificationService->notifyTicketAssigned($ticket);
                            
                            // Notify old agent if ticket was reassigned
                            if ($shouldNotifyOldAgent) {
                                $oldAgentUser = User::find($oldAgent);
                                if ($oldAgentUser) {
                                    \Log::info('TicketController::bulkUpdate - Notifying old agent of reassignment', [
                                        'ticket_id' => $ticket->id,
                                        'old_agent_id' => $oldAgent,
                                    ]);
                                    // Create specific notification for old agent
                                    try {
                                        $notificationService->create(
                                            $oldAgentUser->id,
                                            'ticket_reassigned',
                                            'Ticket Reassigned',
                                            "Ticket #{$ticket->ticket_number} has been reassigned from you to {$agent->name}: {$ticket->subject}",
                                            $ticket->id
                                        );
                                    } catch (\Exception $e) {
                                        \Log::error('TicketController::bulkUpdate - Failed to notify old agent', [
                                            'ticket_id' => $ticket->id,
                                            'old_agent_id' => $oldAgent,
                                            'error' => $e->getMessage(),
                                        ]);
                                    }
                                }
                            }
                            
                            // Notify requester and other watchers
                            $notificationService->notifyTicketUpdated($ticket, Auth::user(), [
                                'assigned_agent_id' => [
                                    'old' => $oldAgent,
                                    'new' => $value,
                                ],
                            ]);
                        } catch (\Exception $e) {
                            \Log::error('TicketController::bulkUpdate - Notification error for agent assignment', [
                                'ticket_id' => $ticket->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                    break;

                case 'assign_team':
                    // Check if user has permission to assign tickets
                    if (!Auth::user()->can('tickets.assign')) {
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

                        // Send email notification for team assignment
                        try {
                            \Log::info('TicketController::bulkUpdate - Team assigned, sending notifications', [
                                'ticket_id' => $ticket->id,
                                'old_team' => $oldTeam,
                                'new_team' => $value,
                                'old_agent' => $oldAgent,
                            ]);
                            
                            // Notify old agent if ticket was reassigned from agent to team
                            if ($shouldNotifyOldAgent && $oldAgent) {
                                $oldAgentUser = User::find($oldAgent);
                                if ($oldAgentUser) {
                                    \Log::info('TicketController::bulkUpdate - Notifying old agent of team reassignment', [
                                        'ticket_id' => $ticket->id,
                                        'old_agent_id' => $oldAgent,
                                    ]);
                                    try {
                                        $notificationService->create(
                                            $oldAgentUser->id,
                                            'ticket_reassigned',
                                            'Ticket Reassigned to Team',
                                            "Ticket #{$ticket->ticket_number} has been reassigned from you to team {$team->name}: {$ticket->subject}",
                                            $ticket->id
                                        );
                                    } catch (\Exception $e) {
                                        \Log::error('TicketController::bulkUpdate - Failed to notify old agent of team reassignment', [
                                            'ticket_id' => $ticket->id,
                                            'old_agent_id' => $oldAgent,
                                            'error' => $e->getMessage(),
                                        ]);
                                    }
                                }
                            }
                            
                            // Notify new team
                            $notificationService->notifyTicketAssigned($ticket);
                            
                            // Notify requester and watchers
                            $notificationService->notifyTicketUpdated($ticket, Auth::user(), [
                                'assigned_team_id' => [
                                    'old' => $oldTeam,
                                    'new' => $value,
                                ],
                            ]);
                        } catch (\Exception $e) {
                            \Log::error('TicketController::bulkUpdate - Notification error for team assignment', [
                                'ticket_id' => $ticket->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                    break;

                case 'add_tags':
                    $tagIds = is_array($value) ? $value : [$value];
                    $existingTagIds = $ticket->tags()->pluck('tags.id')->toArray();
                    $newTagIds = array_diff($tagIds, $existingTagIds);
                    
                    if (!empty($newTagIds)) {
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

        // Clear search cache
        app(SearchService::class)->clearCache();

        // Build response message
        if ($failedCount > 0 && $updatedCount > 0) {
            // Some succeeded, some failed
            $message = "Successfully updated {$updatedCount} ticket(s). {$failedCount} ticket(s) could not be updated.";
            if (!empty($failedMessages)) {
                $message .= " " . implode(' ', array_slice($failedMessages, 0, 3)); // Show first 3 error messages
                if (count($failedMessages) > 3) {
                    $message .= " (and " . (count($failedMessages) - 3) . " more)";
                }
            }
            return redirect()
                ->route('admin.tickets.index')
                ->with('warning', $message)
                ->with('error_details', $failedMessages);
        } elseif ($failedCount > 0) {
            // All failed
            $message = "Failed to update {$failedCount} ticket(s).";
            if (!empty($failedMessages)) {
                $message .= " " . implode(' ', array_slice($failedMessages, 0, 2)); // Show first 2 error messages
                if (count($failedMessages) > 2) {
                    $message .= " (and " . (count($failedMessages) - 2) . " more)";
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
            $message = "No tickets were updated.";
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

        if (empty($data['ticket_number'])) {
            $data['ticket_number'] = $ticket?->ticket_number ?? Ticket::generateTicketNumber();
        }

        if (!empty($data['sla_policy_id'])) {
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
                if (!$customField) {
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
     * Check if user can change the status of a ticket
     * 
     * Rules:
     * 1. If ticket is assigned to an agent: only that agent OR managers/admins can change status
     * 2. If ticket is assigned to a team: any agent in that team OR managers/admins can change status
     * 3. If unassigned: anyone with tickets.edit can change status
     * 4. Managers/admins with tickets.assign permission can always change status
     */
    protected function canUserChangeStatus(User $user, Ticket $ticket): bool
    {
        // Managers/admins with assign permission can always change status
        if ($user->can('tickets.assign')) {
            return true;
        }
        
        // If ticket is assigned to an agent
        if ($ticket->assigned_agent_id) {
            // Only the assigned agent can change status
            return $ticket->assigned_agent_id === $user->id;
        }
        
        // If ticket is assigned to a team
        if ($ticket->assigned_team_id) {
            // Check if user is in the assigned team
            if ($user->department_id === $ticket->assigned_team_id) {
                // Check if user is an agent (has Agent or Senior Agent role)
                return $user->hasAnyRole(['Agent', 'Senior Agent']);
            }
            return false;
        }
        
        // If ticket is unassigned, anyone with tickets.edit can change status
        // (This check is already done at the controller level, so return true)
        return true;
    }

    protected function filterOptions(): array
    {
        return [
            'statuses' => Ticket::STATUSES,
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
        // These roles manage their department/team, not cross-functional teams
        $isHOD = $user->hasRole('Head of Department');
        $isLineManager = $user->hasRole('Line Manager');
        $hasCreateOnBehalfPermission = $user->can('tickets.create-on-behalf');
        
        // Filter requesters based on permission and role
        if (($isHOD || $isLineManager) && $user->department_id) {
            // HODs and Line Managers can only select users from their own department
            // This is a business rule: They manage their department/team, not cross-functional teams
            // - HOD: Manages entire department (multiple teams)
            // - Line Manager: Manages small team (5-20 people) within department
            $requesters = User::select('id', 'name')
                ->where('department_id', $user->department_id)
                ->orderBy('name')
                ->get();
            $canCreateOnBehalf = true; // Can create on behalf, but limited to their department
        } elseif ($hasCreateOnBehalfPermission) {
            // Other Managers (IT Manager, Finance Manager, etc.), Admins, CEO, Director can select ALL users
            // These roles often need to create tickets for cross-functional teams, vendors, contractors
            $requesters = User::select('id', 'name')->orderBy('name')->get();
            $canCreateOnBehalf = true;
        } else {
            // Regular users (Requesters, Agents) can only select themselves
            $requesters = collect([$user]);
            $canCreateOnBehalf = false;
        }
        
        // Filter agents: Only show users with Agent or Senior Agent roles
        $agents = User::select('users.id', 'users.name')
            ->where('users.is_active', true)
            ->whereHas('roles', function ($roleQuery) {
                $roleQuery->whereIn('name', [
                    'Agent',
                    'Senior Agent',
                ]);
            })
            ->orderBy('users.name')
            ->get();
        
        return [
            'statuses' => Ticket::STATUSES,
            'priorities' => Ticket::PRIORITIES,
            'sources' => Ticket::SOURCES,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'agents' => $agents,
            'categories' => TicketCategory::active()->select('id', 'name')->orderBy('name')->get(),
            'projects' => Project::select('id', 'name')->orderBy('name')->get(),
            'requesters' => $requesters,
            'can_create_on_behalf' => $canCreateOnBehalf,
            'is_hod' => $isHOD,
            'sla_policies' => SlaPolicy::select('id', 'name')->orderBy('name')->get(),
            'tags' => Tag::select('id', 'name', 'color')->orderBy('name')->get(),
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

        return match($field) {
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
        if (!empty($filters['q'])) {
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

        if (!empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (!empty($filters['priority'])) {
            if (is_array($filters['priority'])) {
                $query->whereIn('priority', $filters['priority']);
            } else {
                $query->where('priority', $filters['priority']);
            }
        }

        if (!empty($filters['team'])) {
            $query->where('assigned_team_id', $filters['team']);
        }

        if (!empty($filters['agent'])) {
            $query->where('assigned_agent_id', $filters['agent']);
        }

        if (!empty($filters['category'])) {
            $query->where('category_id', $filters['category']);
        }

        if (!empty($filters['project'])) {
            $query->where('project_id', $filters['project']);
        }

        if (!empty($filters['requester'])) {
            $query->where('requester_id', $filters['requester']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (!empty($filters['sla_breached'])) {
            $query->where(function ($q) {
                $q->where('response_sla_breached', true)
                    ->orWhere('resolution_sla_breached', true);
            });
        }

        if (!empty($filters['tags'])) {
            $tagIds = is_array($filters['tags']) ? $filters['tags'] : [$filters['tags']];
            $query->whereHas('tags', function ($tagQuery) use ($tagIds) {
                $tagQuery->whereIn('tags.id', $tagIds);
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        $filename = 'tickets_export_' . date('Y-m-d_His') . '.csv';

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
        if (!$user->can('tickets.assign')) {
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
        abort_unless(Auth::user()->can('tickets.edit'), 403, 'You do not have permission to edit tickets.');

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
                ->with('error', 'Failed to resubmit ticket: ' . $e->getMessage());
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
        
        // Check if user is the assigned agent
        if ($ticket->assigned_agent_id === $user->id) {
            return true;
        }
        
        // Check if ticket is assigned to user's team/department
        // Only Agents and Managers can see tickets assigned to their team
        // Requesters can only see tickets they created or are watching
        if ($ticket->assigned_team_id && $user->department_id === $ticket->assigned_team_id) {
            // Allow if user is an Agent, Senior Agent, or Manager
            if ($user->hasAnyRole(['Agent', 'Senior Agent', 'Manager'])) {
                return true;
            }
        }
        
        // Check if user is watching the ticket
        if ($ticket->watchers()->where('users.id', $user->id)->exists()) {
            return true;
        }
        
        // For managers: can see tickets in their department (even if not assigned)
        // Check if user has Manager role using Spatie's HasRoles trait
        if ($user->hasRole('Manager') && $user->department_id) {
            if ($ticket->assignedTeam && $ticket->assignedTeam->id === $user->department_id) {
                return true;
            }
        }
        
        return false;
    }
}


