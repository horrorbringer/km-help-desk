<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Approval Level Model
 * 
 * Stores configurable approval level definitions.
 * Allows admins to manage approval levels via UI without code changes.
 */
class ApprovalLevel extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'label',
        'description',
        'role_names',
        'hierarchy_order',
        'is_active',
        'is_system_level',
        'sort_order',
    ];

    protected $casts = [
        'role_names' => 'array',
        'is_active' => 'boolean',
        'is_system_level' => 'boolean',
        'hierarchy_order' => 'integer',
        'sort_order' => 'integer',
    ];

    /**
     * Scope: Active approval levels only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope: System levels (cannot be deleted)
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system_level', true);
    }

    /**
     * Scope: Custom levels (can be deleted)
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system_level', false);
    }

    /**
     * Scope: Ordered by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('label');
    }

    /**
     * Check if this level can be deleted
     */
    public function canBeDeleted(): bool
    {
        return !$this->is_system_level;
    }

    /**
     * Get role names as array
     */
    public function getRoleNames(): array
    {
        return $this->role_names ?? [];
    }
}

