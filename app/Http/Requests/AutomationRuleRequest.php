<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AutomationRuleRequest extends FormRequest
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
            'trigger_event' => ['required', 'in:' . implode(',', \App\Models\AutomationRule::TRIGGER_EVENTS)],
            'conditions' => ['required', 'array', 'min:1'],
            'conditions.*.field' => ['required', 'string'],
            'conditions.*.operator' => ['required', 'string'],
            'conditions.*.value' => ['nullable'],
            'actions' => ['required', 'array', 'min:1'],
            'actions.*.type' => ['required', 'string'],
            'actions.*.value' => ['nullable'],
            'priority' => ['required', 'integer', 'min:0', 'max:100'],
            'is_active' => ['boolean'],
        ];
    }
}

