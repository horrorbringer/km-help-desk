<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $categoryId = $this->route('category')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('ticket_categories')->ignore($categoryId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('ticket_categories')->ignore($categoryId),
            ],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'exists:ticket_categories,id'],
            'default_team_id' => ['required', 'exists:departments,id'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'requires_approval' => ['boolean'],
            'requires_hod_approval' => ['boolean'],
            'hod_approval_threshold' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Auto-generate slug if not provided or empty
        if ((!$this->has('slug') || empty($this->slug)) && $this->has('name') && !empty($this->name)) {
            $this->merge([
                'slug' => Str::slug($this->name),
            ]);
        }
    }
}

