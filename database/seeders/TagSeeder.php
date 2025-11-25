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
            ['name' => 'Urgent', 'color' => '#dc2626'],
            ['name' => 'Blocked', 'color' => '#9333ea'],
            ['name' => 'Client Facing', 'color' => '#2563eb'],
            ['name' => 'Site Visit', 'color' => '#059669'],
        ];

        foreach ($tags as $tag) {
            $slug = Str::slug($tag['name']);

            Tag::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $tag['name'],
                    'slug' => $slug,
                    'color' => $tag['color'],
                ]
            );
        }
    }
}


