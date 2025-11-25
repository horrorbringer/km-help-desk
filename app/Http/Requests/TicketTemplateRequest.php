<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TicketTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        $templateId = $this->route('ticketTemplate')?->id;

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('ticket_templates')->ignore($templateId)],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('ticket_templates')->ignore($templateId),
            ],
            'description' => ['nullable', 'string'],
            'template_data' => ['required', 'array'],
            'template_data.subject' => ['nullable', 'string', 'max:255'],
            'template_data.description' => ['nullable', 'string'],
            'template_data.category_id' => ['nullable', 'exists:ticket_categories,id'],
            'template_data.project_id' => ['nullable', 'exists:projects,id'],
            'template_data.assigned_team_id' => ['nullable', 'exists:departments,id'],
            'template_data.assigned_agent_id' => ['nullable', 'exists:users,id'],
            'template_data.priority' => ['nullable', 'in:' . implode(',', \App\Models\Ticket::PRIORITIES)],
            'template_data.status' => ['nullable', 'in:' . implode(',', \App\Models\Ticket::STATUSES)],
            'template_data.source' => ['nullable', 'in:' . implode(',', \App\Models\Ticket::SOURCES)],
            'template_data.sla_policy_id' => ['nullable', 'exists:sla_policies,id'],
            'template_data.tag_ids' => ['nullable', 'array'],
            'template_data.tag_ids.*' => ['integer', 'exists:tags,id'],
            'template_data.custom_fields' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'is_public' => ['boolean'],
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

        // Ensure template_data is an array
        if ($this->has('template_data') && !is_array($this->template_data)) {
            $this->merge(['template_data' => []]);
        }
    }
}

