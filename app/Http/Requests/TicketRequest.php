<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ticketId = $this->route('ticket')?->id;

        return [
            'ticket_number' => ['sometimes', 'required', 'string', 'max:20', 'unique:tickets,ticket_number,' . $ticketId],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'requester_id' => ['required', 'exists:users,id'],
            'assigned_team_id' => ['required', 'exists:departments,id'],
            'assigned_agent_id' => ['nullable', 'exists:users,id'],
            'category_id' => ['required', 'exists:ticket_categories,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'status' => ['required', 'in:open,assigned,in_progress,pending,resolved,closed,cancelled'],
            'priority' => ['required', 'in:low,medium,high,critical'],
            'source' => ['required', 'string', 'max:50'],
            'first_response_at' => ['nullable', 'date'],
            'first_response_due_at' => ['nullable', 'date'],
            'resolution_due_at' => ['nullable', 'date'],
            'resolved_at' => ['nullable', 'date'],
            'closed_at' => ['nullable', 'date'],
            'response_sla_breached' => ['boolean'],
            'resolution_sla_breached' => ['boolean'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'watcher_ids' => ['sometimes', 'array'],
            'watcher_ids.*' => ['integer', 'exists:users,id'],
            'custom_fields' => ['sometimes', 'array'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->has('custom_fields') && is_array($this->custom_fields)) {
                $customFields = \App\Models\CustomField::active()->get()->keyBy('id');
                
                foreach ($this->custom_fields as $fieldId => $value) {
                    $field = $customFields->get($fieldId);
                    if (!$field) {
                        continue;
                    }

                    $rules = $field->getValidationRules();
                    $fieldName = "custom_fields.{$fieldId}";
                    
                    $fieldValidator = \Illuminate\Support\Facades\Validator::make(
                        [$fieldName => $value],
                        [$fieldName => $rules]
                    );

                    if ($fieldValidator->fails()) {
                        foreach ($fieldValidator->errors()->get($fieldName) as $error) {
                            $validator->errors()->add($fieldName, $error);
                        }
                    }
                }
            }
        });
    }
}


