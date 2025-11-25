<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class KnowledgeBaseArticle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'category_id',
        'author_id',
        'status',
        'is_featured',
        'views_count',
        'helpful_count',
        'not_helpful_count',
        'sort_order',
        'published_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'views_count' => 'integer',
        'helpful_count' => 'integer',
        'not_helpful_count' => 'integer',
        'sort_order' => 'integer',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const STATUSES = ['draft', 'published', 'archived'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function incrementViews()
    {
        $this->increment('views_count');
    }

    public function markHelpful()
    {
        $this->increment('helpful_count');
    }

    public function markNotHelpful()
    {
        $this->increment('not_helpful_count');
    }
}

