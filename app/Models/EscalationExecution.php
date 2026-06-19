<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EscalationExecution extends Model
{
    protected $fillable = [
        'escalation_rule_id',
        'ticket_id',
        'occurrence_key',
        'executed_at',
    ];

    protected $casts = [
        'executed_at' => 'datetime',
    ];

    public function escalationRule(): BelongsTo
    {
        return $this->belongsTo(EscalationRule::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
