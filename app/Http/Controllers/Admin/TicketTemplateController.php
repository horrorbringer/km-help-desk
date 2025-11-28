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
     * Duplicate/clone a template
     */
    public function duplicate(TicketTemplate $ticketTemplate): RedirectResponse
    {
        $newTemplate = $ticketTemplate->replicate();
        $newTemplate->name = $ticketTemplate->name . ' (Copy)';
        $newTemplate->slug = $ticketTemplate->slug . '-copy-' . time();
        $newTemplate->usage_count = 0;
        $newTemplate->created_by = Auth::id();
        $newTemplate->is_active = false; // Set to inactive by default so user can review before activating
        $newTemplate->save();

        return redirect()
            ->route('admin.ticket-templates.edit', $newTemplate)
            ->with('success', 'Template duplicated successfully. You can now edit it.');
    }

    /**
     * Create ticket from template
     */
    public function createFromTemplate(TicketTemplate $ticketTemplate): RedirectResponse
    {
        abort_unless(Auth::user()->can('tickets.create'), 403);
        
        $ticketTemplate->incrementUsage();
        
        $templateData = $this->processTemplateVariables($ticketTemplate->getFormData());

        return redirect()
            ->route('admin.tickets.create')
            ->with('template_data', $templateData)
            ->with('template_name', $ticketTemplate->name);
    }

    /**
     * Get template data for applying to ticket form
     */
    public function getTemplateData(TicketTemplate $ticketTemplate): \Illuminate\Http\JsonResponse
    {
        $ticketTemplate->incrementUsage();

        $templateData = $ticketTemplate->getFormData();
        
        // Process template variables/placeholders
        $templateData = $this->processTemplateVariables($templateData);

        return response()->json([
            'data' => $templateData,
        ]);
    }

    /**
     * Process template variables/placeholders
     */
    protected function processTemplateVariables(array $data): array
    {
        $user = Auth::user();
        $now = now();

        $variables = [
            '{date}' => $now->format('Y-m-d'),
            '{time}' => $now->format('H:i'),
            '{datetime}' => $now->format('Y-m-d H:i'),
            '{user}' => $user->name ?? 'User',
            '{user_email}' => $user->email ?? '',
            '{year}' => $now->format('Y'),
            '{month}' => $now->format('F'),
            '{day}' => $now->format('d'),
        ];

        // Process subject and description
        if (isset($data['subject'])) {
            $data['subject'] = str_replace(array_keys($variables), array_values($variables), $data['subject']);
        }
        
        if (isset($data['description'])) {
            $data['description'] = str_replace(array_keys($variables), array_values($variables), $data['description']);
        }

        return $data;
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

