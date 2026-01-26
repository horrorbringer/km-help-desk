<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\Room::create([
            'name' => 'The Glass House',
            'capacity' => 12,
            'location' => 'Floor 2, East Wing',
            'description' => 'Main conference room with panoramic view.',
            'amenities' => ['Video Conf', 'Projector', 'Whiteboard'],
            'color' => '#3B82F6', // Blue
            'is_active' => true,
        ]);

        \App\Models\Room::create([
            'name' => 'Boardroom A',
            'capacity' => 20,
            'location' => 'Floor 1, Lobby',
            'description' => 'Executive meeting space.',
            'amenities' => ['Video Conf', 'Projector', 'Catering'],
            'color' => '#10B981', // Green
            'is_active' => true,
        ]);

        \App\Models\Room::create([
            'name' => 'Quick Huddle',
            'capacity' => 4,
            'location' => 'Floor 2, West',
            'description' => 'Small room for quick syncs.',
            'amenities' => ['Whiteboard', 'Screen'],
            'color' => '#F59E0B', // Amber
            'is_active' => true,
        ]);
    }
}
