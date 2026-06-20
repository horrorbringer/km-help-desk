<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SoftwareLicenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_name' => ['required', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'license_key' => ['nullable', 'string', 'max:2000'],
            'total_seats' => ['required', 'integer', 'min:1'],
            'assigned_seats' => ['required', 'integer', 'min:0', 'lte:total_seats'],
            'expires_at' => ['required', 'date'],
            'renewal_owner_id' => ['nullable', 'exists:users,id'],
            'assigned_user_id' => ['nullable', 'exists:users,id'],
            'assigned_device' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
