<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Project extends Model
{
     protected $fillable = [
        'title',
        'slug',
        'client_name',
        'location',
        'start_date',
        'end_date',
        'status',
        'short_description',
        'description',
        'cover_image',
        'featured',
    ];

    protected static function booted()
    {
        static::creating(function ($project) {
            if (empty($project->slug)) {
                $project->slug = Str::slug($project->title) . '-' . Str::random(5);
            }
        });
    }
}
