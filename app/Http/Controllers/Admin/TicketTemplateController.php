<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TicketTemplateRequest;
use App\Models\TicketTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class TicketTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'is_active']);

        $templates = TicketTemplate::query()
            ->with('creator:id,name')
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->forUser(Auth::id())
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($template) => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'description' => $template->description,
                'usage_count' => $template->usage_count,
                'is_active' => $template->is_active,
                'is_public' => $template->is_public,
                'creator' => $template->creator ? [
                    'id' => $template->creator->id,
                    'name' => $template->creator->name,
                ] : null,
                'created_at' => $template->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/TicketTemplates/Index', [
            'templates' => $templates,
            'filters' => $filters,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/TicketTemplates/Form', [
            'template' => null,
            'formOptions' => $this->getFormOptions(),
        ]);
    }

    public function store(TicketTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by'] = Auth::id();
        
        TicketTemplate::create($data);

        return redirect()
            ->route('admin.ticket-templates.index')
            ->with('success', 'Ticket template created successfully.');
    }

    public function edit(TicketTemplate $ticketTemplate): Response
    {
        return Inertia::render('Admin/TicketTemplates/Form', [
            'template' => [
                'id' => $ticketTemplate->id,
                'name' => $ticketTemplate->name,
                'slug' => $ticketTemplate->slug,
                'description' => $ticketTemplate->description,
                'template_data' => $ticketTemplate->template_data ?? [],
                'is_active' => $ticketTemplate->is_active,
                'is_public' => $ticketTemplate->is_public,
            ],
            'formOptions' => $this->getFormOptions(),
        ]);
    }

    public function update(TicketTemplateRequest $request, TicketTemplate $ticketTemplate): RedirectResponse
    {
        $ticketTemplate->update($request->validated());

        return redirect()
            ->route('admin.ticket-templates.index')
            ->with('success', 'Ticket template updated successfully.');
    }

    public function destroy(TicketTemplate $ticketTemplate): RedirectResponse
    {
        $ticketTemplate->delete();

        return redirect()
            ->route('admin.ticket-templates.index')
            ->with('success', 'Ticket template deleted successfully.');
    }

    /**
     * Get template data for applying to ticket form
     */
    public function getTemplateData(TicketTemplate $ticketTemplate): \Illuminate\Http\JsonResponse
    {
        $ticketTemplate->incrementUsage();

        return response()->json([
            'data' => $ticketTemplate->getFormData(),
        ]);
    }

    /**
     * Get all active templates for quick selection
     */
    public function getActiveTemplates(): \Illuminate\Http\JsonResponse
    {
        $templates = TicketTemplate::active()
            ->forUser(Auth::id())
            ->orderBy('usage_count', 'desc')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'usage_count'])
            ->map(fn ($template) => [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'usage_count' => $template->usage_count,
            ]);

        return response()->json(['templates' => $templates]);
    }

    protected function getFormOptions(): array
    {
        return [
            'statuses' => \App\Models\Ticket::STATUSES,
            'priorities' => \App\Models\Ticket::PRIORITIES,
            'sources' => \App\Models\Ticket::SOURCES,
            'departments' => \App\Models\Department::select('id', 'name')->orderBy('name')->get(),
            'agents' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'categories' => \App\Models\TicketCategory::select('id', 'name')->orderBy('name')->get(),
            'projects' => \App\Models\Project::select('id', 'name')->orderBy('name')->get(),
            'sla_policies' => \App\Models\SlaPolicy::select('id', 'name')->orderBy('name')->get(),
            'tags' => \App\Models\Tag::select('id', 'name', 'color')->orderBy('name')->get(),
        ];
    }
}

