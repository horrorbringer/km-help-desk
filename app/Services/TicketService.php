<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TicketService
{
    protected AutomationService $automationService;
    protected EscalationService $escalationService;
    protected NotificationService $notificationService;
    protected SearchService $searchService;

    public function __construct(
        AutomationService $automationService,
        EscalationService $escalationService,
        NotificationService $notificationService,
        SearchService $searchService
    ) {
        $this->automationService = $automationService;
        $this->escalationService = $escalationService;
        $this->notificationService = $notificationService;
        $this->searchService = $searchService;
    }

    /**
     * Update a ticket and handle all associated business logic (history, notifications, automation).
     */
    public function updateTicket(Ticket $ticket, array $data, User $actor, bool $isPickingTicket = false): Ticket
    {
        $originalData = $ticket->getOriginal();
        
        // Handle agent picking ticket - keep team assignment
        if (isset($data['assigned_agent_id']) && $data['assigned_agent_id'] == $actor->id && !$actor->can('tickets.assign')) {
            if ($ticket->assigned_team_id && $ticket->assigned_team_id == $actor->department_id) {
                if (!isset($data['assigned_team_id'])) {
                    $data['assigned_team_id'] = $ticket->assigned_team_id;
                }
            }
        }

        // Track changes before updating
        $changes = $this->calculateChanges($originalData, $data);
        $statusChanged = isset($changes['status']);

        // Update the ticket
        $ticket->update($data);

        // Record history for changes
        $this->recordHistory($ticket, $changes, $actor);

        // For simple pick operations, skip heavy operations
        if ($isPickingTicket) {
            return $ticket;
        }

        // Refresh ticket to ensure all relationships are loaded
        $ticket->refresh();
        $ticket->load(['requester', 'assignedAgent', 'assignedTeam', 'category', 'project']);

        // Execute automations
        $this->automationService->onTicketUpdated($ticket);
        if ($statusChanged) {
            $this->automationService->onTicketStatusChanged($ticket);
            
            // Set resolved/closed timestamps if needed
            $newStatus = strtolower(trim((string) $data['status']));
            if ($newStatus === Ticket::STATUS_RESOLVED && !$ticket->resolved_at) {
                $ticket->resolved_at = now();
                $ticket->saveQuietly();
            } elseif ($newStatus === Ticket::STATUS_CLOSED && !$ticket->closed_at) {
                $ticket->closed_at = now();
                $ticket->saveQuietly();
            }
        }

        // Check for escalation
        $this->escalationService->checkTicket($ticket);

        // Send notifications
        $this->sendUpdateNotifications($ticket, $changes, $actor, $statusChanged);

        // Clear search cache
        $this->searchService->clearCache();

        return $ticket;
    }

    /**
     * Calculate what changed between original data and new data.
     */
    protected function calculateChanges(array $originalData, array $newData): array
    {
        $changes = [];
        foreach ($newData as $key => $value) {
            if (is_array($value)) continue;
            
            $oldValue = $originalData[$key] ?? null;
            $newValue = $value;
            
            if (($oldValue === null || $oldValue === '') && ($newValue === null || $newValue === '')) continue;
            
            $oldNormalized = $oldValue === null ? null : (string) $oldValue;
            $newNormalized = $newValue === null ? null : (string) $newValue;
            
            if ($oldNormalized !== $newNormalized) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $newValue,
                ];
            }
        }
        return $changes;
    }

    /**
     * Record history logic.
     */
    protected function recordHistory(Ticket $ticket, array $changes, User $actor): void
    {
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

            $oldValue = $this->formatHistoryValue($field, $change['old']);
            $newValue = $this->formatHistoryValue($field, $change['new']);

            $ticket->histories()->create([
                'user_id' => $actor->id,
                'action' => $action,
                'field_name' => $field,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'description' => ucfirst(str_replace('_', ' ', $field)) . " changed from {$oldValue} to {$newValue}",
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Format values for history descriptons.
     */
    protected function formatHistoryValue(string $field, $value): string
    {
        if ($value === null || $value === '') return '—';

        return match($field) {
            'assigned_agent_id' => User::find($value)?->name ?? $value,
            'assigned_team_id' => Department::find($value)?->name ?? $value,
            'category_id' => \App\Models\TicketCategory::find($value)?->name ?? $value,
            'sla_policy_id' => \App\Models\SlaPolicy::find($value)?->name ?? $value,
            'status' => ucfirst($value),
            'priority' => ucfirst($value),
            default => (string) $value,
        };
    }

    /**
     * Send update notifications base on the array of changes.
     */
    protected function sendUpdateNotifications(Ticket $ticket, array $changes, User $actor, bool $statusChanged): void
    {
        if (empty($changes)) return;

        try {
            // Check assignment notifications
            if (isset($changes['assigned_agent_id'])) {
                $oldAgent = $changes['assigned_agent_id']['old'];
                $newAgent = $changes['assigned_agent_id']['new'];
                
                if ($newAgent && $oldAgent != $newAgent) {
                    $this->notificationService->notifyTicketAssigned($ticket);
                }
                
                // Specific old agent reassignment notice
                if ($oldAgent && $oldAgent != $newAgent && $newAgent) {
                    $oldAgentUser = User::find($oldAgent);
                    if ($oldAgentUser) {
                        $this->notificationService->create(
                            $oldAgentUser->id,
                            'ticket_reassigned',
                            'Ticket Reassigned',
                            "Ticket #{$ticket->ticket_number} has been reassigned from you.",
                            $ticket->id
                        );
                    }
                }
            } elseif (isset($changes['assigned_team_id'])) {
                $oldTeam = $changes['assigned_team_id']['old'];
                $newTeam = $changes['assigned_team_id']['new'];
                if ($newTeam && $oldTeam != $newTeam) {
                    $this->notificationService->notifyTicketAssigned($ticket);
                }
            }

            // General update notification
            $this->notificationService->notifyTicketUpdated($ticket, $actor, $changes);

            // Status specific notifications
            if ($statusChanged) {
                $newStatus = strtolower(trim((string) $ticket->status));
                if ($newStatus === Ticket::STATUS_RESOLVED) {
                    $this->notificationService->notifyTicketResolved($ticket, $actor);
                }
                if ($newStatus === Ticket::STATUS_CLOSED) {
                    $this->notificationService->notifyTicketClosed($ticket, $actor);
                }
            }
        } catch (\Exception $e) {
            Log::error('TicketService - Notification error', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }
}