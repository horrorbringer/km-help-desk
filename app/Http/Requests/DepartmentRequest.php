<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
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

