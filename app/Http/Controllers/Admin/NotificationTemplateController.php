<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationTemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'is_active']);

        $templates = NotificationTemplate::query()
            ->when(isset($filters['type']), function ($query) use ($filters) {
                $query->where('type', $filters['type']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($template) => [
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'subject_template' => $template->subject_template,
                'message_template' => $template->message_template,
                'variables' => $template->variables,
                'is_active' => $template->is_active,
                'created_at' => $template->created_at->toDateTimeString(),
                'updated_at' => $template->updated_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/NotificationTemplates/Index', [
            'templates' => $templates,
            'filters' => $filters,
            'types' => NotificationTemplate::TYPES,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/NotificationTemplates/Form', [
            'template' => null,
            'types' => NotificationTemplate::TYPES,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:'.implode(',', NotificationTemplate::TYPES),
            'subject_template' => 'required|string|max:255',
            'message_template' => 'required|string',
            'variables' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        NotificationTemplate::create($validated);

        return redirect()->route('admin.notification-templates.index')
            ->with('success', 'Notification template created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(NotificationTemplate $template): Response
    {
        return Inertia::render('Admin/NotificationTemplates/Form', [
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'type' => $template->type,
                'subject_template' => $template->subject_template,
                'message_template' => $template->message_template,
                'variables' => $template->variables,
                'is_active' => $template->is_active,
            ],
            'types' => NotificationTemplate::TYPES,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, NotificationTemplate $template): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:'.implode(',', NotificationTemplate::TYPES),
            'subject_template' => 'required|string|max:255',
            'message_template' => 'required|string',
            'variables' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $template->update($validated);

        return redirect()->route('admin.notification-templates.index')
            ->with('success', 'Notification template updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(NotificationTemplate $template): RedirectResponse
    {
        $template->delete();

        return redirect()->route('admin.notification-templates.index')
            ->with('success', 'Notification template deleted successfully.');
    }
}
