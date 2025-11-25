<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EmailTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $templateId = $this->route('emailTemplate')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('email_templates')->ignore($templateId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('email_templates')->ignore($templateId),
            ],
            'event_type' => ['required', 'in:' . implode(',', \App\Models\EmailTemplate::EVENT_TYPES)],
            'subject' => ['required', 'string', 'max:255'],
            'body_html' => ['nullable', 'string'],
            'body_text' => ['nullable', 'string'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['boolean'],
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
    }
}

