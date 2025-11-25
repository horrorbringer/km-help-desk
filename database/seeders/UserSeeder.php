<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::pluck('id', 'code');

        $users = [
            [
                'name' => 'System Administrator',
                'email' => 'admin@kimmix.test',
                'department_code' => 'IT-SD',
                'employee_id' => 'EMP-1001',
            ],
            [
                'name' => 'Field Ops Manager',
                'email' => 'field.manager@kimmix.test',
                'department_code' => 'FIELD-ENG',
                'employee_id' => 'EMP-1020',
            ],
            [
                'name' => 'Procurement Lead',
                'email' => 'procurement@kimmix.test',
                'department_code' => 'PROC',
                'employee_id' => 'EMP-1050',
            ],
            [
                'name' => 'Finance Analyst',
                'email' => 'finance@kimmix.test',
                'department_code' => 'FIN',
                'employee_id' => 'EMP-1075',
            ],
            [
                'name' => 'Safety Officer',
                'email' => 'safety@kimmix.test',
                'department_code' => 'HSE',
                'employee_id' => 'EMP-1100',
            ],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                [
                    'name' => $user['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'department_id' => $departments[$user['department_code']] ?? null,
                    'employee_id' => $user['employee_id'],
                    'is_active' => true,
                ]
            );
        }
    }
}


