<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TimeEntry extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'ticket_id',
        'user_id',
        'date',
        'start_time',
        'end_time',
        'duration_minutes',
        'description',
        'activity_type',
        'is_billable',
        'hourly_rate',
        'amount',
        'is_approved',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'date' => 'date',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'duration_minutes' => 'integer',
        'is_billable' => 'boolean',
        'hourly_rate' => 'decimal:2',
        'amount' => 'decimal:2',
        'is_approved' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public const ACTIVITY_TYPES = [
        'Development',
        'Support',
        'Meeting',
        'Research',
        'Documentation',
        'Testing',
        'Training',
        'Other',
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($timeEntry) {
            // Calculate duration from start/end times if provided
            if ($timeEntry->start_time && $timeEntry->end_time) {
                $start = \Carbon\Carbon::parse($timeEntry->date . ' ' . $timeEntry->start_time);
                $end = \Carbon\Carbon::parse($timeEntry->date . ' ' . $timeEntry->end_time);
                
                // Handle overnight entries
                if ($end->lt($start)) {
                    $end->addDay();
                }
                
                $timeEntry->duration_minutes = $start->diffInMinutes($end);
            }

            // Calculate amount if hourly rate is provided
            if ($timeEntry->hourly_rate && $timeEntry->duration_minutes) {
                $hours = $timeEntry->duration_minutes / 60;
                $timeEntry->amount = round($hours * $timeEntry->hourly_rate, 2);
            }
        });
    }

    /**
     * Get duration in hours
     */
    public function getDurationHoursAttribute(): float
    {
        return round($this->duration_minutes / 60, 2);
    }

    /**
     * Get formatted duration (e.g., "2h 30m")
     */
    public function getFormattedDurationAttribute(): string
    {
        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}m";
        }
    }

    /**
     * Relationships
     */
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopeForTicket($query, int $ticketId)
    {
        return $query->where('ticket_id', $ticketId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeBillable($query)
    {
        return $query->where('is_billable', true);
    }

    public function scopeNonBillable($query)
    {
        return $query->where('is_billable', false);
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('is_approved', false);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }
}

