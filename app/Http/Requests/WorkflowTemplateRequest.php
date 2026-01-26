<?php

namespace App\Http\Requests;

use App\Constants\ApprovalLevelConstants;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WorkflowTemplateRequest extends FormRequest
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
            'category_id' => ['nullable', 'exists:ticket_categories,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'workflow_steps' => ['required', 'array', 'min:1'],
            'workflow_steps.*.step_id' => ['required', 'integer', 'min:1'],
            'workflow_steps.*.type' => ['required', 'string', Rule::in(['approval', 'conditional_approval', 'notification', 'routing', 'conditional_routing', 'assignment'])],
            'workflow_steps.*.notify_type' => ['nullable', 'string'],
            'workflow_steps.*.assign_to' => ['nullable', 'string'],
            'workflow_steps.*.approval_level' => [
                'required_if:workflow_steps.*.type,approval,conditional_approval',
                'string',
                'max:50',
                function ($attribute, $value, $fail) {
                    if (!ApprovalLevelConstants::isValid($value)) {
                        $fail('The approval level format is invalid. Use lowercase letters, numbers, underscores, or hyphens.');
                    }
                },
            ],
            'workflow_steps.*.approver_type' => ['required_if:workflow_steps.*.type,approval,conditional_approval', 'string'],
            'workflow_steps.*.condition' => ['nullable', 'array'],
            'workflow_steps.*.if_false' => ['nullable', 'string'],
            'workflow_steps.*.route_to' => ['nullable', 'string'],
            'workflow_steps.*.team_id' => ['nullable', 'exists:departments,id'],
            'routing_rules' => ['nullable', 'array'],
            'approval_rules' => ['nullable', 'array'],
            'approval_rules.*.condition' => ['nullable', 'array'],
            'approval_rules.*.action' => ['nullable', 'string', Rule::in(['skip_approval', 'auto_approve_and_route'])],
            'approval_rules.*.skip_steps' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'priority' => ['integer', 'min:0', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Ensure workflow_steps is an array
        if ($this->has('workflow_steps') && is_string($this->workflow_steps)) {
            $this->merge([
                'workflow_steps' => json_decode($this->workflow_steps, true) ?? [],
            ]);
        }

        // Ensure routing_rules is an array
        if ($this->has('routing_rules') && is_string($this->routing_rules)) {
            $this->merge([
                'routing_rules' => json_decode($this->routing_rules, true) ?? [],
            ]);
        }

        // Ensure approval_rules is an array
        if ($this->has('approval_rules') && is_string($this->approval_rules)) {
            $this->merge([
                'approval_rules' => json_decode($this->approval_rules, true) ?? [],
            ]);
        }
    }
}
