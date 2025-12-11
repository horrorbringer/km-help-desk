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
        $isUpdate = $ticketId !== null;

        return [
            'ticket_number' => ['nullable', 'string', 'max:20', 'unique:tickets,ticket_number,' . $ticketId],
            'subject' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'description' => [$isUpdate ? 'sometimes' : 'required', 'string'],
            'requester_id' => [$isUpdate ? 'sometimes' : 'required', 'exists:users,id'],
            'assigned_team_id' => [$isUpdate ? 'sometimes' : 'required', 'exists:departments,id'],
            'assigned_agent_id' => ['nullable', 'exists:users,id'],
            'category_id' => [$isUpdate ? 'sometimes' : 'required', 'exists:ticket_categories,id'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'status' => [$isUpdate ? 'sometimes' : 'required', 'in:open,assigned,in_progress,pending,resolved,closed,cancelled'],
            'priority' => [$isUpdate ? 'sometimes' : 'required', 'in:low,medium,high,critical'],
            'estimated_cost' => ['nullable', 'numeric', 'min:0'],
            'source' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:50'],
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
            // Only validate requester_id if it's present in the request (for partial updates)
            if (!$this->has('requester_id')) {
                // Skip requester validation for partial updates
                // Continue to custom fields validation
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
                return;
            }
            
            $user = $this->user();
            $requesterId = $this->input('requester_id');
            
            // If user is creating ticket for themselves, always allow
            if ($requesterId == $user->id) {
                return;
            }
            
            // IMPORTANT: Check department-limited roles FIRST to override permission
            // Most managers manage their department/team, not cross-functional teams
            $isHOD = $user->hasRole('Head of Department');
            $isLineManager = $user->hasRole('Line Manager');
            $isDepartmentManager = $user->hasAnyRole([
                'IT Manager',
                'Operations Manager',
                'Finance Manager',
                'HR Manager',
                'Procurement Manager',
                'Safety Manager',
            ]);
            $isExecutiveOrAdmin = $user->hasAnyRole([
                'CEO',
                'Director',
                'Super Admin',
            ]);
            $isProjectManager = $user->hasRole('Project Manager');
            $hasCreateOnBehalfPermission = $user->can('tickets.create-on-behalf');
            
            // Department managers can only create tickets for users in their department
            if (($isHOD || $isLineManager || $isDepartmentManager) && $user->department_id) {
                $requester = \App\Models\User::find($requesterId);
                if ($requester && $requester->department_id === $user->department_id) {
                    return; // Allowed: requester is in their department
                }
                // Get the role name for error message
                $roleName = $isHOD ? 'Head of Department' 
                    : ($isLineManager ? 'Line Manager' 
                    : ($user->roles->first()?->name ?? 'Manager'));
                $validator->errors()->add(
                    'requester_id',
                    "As {$roleName}, you can only create tickets for users in your department."
                );
                return;
            }
            
            // Executives and Project Managers can create tickets for anyone
            if ($isExecutiveOrAdmin || $isProjectManager) {
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


