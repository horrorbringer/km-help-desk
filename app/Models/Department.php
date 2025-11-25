<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'is_support_team',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_support_team' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function ticketCategories(): HasMany
    {
        return $this->hasMany(TicketCategory::class, 'default_team_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_team_id');
    }
}


