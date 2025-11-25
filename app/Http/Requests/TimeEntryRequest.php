<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Add authorization logic as needed
    }

    public function rules(): array
    {
        return [
            'ticket_id' => ['required', 'exists:tickets,id'],
            'user_id' => ['nullable', 'exists:users,id'],
            'date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'duration_minutes' => ['required_without_all:start_time,end_time', 'integer', 'min:1'],
            'description' => ['nullable', 'string', 'max:1000'],
            'activity_type' => ['nullable', 'string', Rule::in(\App\Models\TimeEntry::ACTIVITY_TYPES)],
            'is_billable' => ['boolean'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0', 'max:999999.99'],
            'is_approved' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // If duration_minutes is provided but start_time/end_time are not, ensure duration is set
        if ($this->has('duration_minutes') && !$this->has('start_time') && !$this->has('end_time')) {
            // Duration is already provided, no action needed
        } elseif ($this->has('start_time') && $this->has('end_time')) {
            // Calculate duration from start/end times
            $start = \Carbon\Carbon::parse($this->date . ' ' . $this->start_time);
            $end = \Carbon\Carbon::parse($this->date . ' ' . $this->end_time);
            
            if ($end->lt($start)) {
                $end->addDay();
            }
            
            $this->merge([
                'duration_minutes' => $start->diffInMinutes($end),
            ]);
        }
    }
}

