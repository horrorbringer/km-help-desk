<?php

namespace App\Http\Requests;

use App\Models\AutomationRule;
use App\Support\TicketRuleCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AutomationRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = $this->isMethod('post')
            ? 'automation-rules.create'
            : 'automation-rules.edit';

        return $this->user()?->can($permission) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'trigger_event' => ['required', Rule::in(AutomationRule::TRIGGER_EVENTS)],
            'conditions' => ['nullable', 'array'],
            'conditions.*.field' => [
                'required',
                Rule::in(TicketRuleCatalog::automationConditionFields()),
            ],
            'conditions.*.operator' => [
                'required',
                Rule::in(array_keys(TicketRuleCatalog::conditionOperators(true))),
            ],
            'conditions.*.value' => ['nullable'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.type' => [
                'required',
                Rule::in(TicketRuleCatalog::supportedActionNames()),
            ],
            'actions.*.value' => ['nullable'],
            'priority' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            foreach ($this->input('conditions', []) as $index => $condition) {
                $error = TicketRuleCatalog::conditionValueError(
                    $condition['field'] ?? '',
                    $condition['operator'] ?? '',
                    $condition['value'] ?? null
                );

                if ($error) {
                    $validator->errors()->add("conditions.{$index}.value", $error);
                }
            }

            foreach ($this->input('actions', []) as $index => $action) {
                $error = TicketRuleCatalog::actionValueError(
                    $action['type'] ?? '',
                    $action['value'] ?? null
                );

                if ($error) {
                    $validator->errors()->add("actions.{$index}.value", $error);
                }
            }
        });
    }
}
