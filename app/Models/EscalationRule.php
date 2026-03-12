<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EscalationRule extends Model
{
    use HasFactory, SoftDeletes;
    use \App\Traits\HandlesRuleLogic {
        matches as traitMatches;
    }

    protected $fillable = [
        'name',
        'description',
        'conditions',
        'time_trigger_type',
        'time_trigger_minutes',
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
        if (!$this->traitMatches($ticket, $originalData)) {
            return false;
        }

        // Check time trigger (model specific)
        if ($this->time_trigger_type && $this->time_trigger_minutes) {
            if (!$this->checkTimeTrigger($ticket)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Execute escalation actions on ticket
     */
    public function execute(Ticket $ticket): void
    {
        if (empty($this->actions)) {
            return;
        }

        app(\App\Services\TicketActionService::class)->executeActions(
            $ticket,
            $this->actions,
            'escalation_rule',
            $this->id
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
        $triggerTime = match ($this->time_trigger_type) {
                'created_at' => $ticket->created_at,
                'updated_at' => $ticket->updated_at,
                'first_response_due_at' => $ticket->first_response_due_at,
                'resolution_due_at' => $ticket->resolution_due_at,
                default => null,
            };

        if (!$triggerTime) {
            return false;
        }

        $now = now();
        $diffMinutes = $now->diffInMinutes($triggerTime);

        // For "due_at" fields, check if we're past the due time
        if (in_array($this->time_trigger_type, ['first_response_due_at', 'resolution_due_at'])) {
            return $now->isAfter($triggerTime) && $diffMinutes >= $this->time_trigger_minutes;
        }

        // For "created_at" and "updated_at", check if enough time has passed
        return $diffMinutes >= $this->time_trigger_minutes;
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