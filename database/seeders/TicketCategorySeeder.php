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
                'requires_approval' => true, // Hardware/software requests need approval
                'children' => [
                    [
                        'name' => 'Hardware', 
                        'description' => 'Laptops, desktops, peripherals.',
                        'requires_approval' => true, // Hardware purchases need approval
                        'requires_hod_approval' => true, // Expensive hardware needs HOD approval
                        'hod_approval_threshold' => 1000.00,
                    ],
                    [
                        'name' => 'Network & VPN', 
                        'description' => 'Connectivity, VPN, Wi-Fi',
                        'requires_approval' => false, // Routine network issues don't need approval
                    ],
                    [
                        'name' => 'Application Access', 
                        'description' => 'Login, MFA, permission problems.',
                        'requires_approval' => false, // Access requests are routine
                    ],
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
                'requires_approval' => true,
                'requires_hod_approval' => true, // Purchases need HOD approval
                'hod_approval_threshold' => 500.00, // HOD approval for purchases > $500
            ],
            [
                'name' => 'Finance Queries',
                'description' => 'Invoices, payroll, reimbursements.',
                'team_code' => 'FIN',
                'requires_approval' => false, // Routine queries don't need approval
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

        // Real-world approval settings:
        // - IT Support: Requires approval (hardware/software requests need budget approval)
        // - Site Operations: Requires approval (equipment failures need management approval)
        // - Safety & Compliance: Requires approval (incidents need review)
        // - Procurement: Requires approval + HOD approval (purchases need budget approval)
        // - Finance Queries: No approval needed (routine queries)
        
        $requiresApproval = $data['requires_approval'] ?? true;
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
                'sort_order' => $data['sort_order'] ?? 0,
                'is_active' => true,
                'requires_approval' => $requiresApproval,
                'requires_hod_approval' => $requiresHODApproval,
                'hod_approval_threshold' => $hodThreshold,
            ]
        );
    }
}


