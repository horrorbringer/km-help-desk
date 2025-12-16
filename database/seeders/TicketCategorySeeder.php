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

        // Only IT Support categories
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
