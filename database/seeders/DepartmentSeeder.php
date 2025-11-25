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
                'description' => 'Central IT help desk handling software, hardware, and network issues.',
            ],
            [
                'name' => 'Field Engineering',
                'code' => 'FIELD-ENG',
                'is_support_team' => true,
                'description' => 'Supports on-site construction teams and equipment.',
            ],
            [
                'name' => 'Procurement',
                'code' => 'PROC',
                'description' => 'Handles purchasing requests and vendor coordination.',
            ],
            [
                'name' => 'Health & Safety',
                'code' => 'HSE',
                'is_support_team' => true,
                'description' => 'Ensures compliance with safety standards across projects.',
            ],
            [
                'name' => 'Finance & Accounts',
                'code' => 'FIN',
                'description' => 'Oversees budget, invoicing, and payroll queries.',
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


