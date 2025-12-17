<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Extended Role model with hierarchy and metadata support
 * 
 * Extends Spatie's Role model to add:
 * - Role hierarchy (parent-child relationships)
 * - Role metadata (approval limits, department scope, etc.)
 * - Helper methods for hierarchy operations
 */
class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
        'parent_role_id',
        'hierarchy_level',
        'metadata',
        'is_system_role',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_system_role' => 'boolean',
    ];

    /**
     * Get the parent role
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'parent_role_id');
    }

    /**
     * Get child roles
     */
    public function children(): HasMany
    {
        return $this->hasMany(Role::class, 'parent_role_id');
    }

    /**
     * Get approval limit from metadata
     */
    public function getApprovalLimit(): ?float
    {
        return $this->metadata['approval_limit'] ?? null;
    }

    /**
     * Get department scope from metadata
     */
    public function getDepartmentScope(): string
    {
        return $this->metadata['department_scope'] ?? 'all';
    }

    /**
     * Check if this role is higher in hierarchy than another role
     */
    public function isHigherThan(Role $otherRole): bool
    {
        return $this->hierarchy_level > $otherRole->hierarchy_level;
    }

    /**
     * Check if this role is lower in hierarchy than another role
     */
    public function isLowerThan(Role $otherRole): bool
    {
        return $this->hierarchy_level < $otherRole->hierarchy_level;
    }

    /**
     * Get all ancestor roles (parent, grandparent, etc.)
     */
    public function getAncestors(): Collection
    {
        $ancestors = collect();
        $current = $this->parent;
        
        while ($current) {
            $ancestors->push($current);
            $current = $current->parent;
        }
        
        return $ancestors;
    }

    /**
     * Get all descendant roles (children, grandchildren, etc.)
     */
    public function getDescendants(): Collection
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getDescendants());
        }
        
        return $descendants;
    }

    /**
     * Get the highest role in the hierarchy chain
     */
    public function getTopLevelRole(): Role
    {
        $current = $this;
        
        while ($current->parent) {
            $current = $current->parent;
        }
        
        return $current;
    }

    /**
     * Check if role can approve amount
     */
    public function canApproveAmount(float $amount): bool
    {
        $limit = $this->getApprovalLimit();
        
        if ($limit === null) {
            return true; // Unlimited
        }
        
        return $amount <= $limit;
    }

    /**
     * Scope: Get roles by hierarchy level
     */
    public function scopeByLevel($query, int $level)
    {
        return $query->where('hierarchy_level', $level);
    }

    /**
     * Scope: Get roles above a certain level
     */
    public function scopeAboveLevel($query, int $level)
    {
        return $query->where('hierarchy_level', '>', $level);
    }

    /**
     * Scope: Get roles below a certain level
     */
    public function scopeBelowLevel($query, int $level)
    {
        return $query->where('hierarchy_level', '<', $level);
    }

    /**
     * Scope: Get system roles
     */
    public function scopeSystemRoles($query)
    {
        return $query->where('is_system_role', true);
    }
}
