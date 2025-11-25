<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SlaPolicyRequest;
use App\Models\SlaPolicy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SlaPolicyController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'priority', 'is_active']);

        $policies = SlaPolicy::query()
            ->withCount('tickets')
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['priority']), function ($query) use ($filters) {
                $query->where('priority', $filters['priority']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('priority', 'desc')
            ->orderBy('response_time')
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($policy) => [
                'id' => $policy->id,
                'name' => $policy->name,
                'description' => $policy->description,
                'priority' => $policy->priority,
                'response_time' => $policy->response_time,
                'resolution_time' => $policy->resolution_time,
                'is_active' => $policy->is_active,
                'tickets_count' => $policy->tickets_count,
                'created_at' => $policy->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/SlaPolicies/Index', [
            'policies' => $policies,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/SlaPolicies/Form', [
            'policy' => null,
        ]);
    }

    public function store(SlaPolicyRequest $request): RedirectResponse
    {
        SlaPolicy::create($request->validated());

        return redirect()
            ->route('admin.sla-policies.index')
            ->with('success', 'SLA policy created successfully.');
    }

    public function show(SlaPolicy $slaPolicy): Response
    {
        $slaPolicy->loadCount('tickets');
        
        // Get compliance statistics
        $totalTickets = $slaPolicy->tickets()->count();
        $responseBreaches = $slaPolicy->tickets()->where('first_response_breached', true)->count();
        $resolutionBreaches = $slaPolicy->tickets()->where('resolution_breached', true)->count();
        
        $responseCompliance = $totalTickets > 0 
            ? round((($totalTickets - $responseBreaches) / $totalTickets) * 100, 2)
            : 100;
        
        $resolutionCompliance = $totalTickets > 0
            ? round((($totalTickets - $resolutionBreaches) / $totalTickets) * 100, 2)
            : 100;

        return Inertia::render('Admin/SlaPolicies/Show', [
            'policy' => [
                'id' => $slaPolicy->id,
                'name' => $slaPolicy->name,
                'description' => $slaPolicy->description,
                'priority' => $slaPolicy->priority,
                'response_time' => $slaPolicy->response_time,
                'resolution_time' => $slaPolicy->resolution_time,
                'is_active' => $slaPolicy->is_active,
                'tickets_count' => $slaPolicy->tickets_count,
                'response_compliance' => $responseCompliance,
                'resolution_compliance' => $resolutionCompliance,
                'response_breaches' => $responseBreaches,
                'resolution_breaches' => $resolutionBreaches,
                'created_at' => $slaPolicy->created_at->toDateTimeString(),
            ],
        ]);
    }

    public function edit(SlaPolicy $slaPolicy): Response
    {
        return Inertia::render('Admin/SlaPolicies/Form', [
            'policy' => [
                'id' => $slaPolicy->id,
                'name' => $slaPolicy->name,
                'description' => $slaPolicy->description,
                'priority' => $slaPolicy->priority,
                'response_time' => $slaPolicy->response_time,
                'resolution_time' => $slaPolicy->resolution_time,
                'is_active' => $slaPolicy->is_active,
            ],
        ]);
    }

    public function update(SlaPolicyRequest $request, SlaPolicy $slaPolicy): RedirectResponse
    {
        $slaPolicy->update($request->validated());

        return redirect()
            ->route('admin.sla-policies.index')
            ->with('success', 'SLA policy updated successfully.');
    }

    public function destroy(SlaPolicy $slaPolicy): RedirectResponse
    {
        // Check if policy has tickets
        if ($slaPolicy->tickets()->count() > 0) {
            return redirect()
                ->route('admin.sla-policies.index')
                ->with('error', 'Cannot delete SLA policy with assigned tickets.');
        }

        $slaPolicy->delete();

        return redirect()
            ->route('admin.sla-policies.index')
            ->with('success', 'SLA policy deleted successfully.');
    }
}

