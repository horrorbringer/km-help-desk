<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SoftwareLicense extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_name',
        'vendor',
        'license_key',
        'total_seats',
        'assigned_seats',
        'expires_at',
        'renewal_owner_id',
        'assigned_user_id',
        'assigned_device',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'license_key' => 'encrypted',
            'expires_at' => 'date',
            'total_seats' => 'integer',
            'assigned_seats' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function renewalOwner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'renewal_owner_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }
}
