<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Department;
use App\Models\Project;
use App\Models\SlaPolicy;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class TicketController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only([
            'q',
            'status',
            'priority',
            'team',
            'agent',
            'category',
            'project',
            'requester',
        ]);

        $tickets = Ticket::query()
            ->with([
                'requester:id,name',
                'assignedTeam:id,name',
                'assignedAgent:id,name',
                'category:id,name',
                'project:id,name,code',
                'slaPolicy:id,name',
                'tags:id,name,color',
            ])
            ->filter($filters)
            ->latest()
            ->paginate(15)
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
        return Inertia::render('Admin/Tickets/Form', [
            'ticket' => null,
            'formOptions' => $this->formOptions(),
        ]);
    }

    public function store(TicketRequest $request): RedirectResponse
    {
        $data = $this->preparePayload($request->validated());

        $ticket = Ticket::create($data);

        $this->syncRelations($ticket, $request->validated());

        return redirect()
            ->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket created successfully.');
    }

    public function show(Ticket $ticket): Response
    {
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
        ]);

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => TicketResource::make($ticket),
        ]);
    }

    public function edit(Ticket $ticket): Response
    {
        $ticket->load([
            'requester:id,name',
            'assignedTeam:id,name',
            'assignedAgent:id,name',
            'category:id,name',
            'project:id,name',
            'slaPolicy:id,name',
            'tags:id,name,color',
            'watchers:id,name',
        ]);

        return Inertia::render('Admin/Tickets/Form', [
            'ticket' => TicketResource::make($ticket),
            'formOptions' => $this->formOptions(),
        ]);
    }

    public function update(TicketRequest $request, Ticket $ticket): RedirectResponse
    {
        $data = $this->preparePayload($request->validated(), $ticket);

        $ticket->update($data);

        $this->syncRelations($ticket, $request->validated());

        return redirect()
            ->route('admin.tickets.show', $ticket)
            ->with('success', 'Ticket updated successfully.');
    }

    public function destroy(Ticket $ticket): RedirectResponse
    {
        $ticket->delete();

        return redirect()
            ->route('admin.tickets.index')
            ->with('success', 'Ticket deleted.');
    }

    protected function preparePayload(array $data, ?Ticket $ticket = null): array
    {
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
        ];
    }
}


