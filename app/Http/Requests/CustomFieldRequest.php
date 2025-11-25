<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CustomFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $customFieldId = $this->route('customField')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('custom_fields')->ignore($customFieldId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('custom_fields')->ignore($customFieldId),
            ],
            'label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'field_type' => ['required', 'in:' . implode(',', array_keys(\App\Models\CustomField::FIELD_TYPES))],
            'options' => ['nullable', 'array'],
            'options.*.label' => ['required_with:options', 'string'],
            'options.*.value' => ['required_with:options', 'string'],
            'default_value' => ['nullable', 'string'],
            'is_required' => ['boolean'],
            'is_active' => ['boolean'],
            'display_order' => ['required', 'integer', 'min:0'],
            'validation_rules' => ['nullable', 'array'],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Auto-generate slug if not provided
        if (!$this->has('slug') && $this->has('name')) {
            $this->merge([
                'slug' => Str::slug($this->name),
            ]);
        }

        // Ensure options is an array
        if ($this->has('options') && !is_array($this->options)) {
            $this->merge(['options' => []]);
        }

        // Ensure validation_rules is an array
        if ($this->has('validation_rules') && !is_array($this->validation_rules)) {
            $this->merge(['validation_rules' => []]);
        }
    }
}

