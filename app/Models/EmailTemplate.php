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
        'comment_added',
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

        // First, handle Handlebars conditionals {{#if variable}}...{{/if}}
        // Only hide blocks if value is truly empty/null (not display strings like "Unassigned")
        foreach ($data as $key => $value) {
            // Check if value is truly empty (null, empty string, or false)
            // But keep display values like "Unassigned", "No category" - these should show
            $isEmpty = ($value === null || $value === '' || $value === false);
            
            if ($isEmpty) {
                // Remove entire {{#if variable}}...{{/if}} blocks when value is truly empty
                $pattern = '/\{\{#if\s+' . preg_quote($key, '/') . '\}\}.*?\{\{\/if\}\}/s';
                $subject = preg_replace($pattern, '', $subject);
                $bodyHtml = preg_replace($pattern, '', $bodyHtml);
                $bodyText = preg_replace($pattern, '', $bodyText);
            } else {
                // Remove the {{#if}} and {{/if}} tags but keep the content
                $pattern = '/\{\{#if\s+' . preg_quote($key, '/') . '\}\}/';
                $subject = preg_replace($pattern, '', $subject);
                $bodyHtml = preg_replace($pattern, '', $bodyHtml);
                $bodyText = preg_replace($pattern, '', $bodyText);
                
                $pattern = '/\{\{\/if\}\}/';
                $subject = preg_replace($pattern, '', $subject);
                $bodyHtml = preg_replace($pattern, '', $bodyHtml);
                $bodyText = preg_replace($pattern, '', $bodyText);
            }
        }

        // Then replace variables
        foreach ($data as $key => $value) {
            // Convert value to string
            $stringValue = is_array($value) ? implode(', ', $value) : (string) $value;
            
            // Support both {{variable}} (double braces) and {{{variable}}} (triple braces) formats
            // Double braces: {{variable}} - PHP string: "{{{$key}}}"
            // Triple braces: {{{variable}}} - PHP string: "{{{{$key}}}}"
            $placeholderDouble = "{{{$key}}}";  // Results in {{variable}}
            $placeholderTriple = "{{{{$key}}}}";  // Results in {{{variable}}}
            
            // Replace double braces format {{variable}}
            $subject = str_replace($placeholderDouble, $stringValue, $subject);
            $bodyHtml = str_replace($placeholderDouble, $stringValue, $bodyHtml);
            $bodyText = str_replace($placeholderDouble, $stringValue, $bodyText);
            
            // Replace triple braces format {{{variable}}}
            $subject = str_replace($placeholderTriple, $stringValue, $subject);
            $bodyHtml = str_replace($placeholderTriple, $stringValue, $bodyHtml);
            $bodyText = str_replace($placeholderTriple, $stringValue, $bodyText);
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

