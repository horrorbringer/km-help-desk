<?php

namespace App\Models;

use App\Support\NotificationType;
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
        NotificationType::TICKET_CREATED,
        NotificationType::TICKET_ASSIGNED,
        NotificationType::TICKET_UPDATED,
        NotificationType::TICKET_RESOLVED,
        NotificationType::TICKET_CLOSED,
        NotificationType::TICKET_COMMENTED,
        NotificationType::TICKET_MENTIONED,
        NotificationType::TICKET_WATCHED,
        NotificationType::TICKET_ROUTED_TO_TEAM,
        NotificationType::TEAMMATE_TICKET_CREATED,
        NotificationType::COMMENT_ADDED,
        NotificationType::COMMENT_INTERNAL,
        NotificationType::SLA_BREACHED,
        NotificationType::SLA_WARNING,
        NotificationType::APPROVAL_REQUESTED,
        NotificationType::APPROVAL_APPROVED,
        NotificationType::APPROVAL_REJECTED,
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
