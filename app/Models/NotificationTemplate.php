<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'subject_template',
        'message_template',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    public const TYPES = [
        'ticket_created',
        'ticket_assigned',
        'ticket_updated',
        'ticket_resolved',
        'ticket_closed',
        'ticket_commented',
        'ticket_mentioned',
        'sla_breached',
        'sla_warning',
        'approval_requested',
        'approval_approved',
        'approval_rejected',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Render the subject template with given variables
     */
    public function renderSubject(array $variables = []): string
    {
        return $this->renderTemplate($this->subject_template, $variables);
    }

    /**
     * Render the message template with given variables
     */
    public function renderMessage(array $variables = []): string
    {
        return $this->renderTemplate($this->message_template, $variables);
    }

    /**
     * Render a template string with variables
     */
    private function renderTemplate(string $template, array $variables = []): string
    {
        $search = [];
        $replace = [];

        foreach ($variables as $key => $value) {
            $search[] = "{{$key}}";
            $replace[] = $value;
        }

        return str_replace($search, $replace, $template);
    }
}
