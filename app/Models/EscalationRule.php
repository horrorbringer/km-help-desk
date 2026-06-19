<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EscalationRule extends Model
{
    use \App\Traits\HandlesRuleLogic {
        matches as traitMatches;
    }
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'conditions',
        'time_trigger_type',
        'time_trigger_minutes',
        'repeat_interval_minutes',
        'actions',
        'priority',
        'is_active',
        'execution_count',
        'last_executed_at',
    ];

    protected $casts = [
        'conditions' => 'array',
        'actions' => 'array',
        'time_trigger_minutes' => 'integer',
        'repeat_interval_minutes' => 'integer',
        'priority' => 'integer',
        'is_active' => 'boolean',
        'execution_count' => 'integer',
        'last_executed_at' => 'datetime',
    ];

    public const TIME_TRIGGER_TYPES = [
        'created_at' => 'Time Since Creation',
        'updated_at' => 'Time Since Last Update',
        'first_response_due_at' => 'Time Until First Response Due',
        'resolution_due_at' => 'Time Until Resolution Due',
    ];

    /**
     * Check if ticket matches rule conditions + time trigger
     */
    public function matches(Ticket $ticket, array $originalData = []): bool
    {
        // Use trait's condition matching
        if (! $this->traitMatches($ticket, $originalData)) {
            return false;
        }

        // Check time trigger (model specific)
        if ($this->time_trigger_type && $this->time_trigger_minutes) {
            if (! $this->checkTimeTrigger($ticket)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute escalation actions on ticket
     */
    public function execute(Ticket $ticket, array $context = []): void
    {
        if (empty($this->actions)) {
            return;
        }

        app(\App\Services\TicketActionService::class)->executeActions(
            $ticket,
            $this->actions,
            'escalation_rule',
            $this->id,
            $context
        );

        // Update execution stats
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
    }

    /**
     * Check if time trigger condition is met
     */
    protected function checkTimeTrigger(Ticket $ticket): bool
    {
        $triggerTime = $this->triggerTime($ticket);

        if (! $triggerTime) {
            return false;
        }

        $now = now();
        $diffMinutes = $triggerTime->diffInMinutes($now, true);

        // For "due_at" fields, check if we're past the due time
        if (in_array($this->time_trigger_type, ['first_response_due_at', 'resolution_due_at'])) {
            return $now->isAfter($triggerTime) && $diffMinutes >= $this->time_trigger_minutes;
        }

        // For "created_at" and "updated_at", check if enough time has passed
        return $diffMinutes >= $this->time_trigger_minutes;
    }

    public function occurrenceKey(Ticket $ticket): string
    {
        $triggerTime = $this->triggerTime($ticket);
        $isResettableTrigger = in_array(
            $this->time_trigger_type,
            ['first_response_due_at', 'resolution_due_at'],
            true
        );
        $baseKey = $isResettableTrigger && $triggerTime
            ? "{$this->time_trigger_type}:{$triggerTime->getTimestamp()}"
            : 'once';

        if (! $this->repeat_interval_minutes) {
            return $baseKey;
        }

        $eligibleAt = $triggerTime
            ? $triggerTime->copy()->addMinutes($this->time_trigger_minutes)
            : now();
        $elapsedSeconds = max(0, $eligibleAt->diffInSeconds(now(), false));
        $window = intdiv($elapsedSeconds, $this->repeat_interval_minutes * 60);

        return "{$this->time_trigger_type}:{$triggerTime?->getTimestamp()}:repeat:{$window}";
    }

    protected function triggerTime(Ticket $ticket): mixed
    {
        return match ($this->time_trigger_type) {
            'created_at' => $ticket->created_at,
            'updated_at' => $ticket->updated_at,
            'first_response_due_at' => $ticket->first_response_due_at,
            'resolution_due_at' => $ticket->resolution_due_at,
            default => null,
        };
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('id');
    }
}
