<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\EscalationRuleRequest;
use App\Models\Department;
use App\Models\EscalationExecution;
use App\Models\EscalationRule;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\User;
use App\Support\TicketRuleCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EscalationRuleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'is_active']);

        $rules = EscalationRule::query()
            ->when($filters['q'] ?? null, function ($query, $q) {
                $query->where(function ($qry) use ($q) {
                    $qry->where('name', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                });
            })
            ->when(isset($filters['is_active']), function ($query) use ($filters) {
                $query->where('is_active', $filters['is_active'] === '1');
            })
            ->ordered()
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($rule) => [
                'id' => $rule->id,
                'name' => $rule->name,
                'description' => $rule->description,
                'time_trigger_type' => $rule->time_trigger_type,
                'time_trigger_minutes' => $rule->time_trigger_minutes,
                'repeat_interval_minutes' => $rule->repeat_interval_minutes,
                'priority' => $rule->priority,
                'is_active' => $rule->is_active,
                'execution_count' => $rule->execution_count,
                'last_executed_at' => $rule->last_executed_at?->toDateTimeString(),
                'created_at' => $rule->created_at->toDateTimeString(),
            ]);

        return Inertia::render('Admin/EscalationRules/Index', [
            'rules' => $rules,
            'filters' => $filters,
            'timeTriggerTypes' => EscalationRule::TIME_TRIGGER_TYPES,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/EscalationRules/Form', [
            'rule' => null,
            'timeTriggerTypes' => EscalationRule::TIME_TRIGGER_TYPES,
            'conditionOperators' => $this->getConditionOperators(),
            'actionTypes' => $this->getActionTypes(),
            'options' => $this->getOptions(),
        ]);
    }

    public function store(EscalationRuleRequest $request): RedirectResponse
    {
        EscalationRule::create($request->validated());

        return redirect()
            ->route('admin.escalation-rules.index')
            ->with('success', 'Escalation rule created successfully.');
    }

    public function edit(EscalationRule $escalationRule): Response
    {
        return Inertia::render('Admin/EscalationRules/Form', [
            'rule' => [
                'id' => $escalationRule->id,
                'name' => $escalationRule->name,
                'description' => $escalationRule->description,
                'conditions' => $escalationRule->conditions ?? [],
                'time_trigger_type' => $escalationRule->time_trigger_type,
                'time_trigger_minutes' => $escalationRule->time_trigger_minutes,
                'repeat_interval_minutes' => $escalationRule->repeat_interval_minutes,
                'actions' => TicketRuleCatalog::normalizeActions($escalationRule->actions),
                'priority' => $escalationRule->priority,
                'is_active' => $escalationRule->is_active,
            ],
            'timeTriggerTypes' => EscalationRule::TIME_TRIGGER_TYPES,
            'conditionOperators' => $this->getConditionOperators(),
            'actionTypes' => $this->getActionTypes(),
            'options' => $this->getOptions(),
        ]);
    }

    public function update(EscalationRuleRequest $request, EscalationRule $escalationRule): RedirectResponse
    {
        $escalationRule->fill($request->validated());
        $shouldResetExecutions = $escalationRule->isDirty([
            'conditions',
            'time_trigger_type',
            'time_trigger_minutes',
            'repeat_interval_minutes',
            'actions',
        ]);
        $escalationRule->save();

        if ($shouldResetExecutions) {
            EscalationExecution::where('escalation_rule_id', $escalationRule->id)->delete();
        }

        return redirect()
            ->route('admin.escalation-rules.index')
            ->with('success', 'Escalation rule updated successfully.');
    }

    public function destroy(EscalationRule $escalationRule): RedirectResponse
    {
        $escalationRule->delete();

        return redirect()
            ->route('admin.escalation-rules.index')
            ->with('success', 'Escalation rule deleted successfully.');
    }

    protected function getConditionOperators(): array
    {
        return TicketRuleCatalog::conditionOperators();
    }

    protected function getActionTypes(): array
    {
        return TicketRuleCatalog::escalationActionTypes();
    }

    protected function getOptions(): array
    {
        return [
            'priorities' => Ticket::PRIORITIES,
            'statuses' => Ticket::STATUSES,
            'sources' => Ticket::SOURCES,
            'categories' => TicketCategory::orderBy('name')->get(['id', 'name'])->map(fn ($category) => [
                'value' => $category->id,
                'label' => $category->name,
            ]),
            'projects' => Project::orderBy('name')->get(['id', 'name'])->map(fn ($project) => [
                'value' => $project->id,
                'label' => $project->name,
            ]),
            'departments' => Department::orderBy('name')->get(['id', 'name'])->map(fn ($d) => [
                'value' => $d->id,
                'label' => $d->name,
            ]),
            'users' => User::where('is_active', true)->orderBy('name')->get(['id', 'name'])->map(fn ($u) => [
                'value' => $u->id,
                'label' => $u->name,
            ]),
        ];
    }
}
