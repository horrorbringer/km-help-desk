<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CannedResponseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:ticket_categories,id'],
            'is_active' => ['boolean'],
        ];
    }
}

