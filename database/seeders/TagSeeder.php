<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'Urgent', 'color' => '#dc2626', 'description' => 'Requires immediate attention'],
            ['name' => 'Blocked', 'color' => '#9333ea', 'description' => 'Waiting on external dependency'],
            ['name' => 'Client Facing', 'color' => '#2563eb', 'description' => 'Direct client interaction required'],
            ['name' => 'Site Visit', 'color' => '#059669', 'description' => 'On-site inspection needed'],
            ['name' => 'Equipment', 'color' => '#f59e0b', 'description' => 'Related to equipment or machinery'],
            ['name' => 'Safety', 'color' => '#ef4444', 'description' => 'Safety or compliance related'],
            ['name' => 'IT Issue', 'color' => '#3b82f6', 'description' => 'Information technology problem'],
            ['name' => 'Procurement', 'color' => '#8b5cf6', 'description' => 'Purchase or vendor related'],
            ['name' => 'Finance', 'color' => '#10b981', 'description' => 'Financial or accounting matter'],
            ['name' => 'Follow-up', 'color' => '#6366f1', 'description' => 'Requires follow-up action'],
            ['name' => 'Documentation', 'color' => '#14b8a6', 'description' => 'Documentation or paperwork needed'],
            ['name' => 'Training', 'color' => '#f97316', 'description' => 'Training or knowledge transfer'],
        ];

        foreach ($tags as $tag) {
            $slug = Str::slug($tag['name']);

            Tag::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $tag['name'],
                    'slug' => $slug,
                    'color' => $tag['color'],
                    'description' => $tag['description'] ?? null,
                ]
            );
        }
    }
}


