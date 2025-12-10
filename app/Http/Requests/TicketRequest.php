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
            'ticket_number' => ['nullable', 'string', 'max:20', 'unique:tickets,ticket_number,' . $ticketId],
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
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
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
            $user = $this->user();
            $requesterId = $this->input('requester_id');
            
            // If user is creating ticket for themselves, always allow
            if ($requesterId == $user->id) {
                return;
            }
            
            // IMPORTANT: Check department-limited roles FIRST to override permission
            // These roles manage their department/team, not cross-functional teams
            $isHOD = $user->hasRole('Head of Department');
            $isLineManager = $user->hasRole('Line Manager');
            $hasCreateOnBehalfPermission = $user->can('tickets.create-on-behalf');
            
            // HODs and Line Managers can only create tickets for users in their department
            if (($isHOD || $isLineManager) && $user->department_id) {
                $requester = \App\Models\User::find($requesterId);
                if ($requester && $requester->department_id === $user->department_id) {
                    return; // Allowed: requester is in their department
                }
                $roleName = $isHOD ? 'Head of Department' : 'Line Manager';
                $validator->errors()->add(
                    'requester_id',
                    "As {$roleName}, you can only create tickets for users in your department."
                );
                return;
            }
            
            // Users with permission (Managers, Admins) can create tickets for anyone
            if ($hasCreateOnBehalfPermission) {
                return;
            }
            
            // Regular users can only create tickets for themselves
            $validator->errors()->add(
                'requester_id',
                'You can only create tickets for yourself. Contact a manager or admin to create tickets on behalf of others.'
            );
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


