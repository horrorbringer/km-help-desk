<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'IT Service Desk',
                'code' => 'IT-SD',
                'is_support_team' => true,
                'description' => 'Central IT help desk handling software, hardware, network issues, and IT support requests.',
            ],
            [
                'name' => 'Field Engineering',
                'code' => 'FIELD-ENG',
                'is_support_team' => true,
                'description' => 'Supports on-site construction teams, equipment maintenance, and field operations.',
            ],
            [
                'name' => 'Procurement',
                'code' => 'PROC',
                'description' => 'Handles purchasing requests, vendor management, RFQs, and procurement processes.',
            ],
            [
                'name' => 'Health & Safety',
                'code' => 'HSE',
                'is_support_team' => true,
                'description' => 'Ensures compliance with safety standards, incident management, and environmental compliance.',
            ],
            [
                'name' => 'Finance & Accounts',
                'code' => 'FIN',
                'description' => 'Oversees budget management, invoicing, payroll, expense processing, and financial reporting.',
            ],
            [
                'name' => 'Human Resources',
                'code' => 'HR',
                'description' => 'Manages recruitment, employee relations, benefits, leave, training, and HR policies.',
            ],
            [
                'name' => 'Facilities & Maintenance',
                'code' => 'FACILITIES',
                'is_support_team' => true,
                'description' => 'Office facilities management, building maintenance, cleaning services, and workspace setup.',
            ],
        ];

        foreach ($departments as $data) {
            Department::updateOrCreate(
                ['code' => $data['code']],
                $data + ['is_active' => true]
            );
        }
    }
}


