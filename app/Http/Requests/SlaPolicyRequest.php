<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SlaPolicyRequest extends FormRequest
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
            'priority' => ['required', 'in:low,medium,high,critical'],
            'response_time' => ['required', 'integer', 'min:1', 'comment' => 'Response time in minutes'],
            'resolution_time' => ['required', 'integer', 'min:1', 'comment' => 'Resolution time in minutes'],
            'is_active' => ['boolean'],
        ];
    }
}

