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
        abort_unless(Auth::user()->can('tickets.view'), 403);

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

        // Use optimized search service
        $searchService = app(SearchService::class);
        $tickets = $searchService->searchTickets($filters, 15)
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
        abort_unless(Auth::user()->can('tickets.create'), 403);

        return Inertia::render('Admin/Tickets/Form', [
            'ticket' => null,
            'formOptions' => $this->formOptions(),
        ]);
    }

    public function store(TicketRequest $request): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.create'), 403);

        $data = $this->preparePayload($request->validated());

        $ticket = Ticket::create($data);

        $this->syncRelations($ticket, $request->validated());

        // Execute automation rules
        $automationService = app(AutomationService::class);
        $automationService->onTicketCreated($ticket);

        // Send notifications
        $notificationService = app(NotificationService::class);
        $notificationService->notifyTicketCreated($ticket);

        // Clear search cache
        app(SearchService::class)->clearCache();

        return redirect()
            ->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.view'), 403);

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
            'attachments.uploader',
            'histories.user',
            'customFieldValues.customField',
        ]);

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => TicketResource::make($ticket),
        ]);
    }

    public function edit(Ticket $ticket): Response
    {
        abort_unless(Auth::user()->can('tickets.edit'), 403);

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
        abort_unless(Auth::user()->can('tickets.edit'), 403);

        $originalData = $ticket->getOriginal();
        $data = $this->preparePayload($request->validated(), $ticket);

        // Track changes
        $changes = [];
        foreach ($data as $key => $value) {
            if (isset($originalData[$key]) && $originalData[$key] != $value) {
                $changes[$key] = [
                    'old' => $originalData[$key],
                    'new' => $value,
                ];
            }
        }

        $statusChanged = isset($changes['status']);
        
        $ticket->update($data);

        $this->syncRelations($ticket, $request->validated());

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
        if (!empty($changes)) {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyTicketUpdated($ticket, Auth::user(), $changes);

            // Check if ticket was resolved
            if (isset($changes['status']) && $changes['status']['new'] === 'resolved') {
                $notificationService->notifyTicketResolved($ticket, Auth::user());
            }
        }

        // Clear search cache
        app(SearchService::class)->clearCache();

        return redirect()
            ->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.delete'), 403);

        $ticket->delete();

        return redirect()
            ->route('admin.tickets.index')
            ->with('success', 'Ticket deleted.');
    }

    public function bulkUpdate(Request $request): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.edit'), 403);

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

        foreach ($tickets as $ticket) {
            $changed = false;

            switch ($action) {
                case 'status':
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
                    }
                    break;

                case 'assign_agent':
                    $agent = User::find($value);
                    if ($agent) {
                        $oldAgent = $ticket->assigned_agent_id;
                        $ticket->assigned_agent_id = $value;
                        $ticket->assigned_team_id = null; // Clear team assignment when assigning agent
                        $ticket->save();
                        $changed = true;

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

                        // Send notification
                        $notificationService = app(NotificationService::class);
                        $notificationService->notifyAgent(
                            $ticket,
                            'ticket_assigned',
                            'Ticket Assigned',
                            "You have been assigned to ticket {$ticket->ticket_number}: {$ticket->subject}"
                        );
                    }
                    break;

                case 'assign_team':
                    $team = Department::find($value);
                    if ($team) {
                        $oldTeam = $ticket->assigned_team_id;
                        $ticket->assigned_team_id = $value;
                        $ticket->assigned_agent_id = null; // Clear agent assignment when assigning team
                        $ticket->save();
                        $changed = true;

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

        $message = $updatedCount > 0
            ? "Successfully updated {$updatedCount} ticket(s)."
            : "No tickets were updated.";

        return redirect()
            ->route('admin.tickets.index')
            ->with('success', $message);
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.delete'), 403);

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

        return Arr::except($data, ['tag_ids', 'watcher_ids']);
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

    protected function filterOptions(): array
    {
        return [
            'statuses' => Ticket::STATUSES,
            'priorities' => Ticket::PRIORITIES,
            'teams' => Department::select('id', 'name')->orderBy('name')->get(),
            'agents' => User::select('id', 'name')->orderBy('name')->get(),
            'categories' => TicketCategory::select('id', 'name')->orderBy('name')->get(),
            'projects' => Project::select('id', 'name')->orderBy('name')->get(),
            'requesters' => User::select('id', 'name')->orderBy('name')->get(),
            'tags' => Tag::select('id', 'name', 'color')->orderBy('name')->get(),
        ];
    }

    protected function formOptions(): array
    {
        return [
            'statuses' => Ticket::STATUSES,
            'priorities' => Ticket::PRIORITIES,
            'sources' => Ticket::SOURCES,
            'departments' => Department::select('id', 'name')->orderBy('name')->get(),
            'agents' => User::select('id', 'name')->orderBy('name')->get(),
            'categories' => TicketCategory::select('id', 'name')->orderBy('name')->get(),
            'projects' => Project::select('id', 'name')->orderBy('name')->get(),
            'requesters' => User::select('id', 'name')->orderBy('name')->get(),
            'sla_policies' => SlaPolicy::select('id', 'name')->orderBy('name')->get(),
            'tags' => Tag::select('id', 'name', 'color')->orderBy('name')->get(),
            'customFields' => CustomField::active()->ordered()->get()->map(fn ($field) => [
                'id' => $field->id,
                'name' => $field->name,
                'label' => $field->label,
                'field_type' => $field->field_type,
                'options' => $field->options ?? [],
                'default_value' => $field->default_value,
                'is_required' => $field->is_required,
                'placeholder' => $field->placeholder,
                'help_text' => $field->help_text,
            ]),
        ];
    }
}


