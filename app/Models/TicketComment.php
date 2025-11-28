<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'body',
        'ticket_id',
        'parent_id',
        'user_id',
        'is_internal',
        'type',
    ];

    protected $casts = [
        'is_internal' => 'boolean',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TicketComment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketComment::class, 'parent_id')->orderBy('created_at', 'asc');
    }


}