<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class EmailTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'event_type',
        'subject',
        'body_html',
        'body_text',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    public const EVENT_TYPES = [
        'ticket_created',
        'ticket_assigned',
        'ticket_updated',
        'ticket_resolved',
        'ticket_closed',
        'ticket_commented',
        'ticket_mentioned',
        'sla_breached',
        'sla_warning',
        // Approval workflow events
        'approval_lm_requested',
        'approval_hod_requested',
        'approval_lm_approved',
        'approval_hod_approved',
        'approval_lm_rejected',
        'approval_hod_rejected',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($template) {
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });
    }

    /**
     * Replace variables in template with actual values
     * Supports both {{variable}} and {{{variable}}} formats
     */
    public function render(array $data): array
    {
        $subject = $this->subject;
        $bodyHtml = $this->body_html ?? '';
        $bodyText = $this->body_text ?? '';

        foreach ($data as $key => $value) {
            // Support both {{variable}} (double braces) and {{{variable}}} (triple braces) formats
            // Double braces: {{variable}} - PHP string: "{{{$key}}}"
            // Triple braces: {{{variable}}} - PHP string: "{{{{$key}}}}"
            $placeholderDouble = "{{{$key}}}";  // Results in {{variable}}
            $placeholderTriple = "{{{{$key}}}}";  // Results in {{{variable}}}
            
            // Replace double braces format {{variable}}
            $subject = str_replace($placeholderDouble, $value, $subject);
            $bodyHtml = str_replace($placeholderDouble, $value, $bodyHtml);
            $bodyText = str_replace($placeholderDouble, $value, $bodyText);
            
            // Replace triple braces format {{{variable}}}
            $subject = str_replace($placeholderTriple, $value, $subject);
            $bodyHtml = str_replace($placeholderTriple, $value, $bodyHtml);
            $bodyText = str_replace($placeholderTriple, $value, $bodyText);
        }

        return [
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText,
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEvent($query, string $eventType)
    {
        return $query->where('event_type', $eventType);
    }
}

