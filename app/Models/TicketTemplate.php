<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class TicketTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'template_data',
        'usage_count',
        'is_active',
        'is_public',
        'created_by',
    ];

    protected $casts = [
        'template_data' => 'array',
        'usage_count' => 'integer',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($template) {
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });
    }

    /**
     * Relationships
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeForUser($query, ?int $userId = null)
    {
        if ($userId) {
            return $query->where(function ($q) use ($userId) {
                $q->where('is_public', true)
                    ->orWhere('created_by', $userId);
            });
        }
        return $query->where('is_public', true);
    }

    /**
     * Increment usage count
     */
    public function incrementUsage(): void
    {
        $this->increment('usage_count');
    }

    /**
     * Get template data for form
     */
    public function getFormData(): array
    {
        return $this->template_data ?? [];
    }
}

