<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TimeEntryRequest;
use App\Models\Ticket;
use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TimeEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'ticket_id', 'user_id', 'date_from', 'date_to', 'is_billable', 'is_approved']);

        $timeEntries = TimeEntry::query()
            ->with(['ticket:id,ticket_number,subject', 'user:id,name', 'approver:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('description', 'like', "%{$q}%")
                        ->orWhere('activity_type', 'like', "%{$q}%")
                        ->orWhereHas('ticket', function ($ticketQuery) use ($q) {
                            $ticketQuery->where('ticket_number', 'like', "%{$q}%")
                                ->orWhere('subject', 'like', "%{$q}%");
                        });
                });
            })
            ->when($filters['ticket_id'] ?? null, function ($query, $ticketId) {
                $query->where('ticket_id', $ticketId);
            })
            ->when($filters['user_id'] ?? null, function ($query, $userId) {
                $query->where('user_id', $userId);
            })
            ->when($filters['date_from'] ?? null, function ($query, $dateFrom) {
                $query->where('date', '>=', $dateFrom);
            })
            ->when($filters['date_to'] ?? null, function ($query, $dateTo) {
                $query->where('date', '<=', $dateTo);
            })
            ->when(isset($filters['is_billable']), function ($query) use ($filters) {
                $query->where('is_billable', $filters['is_billable'] === '1');
            })
            ->when(isset($filters['is_approved']), function ($query) use ($filters) {
                $query->where('is_approved', $filters['is_approved'] === '1');
            })
            ->latest('date')
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($entry) => [
                'id' => $entry->id,
                'ticket' => [
                    'id' => $entry->ticket->id,
                    'ticket_number' => $entry->ticket->ticket_number,
                    'subject' => $entry->ticket->subject,
                ],
                'user' => [
                    'id' => $entry->user->id,
                    'name' => $entry->user->name,
                ],
                'date' => $entry->date->toDateString(),
                'start_time' => $entry->start_time?->format('H:i'),
                'end_time' => $entry->end_time?->format('H:i'),
                'duration_minutes' => $entry->duration_minutes,
                'formatted_duration' => $entry->formatted_duration,
                'description' => $entry->description,
                'activity_type' => $entry->activity_type,
                'is_billable' => $entry->is_billable,
                'hourly_rate' => $entry->hourly_rate,
                'amount' => $entry->amount,
                'is_approved' => $entry->is_approved,
                'approver' => $entry->approver ? [
                    'id' => $entry->approver->id,
                    'name' => $entry->approver->name,
                ] : null,
                'approved_at' => $entry->approved_at?->toDateTimeString(),
                'created_at' => $entry->created_at->toDateTimeString(),
            ]);

        // Calculate totals
        $totals = [
            'total_minutes' => TimeEntry::query()
                ->when($filters['ticket_id'] ?? null, fn ($q, $id) => $q->where('ticket_id', $id))
                ->when($filters['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
                ->when($filters['date_from'] ?? null, fn ($q, $date) => $q->where('date', '>=', $date))
                ->when($filters['date_to'] ?? null, fn ($q, $date) => $q->where('date', '<=', $date))
                ->when(isset($filters['is_billable']), fn ($q) => $q->where('is_billable', $filters['is_billable'] === '1'))
                ->when(isset($filters['is_approved']), fn ($q) => $q->where('is_approved', $filters['is_approved'] === '1'))
                ->sum('duration_minutes'),
            'total_amount' => TimeEntry::query()
                ->when($filters['ticket_id'] ?? null, fn ($q, $id) => $q->where('ticket_id', $id))
                ->when($filters['user_id'] ?? null, fn ($q, $id) => $q->where('user_id', $id))
                ->when($filters['date_from'] ?? null, fn ($q, $date) => $q->where('date', '>=', $date))
                ->when($filters['date_to'] ?? null, fn ($q, $date) => $q->where('date', '<=', $date))
                ->when(isset($filters['is_billable']), fn ($q) => $q->where('is_billable', $filters['is_billable'] === '1'))
                ->when(isset($filters['is_approved']), fn ($q) => $q->where('is_approved', $filters['is_approved'] === '1'))
                ->sum('amount') ?? 0,
        ];

        return Inertia::render('Admin/TimeEntries/Index', [
            'timeEntries' => $timeEntries,
            'filters' => $filters,
            'totals' => $totals,
            'activityTypes' => TimeEntry::ACTIVITY_TYPES,
        ]);
    }

    public function create(Request $request): Response
    {
        $ticketId = $request->get('ticket_id');

        return Inertia::render('Admin/TimeEntries/Form', [
            'timeEntry' => null,
            'ticket' => $ticketId ? Ticket::find($ticketId) : null,
            'activityTypes' => TimeEntry::ACTIVITY_TYPES,
        ]);
    }

    public function store(TimeEntryRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['user_id'] = $data['user_id'] ?? Auth::id();

        TimeEntry::create($data);

        $redirectRoute = $request->get('redirect_to') === 'ticket' && $data['ticket_id']
            ? route('admin.tickets.show', $data['ticket_id'])
            : route('admin.time-entries.index');

        return redirect($redirectRoute)
            ->with('success', 'Time entry created successfully.');
    }

    public function edit(TimeEntry $timeEntry): Response
    {
        $timeEntry->load(['ticket', 'user']);

        return Inertia::render('Admin/TimeEntries/Form', [
            'timeEntry' => [
                'id' => $timeEntry->id,
                'ticket_id' => $timeEntry->ticket_id,
                'user_id' => $timeEntry->user_id,
                'date' => $timeEntry->date->toDateString(),
                'start_time' => $timeEntry->start_time?->format('H:i'),
                'end_time' => $timeEntry->end_time?->format('H:i'),
                'duration_minutes' => $timeEntry->duration_minutes,
                'description' => $timeEntry->description,
                'activity_type' => $timeEntry->activity_type,
                'is_billable' => $timeEntry->is_billable,
                'hourly_rate' => $timeEntry->hourly_rate,
                'amount' => $timeEntry->amount,
                'is_approved' => $timeEntry->is_approved,
            ],
            'ticket' => $timeEntry->ticket,
            'activityTypes' => TimeEntry::ACTIVITY_TYPES,
        ]);
    }

    public function update(TimeEntryRequest $request, TimeEntry $timeEntry): RedirectResponse
    {
        $timeEntry->update($request->validated());

        $redirectRoute = $request->get('redirect_to') === 'ticket' && $timeEntry->ticket_id
            ? route('admin.tickets.show', $timeEntry->ticket_id)
            : route('admin.time-entries.index');

        return redirect($redirectRoute)
            ->with('success', 'Time entry updated successfully.');
    }

    public function destroy(TimeEntry $timeEntry): RedirectResponse
    {
        $ticketId = $timeEntry->ticket_id;
        $timeEntry->delete();

        $redirectRoute = request()->get('redirect_to') === 'ticket' && $ticketId
            ? route('admin.tickets.show', $ticketId)
            : route('admin.time-entries.index');

        return redirect($redirectRoute)
            ->with('success', 'Time entry deleted successfully.');
    }

    public function approve(TimeEntry $timeEntry): RedirectResponse
    {
        $timeEntry->update([
            'is_approved' => true,
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return redirect()
            ->route('admin.time-entries.index')
            ->with('success', 'Time entry approved successfully.');
    }
}

