<?php

namespace App\Models;

use App\Support\NotificationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HelpDeskNotification extends Model
{
    use HasFactory;

    protected $table = 'help_desk_notifications';

    protected static function booted()
    {
        static::saved(function ($notification) {
            \Illuminate\Support\Facades\Cache::forget("user_unread_count_{$notification->user_id}");
        });

        static::deleted(function ($notification) {
            \Illuminate\Support\Facades\Cache::forget("user_unread_count_{$notification->user_id}");
        });
    }

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'ticket_id',
        'related_user_id',
        'data',
        'dedupe_key',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function relatedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'related_user_id');
    }

    public function markAsRead(): void
    {
        if (! $this->is_read) {
            $this->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeRead($query)
    {
        return $query->where('is_read', true);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
