<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        // Find project managers
        $manager1 = User::where('email', 'vannak@kimmix.com')->first();
        $manager2 = User::where('email', 'manager01@kimmix.com')->first();

        $projects = [
            [
                'name' => 'Downtown Tower Expansion',
                'code' => 'PRJ-DTE-01',
                'description' => 'High-rise expansion project including 12 new floors and facade retrofit. This project involves extensive structural work, modernizing the building\'s infrastructure, and upgrading HVAC systems.',
                'location' => 'Downtown Metro, Phnom Penh',
                'status' => 'active',
                'start_date' => now()->subMonths(6)->toDateString(),
                'end_date' => now()->addMonths(12)->toDateString(),
                'project_manager_id' => optional($manager1)->id,
            ],
            [
                'name' => 'Riverside Bridge Upgrade',
                'code' => 'PRJ-RBU-02',
                'description' => 'Structural reinforcement and widening of the Riverside arterial bridge. Includes seismic retrofitting and adding two additional lanes for increased traffic capacity.',
                'location' => 'Riverside Industrial Park, Phnom Penh',
                'status' => 'planning',
                'start_date' => now()->addMonth()->toDateString(),
                'end_date' => now()->addMonths(18)->toDateString(),
                'project_manager_id' => optional($manager1)->id,
            ],
            [
                'name' => 'Central Market Renovation',
                'code' => 'PRJ-CMR-03',
                'description' => 'Complete renovation of the historic central market building. Includes electrical upgrades, plumbing modernization, and facade restoration.',
                'location' => 'Central Market, Phnom Penh',
                'status' => 'active',
                'start_date' => now()->subMonths(3)->toDateString(),
                'end_date' => now()->addMonths(9)->toDateString(),
                'project_manager_id' => optional($manager2)->id,
            ],
            [
                'name' => 'Residential Complex Phase 2',
                'code' => 'PRJ-RCP-04',
                'description' => 'Construction of 200-unit residential complex with parking facilities, landscaping, and community amenities.',
                'location' => 'Chroy Changvar, Phnom Penh',
                'status' => 'active',
                'start_date' => now()->subMonths(2)->toDateString(),
                'end_date' => now()->addMonths(16)->toDateString(),
                'project_manager_id' => optional($manager1)->id,
            ],
            [
                'name' => 'Highway Expansion Project',
                'code' => 'PRJ-HEP-05',
                'description' => 'Expansion of National Highway 1 from 2 lanes to 4 lanes, including new bridges and interchanges.',
                'location' => 'National Highway 1, Kandal Province',
                'status' => 'on_hold',
                'start_date' => now()->addMonths(3)->toDateString(),
                'end_date' => now()->addMonths(24)->toDateString(),
                'project_manager_id' => optional($manager2)->id,
            ],
        ];

        foreach ($projects as $project) {
            Project::updateOrCreate(
                ['code' => $project['code']],
                $project + ['is_active' => true]
            );
        }
    }
}


