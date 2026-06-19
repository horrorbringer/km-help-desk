<?php

namespace App\Http\Requests;

use App\Models\EscalationRule;
use App\Support\TicketRuleCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class EscalationRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $permission = $this->isMethod('post')
            ? 'escalation-rules.create'
            : 'escalation-rules.edit';

        return $this->user()?->can($permission) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'conditions.*.field' => [
                'required_with:conditions',
                Rule::in(TicketRuleCatalog::CONDITION_FIELDS),
            ],
            'conditions.*.operator' => [
                'required_with:conditions',
                Rule::in(array_keys(TicketRuleCatalog::conditionOperators())),
            ],
            'conditions.*.value' => ['nullable'],
            'time_trigger_type' => [
                'required',
                'string',
                Rule::in(array_keys(EscalationRule::TIME_TRIGGER_TYPES)),
            ],
            'time_trigger_minutes' => ['required', 'integer', 'min:1'],
            'repeat_interval_minutes' => ['nullable', 'integer', 'min:1'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.type' => [
                'required',
                Rule::in(TicketRuleCatalog::supportedEscalationActionNames()),
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
