<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    // Statuses
    public const STATUS_OPEN = 'open';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_PENDING = 'pending';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_OPEN,
        self::STATUS_ASSIGNED,
        self::STATUS_IN_PROGRESS,
        self::STATUS_PENDING,
        self::STATUS_RESOLVED,
        self::STATUS_CLOSED,
        self::STATUS_CANCELLED
    ];

    // Priorities
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_CRITICAL = 'critical';

    public const PRIORITIES = [
        self::PRIORITY_LOW,
        self::PRIORITY_MEDIUM,
        self::PRIORITY_HIGH,
        self::PRIORITY_CRITICAL
    ];

    public const SOURCES = ['web', 'email', 'phone', 'mobile_app', 'walk_in'];

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_number',
        'subject',
        'description',
        'internal_note',
        'requester_id',
        'assigned_team_id',
        'assigned_agent_id',
        'category_id',
        'project_id',
        'sla_policy_id',
        'status',
        'priority',
        'estimated_cost',
        'source',
        'first_response_at',
        'first_response_due_at',
        'resolution_due_at',
        'resolved_at',
        'closed_at',
        'response_sla_breached',
        'resolution_sla_breached',
    ];

    protected $casts = [
        'first_response_at' => 'datetime',
        'first_response_due_at' => 'datetime',
        'resolution_due_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
        'response_sla_breached' => 'boolean',
        'resolution_sla_breached' => 'boolean',
        'estimated_cost' => 'decimal:2',
    ];

    public static function generateTicketNumber(): string
    {
        do {
            $number = 'KT-' . random_int(10000, 99999);
        } while (self::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($ticket) {
            // Auto-generate ticket_number if not provided
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = static::generateTicketNumber();
            }
            // Auto-generate subject if not provided
            if (empty($ticket->subject)) {
                $ticket->subject = 'Test Ticket Subject';
            }
            // Auto-generate description if not provided
            if (empty($ticket->description)) {
                $ticket->description = 'Test ticket description';
            }
        });
    }

    public function scopeFilter($query, array $filters)
    {
        return $query
            ->when($filters['q'] ?? null, function ($query, $q) {
            $query->where(function ($sub) use ($q) {
                    $sub->where('ticket_number', 'like', "%{$q}%")
                        ->orWhere('subject', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%");
                }
                );
            })
            ->when($filters['status'] ?? null, fn($query, $status) => $query->where('status', $status))
            ->when($filters['priority'] ?? null, fn($query, $priority) => $query->where('priority', $priority))
            ->when($filters['team'] ?? null, fn($query, $team) => $query->where('assigned_team_id', $team))
            ->when($filters['agent'] ?? null, fn($query, $agent) => $query->where('assigned_agent_id', $agent))
            ->when($filters['category'] ?? null, fn($query, $category) => $query->where('category_id', $category))
            ->when($filters['project'] ?? null, fn($query, $project) => $query->where('project_id', $project))
            ->when($filters['requester'] ?? null, fn($query, $requester) => $query->where('requester_id', $requester));
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class , 'requester_id');
    }

    public function assignedTeam(): BelongsTo
    {
        return $this->belongsTo(Department::class , 'assigned_team_id');
    }

    public function assignedAgent(): BelongsTo
    {
        return $this->belongsTo(User::class , 'assigned_agent_id');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }


    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function slaPolicy(): BelongsTo
    {
        return $this->belongsTo(SlaPolicy::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(TicketHistory::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(TicketApproval::class)->orderBy('sequence');
    }

    public function pendingApprovals(): HasMany
    {
        return $this->hasMany(TicketApproval::class)->where('status', 'pending')->orderBy('sequence');
    }

    public function currentApproval(): ?TicketApproval
    {
        return $this->approvals()->pending()->orderBy('sequence')->first();
    }

    public function rejectedApproval(): ?TicketApproval
    {
        return $this->approvals()->where('status', 'rejected')->orderBy('rejected_at', 'desc')->first();
    }

    public function hasRejectedApproval(): bool
    {
        return $this->approvals()->where('status', 'rejected')->exists();
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(TicketCustomFieldValue::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class , 'ticket_tag')->withPivot('created_at');
    }

    public function watchers(): BelongsToMany
    {
        return $this->belongsToMany(User::class , 'ticket_watchers')->withPivot('created_at');
    }
}