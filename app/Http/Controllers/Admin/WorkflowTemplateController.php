<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkflowTemplateRequest;
use App\Models\Department;
use App\Models\TicketCategory;
use App\Models\WorkflowTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'category_id', 'department_id', 'is_active']);

        $templates = WorkflowTemplate::query()
            ->with(['category:id,name', 'department:id,name'])
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when($filters['category_id'] ?? null, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($filters['department_id'] ?? null, function ($query, $departmentId) {
                $query->where('department_id', $departmentId);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('priority', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($template) => [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'category' => $template->category ? [
                    'id' => $template->category->id,
                    'name' => $template->category->name,
                ] : null,
                'department' => $template->department ? [
                    'id' => $template->department->id,
                    'name' => $template->department->name,
                ] : null,
                'priority' => $template->priority,
                'is_active' => $template->is_active,
                'workflow_steps_count' => count($template->workflow_steps ?? []),
                'created_at' => $template->created_at->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Admin/WorkflowTemplates/Index', [
            'templates' => $templates,
            'filters' => $filters,
            'formOptions' => $this->getFormOptions(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/WorkflowTemplates/Form', [
            'template' => null,
            'formOptions' => $this->getFormOptions(),
        ]);
    }

    public function store(WorkflowTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        
        // Ensure JSON fields are properly formatted
        $data['workflow_steps'] = $data['workflow_steps'] ?? [];
        $data['routing_rules'] = $data['routing_rules'] ?? [];
        $data['approval_rules'] = $data['approval_rules'] ?? [];
        
        WorkflowTemplate::create($data);

        return redirect()
            ->route('admin.workflow-templates.index')
            ->with('success', 'Workflow template created successfully.');
    }

    public function edit(WorkflowTemplate $workflowTemplate): Response
    {
        return Inertia::render('Admin/WorkflowTemplates/Form', [
            'template' => [
                'id' => $workflowTemplate->id,
                'name' => $workflowTemplate->name,
                'description' => $workflowTemplate->description,
                'category_id' => $workflowTemplate->category_id,
                'department_id' => $workflowTemplate->department_id,
                'workflow_steps' => $workflowTemplate->workflow_steps ?? [],
                'routing_rules' => $workflowTemplate->routing_rules ?? [],
                'approval_rules' => $workflowTemplate->approval_rules ?? [],
                'is_active' => $workflowTemplate->is_active,
                'priority' => $workflowTemplate->priority,
            ],
            'formOptions' => $this->getFormOptions(),
        ]);
    }

    public function update(WorkflowTemplateRequest $request, WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $data = $request->validated();
        
        // Ensure JSON fields are properly formatted
        $data['workflow_steps'] = $data['workflow_steps'] ?? [];
        $data['routing_rules'] = $data['routing_rules'] ?? [];
        $data['approval_rules'] = $data['approval_rules'] ?? [];
        
        $workflowTemplate->update($data);

        return redirect()
            ->route('admin.workflow-templates.index')
            ->with('success', 'Workflow template updated successfully.');
    }

    public function destroy(WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $workflowTemplate->delete();

        return redirect()
            ->route('admin.workflow-templates.index')
            ->with('success', 'Workflow template deleted successfully.');
    }

    public function toggleStatus(WorkflowTemplate $workflowTemplate): RedirectResponse
    {
        $workflowTemplate->update([
            'is_active' => !$workflowTemplate->is_active,
        ]);

        return redirect()
            ->route('admin.workflow-templates.index')
            ->with('success', 'Workflow template status updated successfully.');
    }

    protected function getFormOptions(): array
    {
        return [
            'categories' => TicketCategory::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($cat) => ['value' => $cat->id, 'label' => $cat->name]),
            'departments' => Department::where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn ($dept) => ['value' => $dept->id, 'label' => $dept->name]),
            'approval_levels' => \App\Constants\ApprovalLevelConstants::getOptions(),
            'approver_types' => [
                ['value' => 'line_manager', 'label' => 'Line Manager'],
                ['value' => 'head_of_department', 'label' => 'Head of Department'],
                ['value' => 'hod', 'label' => 'HOD (alias)'],
            ],
            'step_types' => [
                ['value' => 'approval', 'label' => 'Approval'],
                ['value' => 'conditional_approval', 'label' => 'Conditional Approval'],
                ['value' => 'notification', 'label' => 'Notification (Informational)'],
                ['value' => 'routing', 'label' => 'Routing'],
                ['value' => 'conditional_routing', 'label' => 'Conditional Routing'],
                ['value' => 'assignment', 'label' => 'Assignment'],
            ],
            'operators' => [
                ['value' => '==', 'label' => 'Equals (==)'],
                ['value' => '!=', 'label' => 'Not Equals (!=)'],
                ['value' => '>', 'label' => 'Greater Than (>)'],
                ['value' => '>=', 'label' => 'Greater Than or Equal (>=)'],
                ['value' => '<', 'label' => 'Less Than (<)'],
                ['value' => '<=', 'label' => 'Less Than or Equal (<=)'],
                ['value' => 'in', 'label' => 'In Array'],
                ['value' => 'not_in', 'label' => 'Not In Array'],
                ['value' => 'contains', 'label' => 'Contains'],
            ],
        ];
    }
}
