<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $projectId = $this->route('project')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('projects')->ignore($projectId)],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('projects')->ignore($projectId),
            ],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'project_manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', 'in:planning,in_progress,on_hold,completed,cancelled'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active' => ['boolean'],
        ];
    }
}

