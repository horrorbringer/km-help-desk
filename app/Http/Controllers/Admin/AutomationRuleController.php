<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AutomationRuleRequest;
use App\Models\AutomationRule;
use App\Models\Department;
use App\Models\TicketCategory;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AutomationRuleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'trigger_event', 'is_active']);

        $rules = AutomationRule::query()
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['trigger_event']), function ($query) use ($filters) {
                $query->where('trigger_event', $filters['trigger_event']);
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->orderBy('priority', 'desc')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($rule) => [
                'id' => $rule->id,
                'name' => $rule->name,
                'description' => $rule->description,
                'trigger_event' => $rule->trigger_event,
                'priority' => $rule->priority,
                'is_active' => $rule->is_active,
                'execution_count' => $rule->execution_count,
                'last_executed_at' => $rule->last_executed_at?->toDateTimeString(),
                'created_at' => $rule->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/AutomationRules/Index', [
            'rules' => $rules,
            'filters' => $filters,
            'triggerEvents' => AutomationRule::TRIGGER_EVENTS,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/AutomationRules/Form', [
            'rule' => null,
            'triggerEvents' => AutomationRule::TRIGGER_EVENTS,
            'conditionOperators' => $this->getConditionOperators(),
            'actionTypes' => $this->getActionTypes(),
            'options' => $this->getOptions(),
        ]);
    }

    public function store(AutomationRuleRequest $request): RedirectResponse
    {
        AutomationRule::create($request->validated());

        return redirect()
            ->route('admin.automation-rules.index')
            ->with('success', 'Automation rule created successfully.');
    }

    public function edit(AutomationRule $automationRule): Response
    {
        return Inertia::render('Admin/AutomationRules/Form', [
            'rule' => [
                'id' => $automationRule->id,
                'name' => $automationRule->name,
                'description' => $automationRule->description,
                'trigger_event' => $automationRule->trigger_event,
                'conditions' => $automationRule->conditions ?? [],
                'actions' => $automationRule->actions ?? [],
                'priority' => $automationRule->priority,
                'is_active' => $automationRule->is_active,
            ],
            'triggerEvents' => AutomationRule::TRIGGER_EVENTS,
            'conditionOperators' => $this->getConditionOperators(),
            'actionTypes' => $this->getActionTypes(),
            'options' => $this->getOptions(),
        ]);
    }

    public function update(AutomationRuleRequest $request, AutomationRule $automationRule): RedirectResponse
    {
        $automationRule->update($request->validated());

        return redirect()
            ->route('admin.automation-rules.index')
            ->with('success', 'Automation rule updated successfully.');
    }

    public function destroy(AutomationRule $automationRule): RedirectResponse
    {
        $automationRule->delete();

        return redirect()
            ->route('admin.automation-rules.index')
            ->with('success', 'Automation rule deleted successfully.');
    }

    protected function getConditionOperators(): array
    {
        return [
            'equals' => 'Equals',
            'not_equals' => 'Not Equals',
            'contains' => 'Contains',
            'not_contains' => 'Not Contains',
            'in' => 'In',
            'not_in' => 'Not In',
            'is_empty' => 'Is Empty',
            'is_not_empty' => 'Is Not Empty',
            'greater_than' => 'Greater Than',
            'less_than' => 'Less Than',
        ];
    }

    protected function getActionTypes(): array
    {
        return [
            'assign_to_team' => 'Assign to Team',
            'assign_to_agent' => 'Assign to Agent',
            'set_status' => 'Set Status',
            'set_priority' => 'Set Priority',
            'set_category' => 'Set Category',
            'set_sla_policy' => 'Set SLA Policy',
            'add_tags' => 'Add Tags',
        ];
    }

    protected function getOptions(): array
    {
        return [
            'categories' => TicketCategory::orderBy('name')->get(['id', 'name'])->map(fn ($c) => [
                'value' => $c->id,
                'label' => $c->name,
            ]),
            'departments' => Department::orderBy('name')->get(['id', 'name'])->map(fn ($d) => [
                'value' => $d->id,
                'label' => $d->name,
            ]),
            'users' => User::where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn ($u) => [
                'value' => $u->id,
                'label' => $u->name,
            ]),
            'sla_policies' => SlaPolicy::orderBy('name')->get(['id', 'name'])->map(fn ($s) => [
                'value' => $s->id,
                'label' => $s->name,
            ]),
            'tags' => Tag::orderBy('name')->get(['id', 'name'])->map(fn ($t) => [
                'value' => $t->id,
                'label' => $t->name,
            ]),
            'statuses' => Ticket::STATUSES,
            'priorities' => Ticket::PRIORITIES,
        ];
    }
}

