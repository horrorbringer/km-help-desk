<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $tagId = $this->route('tag')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('tags')->ignore($tagId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('tags')->ignore($tagId),
            ],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
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

