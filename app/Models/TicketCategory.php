<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'default_team_id',
        'is_active',
        'sort_order',
        'requires_approval',
        'requires_hod_approval',
        'hod_approval_threshold',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'requires_approval' => 'boolean',
        'requires_hod_approval' => 'boolean',
        'hod_approval_threshold' => 'decimal:2',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function defaultTeam(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'default_team_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'category_id');
    }

    public function cannedResponses(): HasMany
    {
        return $this->hasMany(CannedResponse::class, 'category_id');
    }

    /**
     * Scope to get only active categories
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get all descendant categories (recursive)
     */
    public function descendants(): \Illuminate\Database\Eloquent\Collection
    {
        $allDescendants = [];
        
        foreach ($this->children as $child) {
            $allDescendants[] = $child;
            $allDescendants = array_merge($allDescendants, $child->descendants()->all());
        }
        
        return new \Illuminate\Database\Eloquent\Collection($allDescendants);
    }
}


