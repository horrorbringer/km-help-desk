<?php

namespace Database\Seeders;

use App\Models\SlaPolicy;
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

        if (! $defaultUser) {
            $this->command->error('No users found. Please run UserSeeder first.');

            return;
        }

        $categories = TicketCategory::all()->keyBy('slug');
        $departments = \App\Models\Department::all();
        $itDepartment = $departments->where('code', 'IT')->first() ?? $departments->first();
        $slaPolicies = SlaPolicy::query()->get()->keyBy('priority');

        $templates = [
            [
                'name' => 'Computer Fix Request',
                'description' => 'Request to fix computer issues (slow performance, crashes, errors, etc.)',
                'template_data' => [
                    'subject' => 'Computer Fix Request: [Computer Model/ID]',
                    'description' => "Please provide the following information:\n\n1. Computer Model/Asset ID:\n2. Issue Description:\n3. When did the issue start?\n4. Error Messages (if any):\n5. Steps already taken:\n6. Urgency Level:\n7. Is this affecting your work?",
                    'category_id' => $categories->get('hardware-issues')?->id,
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
                'name' => 'Printer Fix Request',
                'description' => 'Request to fix printer issues (not printing, paper jams, connectivity, etc.)',
                'template_data' => [
                    'subject' => 'Printer Fix Request: [Printer Location/Model]',
                    'description' => "Please provide the following information:\n\n1. Printer Location/Name:\n2. Printer Model:\n3. Issue Description:\n4. Error Messages (if any):\n5. When did the issue start?\n6. Steps already taken:\n7. Urgency Level:",
                    'category_id' => $categories->get('hardware-issues')?->id,
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
                'name' => 'Hardware Issue Report',
                'description' => 'Template for reporting hardware problems (laptops, monitors, printers, etc.)',
                'template_data' => [
                    'subject' => 'Hardware Issue: [Device Type]',
                    'description' => "Please provide the following information:\n\n1. Device Type:\n2. Device Model/Serial Number:\n3. Issue Description:\n4. When did the issue start?\n5. Steps already taken:\n6. Urgency Level:",
                    'category_id' => $categories->get('hardware-issues')?->id,
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
                'name' => 'Software License Issue',
                'slug' => 'office-license-expired',
                'description' => 'Use when a software license, activation, or subscription issue is blocking work.',
                'template_data' => [
                    'subject' => 'Software license issue: [Application / Device]',
                    'description' => "A software license, activation, or subscription is preventing normal work.\n\n1. Application affected:\n2. Exact error message:\n3. Device name:\n4. Is work currently blocked?: Yes / No\n5. Screenshot attached?: Yes / No",
                    'category_id' => $categories->get('software-license-issues')?->id,
                    'assigned_team_id' => $itDepartment?->id,
                    'priority' => 'high',
                    'status' => 'open',
                    'source' => 'web',
                    'sla_policy_id' => $slaPolicies->get('high')?->id,
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
                    'category_id' => $categories->get('network-connectivity')?->id,
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
