<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\TicketCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TicketCategorySeeder extends Seeder
{
    public function run(): void
    {
        $teams = Department::pluck('id', 'code');

        // Only include categories that are actually used in other seeders
        $categories = [
            [
                'name' => 'IT Support',
                'description' => 'Information Technology support covering hardware, software, network, and access management.',
                'team_code' => 'IT-SD',
                'sort_order' => 10,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Hardware Requests',
                        'description' => 'New hardware purchases: laptops, desktops, monitors, printers, mobile devices, and peripherals.',
                        'sort_order' => 11,
                        'requires_approval' => true,
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 1000.00,
                    ],
                    [
                        'name' => 'Hardware Issues',
                        'description' => 'Hardware problems: broken devices, repairs, replacements, warranty claims.',
                        'sort_order' => 12,
                        'requires_approval' => false,
                    ],
                    [
                        'name' => 'Application Access',
                        'description' => 'Request access to applications, systems, or shared resources. Password resets and MFA issues.',
                        'sort_order' => 13,
                        'requires_approval' => false,
                    ],
                    [
                        'name' => 'Network & Connectivity',
                        'description' => 'Network issues: VPN access, Wi-Fi problems, internet connectivity, network configuration.',
                        'sort_order' => 14,
                        'requires_approval' => false,
                    ],
                ],
            ],
            [
                'name' => 'Site Operations',
                'description' => 'Field operations support for construction sites, equipment, and logistics.',
                'team_code' => 'FIELD-ENG',
                'sort_order' => 20,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Equipment Failure',
                        'description' => 'Heavy machinery breakdowns: cranes, excavators, lifts, generators, and construction equipment.',
                        'sort_order' => 21,
                        'requires_approval' => true,
                    ],
                ],
            ],
            [
                'name' => 'Safety & Compliance',
                'description' => 'Health, safety, environmental compliance, and incident reporting.',
                'team_code' => 'HSE',
                'sort_order' => 30,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Incident Reporting',
                        'description' => 'Report workplace incidents, accidents, near misses, or injuries.',
                        'sort_order' => 31,
                        'requires_approval' => true,
                    ],
                ],
            ],
            [
                'name' => 'Procurement',
                'description' => 'Purchase requests, vendor management, RFQs, and procurement support.',
                'team_code' => 'PROC',
                'sort_order' => 40,
                'requires_approval' => true,
                'requires_hod_approval' => false,
                'hod_approval_threshold' => 500.00,
                'children' => [
                    [
                        'name' => 'Purchase Request',
                        'description' => 'Submit new purchase requests for goods or services.',
                        'sort_order' => 41,
                        'requires_approval' => true,
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 500.00,
                    ],
                ],
            ],
            [
                'name' => 'Finance & Accounting',
                'description' => 'Financial queries, invoicing, payroll, reimbursements, and budget questions.',
                'team_code' => 'FIN',
                'sort_order' => 50,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Invoice Processing',
                        'description' => 'Invoice submission, payment status, invoice disputes, and payment queries.',
                        'sort_order' => 51,
                        'requires_approval' => false,
                    ],
                    [
                        'name' => 'Expense Reimbursement',
                        'description' => 'Submit expense reports, reimbursement requests, and travel expense claims.',
                        'sort_order' => 52,
                        'requires_approval' => true,
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 1000.00,
                    ],
                ],
            ],
        ];

        foreach ($categories as $category) {
            $parent = $this->createCategory($category, null, $teams, $category['sort_order']);

            if (isset($category['children'])) {
                foreach ($category['children'] as $child) {
                    $child['team_code'] = $category['team_code'];
                    $this->createCategory($child, $parent->id, $teams, $child['sort_order']);
                }
            }
        }
    }

    private function createCategory(array $data, ?int $parentId, $teams, int $sortOrder = 0): TicketCategory
    {
        $slug = Str::slug($data['name']);

        $requiresApproval = $data['requires_approval'] ?? false;
        $requiresHODApproval = $data['requires_hod_approval'] ?? false;
        $hodThreshold = $data['hod_approval_threshold'] ?? null;

        return TicketCategory::updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'parent_id' => $parentId,
                'default_team_id' => $teams[$data['team_code']] ?? null,
                'sort_order' => $sortOrder,
                'is_active' => true,
                'requires_approval' => $requiresApproval,
                'requires_hod_approval' => $requiresHODApproval,
                'hod_approval_threshold' => $hodThreshold,
            ]
        );
    }
}
