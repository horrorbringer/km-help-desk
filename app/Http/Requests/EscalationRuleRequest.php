<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EscalationRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'conditions' => ['nullable', 'array'],
            'conditions.*.field' => ['required_with:conditions', 'string'],
            'conditions.*.operator' => ['required_with:conditions', 'string'],
            'conditions.*.value' => ['nullable'],
            'time_trigger_type' => ['nullable', 'string', Rule::in(array_keys(\App\Models\EscalationRule::TIME_TRIGGER_TYPES))],
            'time_trigger_minutes' => ['nullable', 'integer', 'min:1', 'required_with:time_trigger_type'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.type' => ['required', 'string'],
            'actions.*.value' => ['nullable'],
            'priority' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }
}

