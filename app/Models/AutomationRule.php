<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AutomationRule extends Model
{
    use \App\Traits\HandlesRuleLogic, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'trigger_event',
        'conditions',
        'actions',
        'priority',
        'is_active',
        'execution_count',
        'last_executed_at',
    ];

    protected $casts = [
        'conditions' => 'array',
        'actions' => 'array',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'execution_count' => 'integer',
        'last_executed_at' => 'datetime',
    ];

    public const TRIGGER_EVENTS = [
        'ticket_created',
        'ticket_updated',
        'ticket_status_changed',
        'comment_added',
    ];

    // The logic for matches() is now provided by the HandlesRuleLogic trait.
    // getTicketValue() and evaluateCondition() are also in the trait.

    /**
     * Execute rule actions on ticket
     */
    public function execute(Ticket $ticket, array $context = []): void
    {
        if (empty($this->actions)) {
            return;
        }

        app(\App\Services\TicketActionService::class)->executeActions(
            $ticket,
            $this->actions,
            'automation_rule',
            $this->id,
            array_merge($context, ['trigger_event' => $this->trigger_event])
        );

        // Update execution stats
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
    }

    // Trait provides these helper methods
    // getTicketValue and evaluateCondition removed

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTrigger($query, string $triggerEvent)
    {
        return $query->where('trigger_event', $triggerEvent);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('priority', 'desc')->orderBy('id');
    }
}
