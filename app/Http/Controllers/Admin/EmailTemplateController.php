<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EmailTemplateRequest;
use App\Models\EmailTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'event_type', 'is_active']);

        $templates = EmailTemplate::query()
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('subject', 'like', "%{$q}%")
                        ->orWhere('event_type', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['event_type']), function ($query) use ($filters) {
                $query->where('event_type', $filters['event_type']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('event_type')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($template) => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'event_type' => $template->event_type,
                'subject' => $template->subject,
                'is_active' => $template->is_active,
                'created_at' => $template->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/EmailTemplates/Index', [
            'templates' => $templates,
            'filters' => $filters,
            'eventTypes' => EmailTemplate::EVENT_TYPES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/EmailTemplates/Form', [
            'template' => null,
            'eventTypes' => EmailTemplate::EVENT_TYPES,
            'defaultVariables' => $this->getDefaultVariables(),
        ]);
    }

    public function store(EmailTemplateRequest $request): RedirectResponse
    {
        EmailTemplate::create($request->validated());

        return redirect()
            ->route('admin.email-templates.index')
            ->with('success', 'Email template created successfully.');
    }

    public function edit(EmailTemplate $emailTemplate): Response
    {
        return Inertia::render('Admin/EmailTemplates/Form', [
            'template' => [
                'id' => $emailTemplate->id,
                'name' => $emailTemplate->name,
                'slug' => $emailTemplate->slug,
                'event_type' => $emailTemplate->event_type,
                'subject' => $emailTemplate->subject,
                'body_html' => $emailTemplate->body_html,
                'body_text' => $emailTemplate->body_text,
                'variables' => $emailTemplate->variables,
                'is_active' => $emailTemplate->is_active,
            ],
            'eventTypes' => EmailTemplate::EVENT_TYPES,
            'defaultVariables' => $this->getDefaultVariables(),
        ]);
    }

    public function update(EmailTemplateRequest $request, EmailTemplate $emailTemplate): RedirectResponse
    {
        $emailTemplate->update($request->validated());

        return redirect()
            ->route('admin.email-templates.index')
            ->with('success', 'Email template updated successfully.');
    }

    public function destroy(EmailTemplate $emailTemplate): RedirectResponse
    {
        $emailTemplate->delete();

        return redirect()
            ->route('admin.email-templates.index')
            ->with('success', 'Email template deleted successfully.');
    }

    protected function getDefaultVariables(): array
    {
        return [
            'ticket_number' => 'The ticket number (e.g., TKT-2024-001)',
            'subject' => 'The ticket subject',
            'description' => 'The ticket description',
            'status' => 'Current ticket status',
            'priority' => 'Ticket priority level',
            'requester_name' => 'Name of the ticket requester',
            'assigned_agent' => 'Name of assigned agent',
            'assigned_team' => 'Name of assigned team',
            'category' => 'Ticket category name',
            'project' => 'Project name',
            'ticket_url' => 'Direct link to view the ticket',
            'app_name' => 'Application name',
            'updated_by' => 'Name of user who updated the ticket',
            'resolved_by' => 'Name of user who resolved the ticket',
            'commenter' => 'Name of user who added a comment',
            'changes' => 'List of changed fields',
        ];
    }
}

