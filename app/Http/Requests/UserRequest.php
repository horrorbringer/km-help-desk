<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($userId),
            ],
            'password' => [
                $userId ? 'nullable' : 'required',
                'string',
                'min:8',
                'confirmed',
            ],
            'phone' => ['nullable', 'string', 'max:20'],
            'employee_id' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('users')->ignore($userId),
            ],
            'department_id' => [
                'nullable', 
                'exists:departments,id',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        $department = \App\Models\Department::find($value);
                        if ($department && !$department->is_active) {
                            $fail('Cannot assign user to an inactive department. Please activate the department first.');
                        }
                    }
                },
            ],
            'is_active' => ['boolean'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ];
    }
}

