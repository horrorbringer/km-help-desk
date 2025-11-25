<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $manager = User::where('email', 'field.manager@kimmix.test')->first();

        $projects = [
            [
                'name' => 'Downtown Tower Expansion',
                'code' => 'PRJ-DTE-01',
                'description' => 'High-rise expansion project including 12 new floors and facade retrofit.',
                'location' => 'Downtown Metro',
                'status' => 'active',
                'start_date' => now()->subMonths(6)->toDateString(),
                'end_date' => now()->addMonths(12)->toDateString(),
                'project_manager_id' => optional($manager)->id,
            ],
            [
                'name' => 'Riverside Bridge Upgrade',
                'code' => 'PRJ-RBU-02',
                'description' => 'Structural reinforcement and widening of the Riverside arterial bridge.',
                'location' => 'Riverside Industrial Park',
                'status' => 'planning',
                'start_date' => now()->addMonth()->toDateString(),
                'project_manager_id' => optional($manager)->id,
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


