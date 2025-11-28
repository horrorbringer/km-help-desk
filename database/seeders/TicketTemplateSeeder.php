<?php

namespace Database\Seeders;

use App\Models\TicketCategory;
use App\Models\TicketTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class TicketTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Get a default user for created_by
        $defaultUser = User::role('Super Admin')->first() 
            ?? User::where('email', 'makara@kimmix.com')->first()
            ?? User::first();

        if (!$defaultUser) {
            $this->command->error('No users found. Please run UserSeeder first.');
            return;
        }

        $categories = TicketCategory::all()->keyBy('slug');
        $departments = \App\Models\Department::all();
        $itDepartment = $departments->where('code', 'IT')->first() ?? $departments->first();

        $templates = [
            [
                'name' => 'Hardware Issue Report',
                'description' => 'Template for reporting hardware problems (laptops, monitors, printers, etc.)',
                'template_data' => [
                    'subject' => 'Hardware Issue: [Device Type]',
                    'description' => "Please provide the following information:\n\n1. Device Type:\n2. Device Model/Serial Number:\n3. Issue Description:\n4. When did the issue start?\n5. Steps already taken:\n6. Urgency Level:",
                    'category_id' => $categories->get('hardware')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'medium',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Software Access Request',
                'description' => 'Template for requesting access to software applications',
                'template_data' => [
                    'subject' => 'Software Access Request: [Application Name]',
                    'description' => "Please provide the following information:\n\n1. Application Name:\n2. Business Justification:\n3. Required Access Level:\n4. Expected Start Date:\n5. Duration (if temporary):",
                    'category_id' => $categories->get('application-access')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'medium',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Network/VPN Issue',
                'description' => 'Template for reporting network connectivity or VPN problems',
                'template_data' => [
                    'subject' => 'Network/VPN Connectivity Issue',
                    'description' => "Please provide the following information:\n\n1. Location (Office/Remote):\n2. Device Type:\n3. Error Message (if any):\n4. When did the issue start?\n5. Can you access other websites?\n6. VPN Client Version:",
                    'category_id' => $categories->get('network-vpn')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'high',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Password Reset Request',
                'description' => 'Template for password reset requests',
                'template_data' => [
                    'subject' => 'Password Reset Request',
                    'description' => "Please provide the following information:\n\n1. Username/Email:\n2. System/Application:\n3. Last Password Change Date (if known):\n4. Reason for Reset:",
                    'category_id' => $categories->get('application-access')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'high',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Procurement Request',
                'description' => 'Template for IT equipment and software procurement requests',
                'template_data' => [
                    'subject' => 'Procurement Request: [Item Name]',
                    'description' => "Please provide the following information:\n\n1. Item Description:\n2. Quantity:\n3. Business Justification:\n4. Budget Code:\n5. Required Delivery Date:\n6. Preferred Vendor (if any):",
                    'category_id' => $categories->get('procurement-requests')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'medium',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Security Incident Report',
                'description' => 'Template for reporting security incidents and suspicious activities',
                'template_data' => [
                    'subject' => 'Security Incident Report',
                    'description' => "Please provide the following information:\n\n1. Incident Type:\n2. Date and Time:\n3. Affected Systems/Users:\n4. Description of Incident:\n5. Potential Impact:\n6. Immediate Actions Taken:",
                    'category_id' => $categories->get('incident-reporting')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'critical',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'Equipment Failure Report',
                'description' => 'Template for reporting equipment failures and malfunctions',
                'template_data' => [
                    'subject' => 'Equipment Failure: [Equipment Type]',
                    'description' => "Please provide the following information:\n\n1. Equipment Type and Model:\n2. Serial Number:\n3. Location:\n4. Failure Description:\n5. Error Messages/Indicators:\n6. Last Known Working Date:\n7. Impact on Operations:",
                    'category_id' => $categories->get('equipment-failure')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'high',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
            [
                'name' => 'General IT Support',
                'description' => 'General purpose template for miscellaneous IT support requests',
                'template_data' => [
                    'subject' => 'IT Support Request',
                    'description' => "Please describe your issue or request in detail:\n\n1. What are you trying to accomplish?\n2. What is the current behavior?\n3. What is the expected behavior?\n4. Steps to reproduce (if applicable):\n5. Screenshots or error messages:",
                    'category_id' => $categories->first()?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'medium',
                    'status' => 'open',
                    'source' => 'web',
                ],
                'is_active' => true,
                'is_public' => true,
                'created_by' => $defaultUser->id,
            ],
        ];

        foreach ($templates as $templateData) {
            TicketTemplate::updateOrCreate(
                ['slug' => \Illuminate\Support\Str::slug($templateData['name'])],
                $templateData
            );
        }

        $this->command->info('Ticket templates seeded successfully.');
    }
}

