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

        $categories = [
            [
                'name' => 'IT Support',
                'description' => 'General IT issues covering hardware, software, and access.',
                'team_code' => 'IT-SD',
                'children' => [
                    ['name' => 'Hardware', 'description' => 'Laptops, desktops, peripherals.'],
                    ['name' => 'Network & VPN', 'description' => 'Connectivity, VPN, Wi-Fi'],
                    ['name' => 'Application Access', 'description' => 'Login, MFA, permission problems.'],
                ],
            ],
            [
                'name' => 'Site Operations',
                'description' => 'On-site construction operations support.',
                'team_code' => 'FIELD-ENG',
                'children' => [
                    ['name' => 'Equipment Failure', 'description' => 'Cranes, lifts, and heavy machinery.'],
                    ['name' => 'Material Shortage', 'description' => 'Concrete, steel, finishing materials.'],
                    ['name' => 'Site Logistics', 'description' => 'Deliveries, storage, coordination.'],
                ],
            ],
            [
                'name' => 'Safety & Compliance',
                'description' => 'Incidents, audits, and compliance queries.',
                'team_code' => 'HSE',
                'children' => [
                    ['name' => 'Incident Reporting'],
                    ['name' => 'Inspection Follow-up'],
                ],
            ],
            [
                'name' => 'Procurement Requests',
                'description' => 'Purchase orders, vendor management, RFQs.',
                'team_code' => 'PROC',
            ],
            [
                'name' => 'Finance Queries',
                'description' => 'Invoices, payroll, reimbursements.',
                'team_code' => 'FIN',
            ],
        ];

        foreach ($categories as $category) {
            $parent = $this->createCategory($category, null, $teams);

            foreach ($category['children'] ?? [] as $child) {
                $child['team_code'] = $category['team_code'];
                $this->createCategory($child, $parent->id, $teams);
            }
        }
    }

    private function createCategory(array $data, ?int $parentId, $teams): TicketCategory
    {
        $slug = Str::slug($data['name']);

        return TicketCategory::updateOrCreate(
            ['slug' => $slug],
            [
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'parent_id' => $parentId,
                'default_team_id' => $teams[$data['team_code']] ?? null,
                'sort_order' => $data['sort_order'] ?? 0,
                'is_active' => true,
            ]
        );
    }
}


