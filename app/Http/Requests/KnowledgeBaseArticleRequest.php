<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class KnowledgeBaseArticleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $articleId = $this->route('article')?->id;

        return [
            'title' => ['required', 'string', 'max:255', Rule::unique('knowledge_base_articles')->ignore($articleId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('knowledge_base_articles')->ignore($articleId),
            ],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => ['nullable', 'exists:ticket_categories,id'],
            'status' => ['required', 'in:draft,published,archived'],
            'is_featured' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
            'published_at' => ['nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Auto-generate slug if not provided
        if (!$this->has('slug') && $this->has('title')) {
            $this->merge([
                'slug' => Str::slug($this->title),
            ]);
        }
    }
}

