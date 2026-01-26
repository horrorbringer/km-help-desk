<?php

namespace App\Http\Requests;

use App\Constants\RoleConstants;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        
        // Check permission based on action
        if ($this->routeIs('admin.departments.store')) {
            return $user->can('departments.create');
        }
        
        if ($this->routeIs('admin.departments.update')) {
            if (!$user->can('departments.edit')) {
                return false;
            }
            
            // Executives can edit all, others can only edit their own
            if (!$user->hasAnyRole(RoleConstants::getExecutiveRoles())) {
                $department = $this->route('department');
                return $department && $user->department_id === $department->id;
            }
            
            return true;
        }
        
        return true;
    }

    public function rules(): array
    {
        $departmentId = $this->route('department')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('departments')->ignore($departmentId)],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('departments')->ignore($departmentId),
            ],
            'is_support_team' => ['boolean'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}

