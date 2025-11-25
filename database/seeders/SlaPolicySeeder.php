<?php

namespace Database\Seeders;

use App\Models\SlaPolicy;
use Illuminate\Database\Seeder;

class SlaPolicySeeder extends Seeder
{
    public function run(): void
    {
        $policies = [
            [
                'name' => 'Standard SLA',
                'description' => 'Default SLA for most tickets.',
                'priority' => 'medium',
                'response_time' => 120,
                'resolution_time' => 1440,
            ],
            [
                'name' => 'High Priority SLA',
                'description' => 'Escalated issues affecting live construction sites.',
                'priority' => 'high',
                'response_time' => 60,
                'resolution_time' => 480,
            ],
            [
                'name' => 'Critical Incident SLA',
                'description' => 'Life-safety or critical system outages.',
                'priority' => 'critical',
                'response_time' => 15,
                'resolution_time' => 120,
            ],
        ];

        foreach ($policies as $policy) {
            SlaPolicy::updateOrCreate(
                ['name' => $policy['name']],
                $policy + ['is_active' => true]
            );
        }
    }
}


