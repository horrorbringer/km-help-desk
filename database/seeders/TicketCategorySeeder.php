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
                'description' => 'Information Technology support covering hardware, software, network, and access management.',
                'team_code' => 'IT-SD',
                'sort_order' => 10,
                'requires_approval' => false, // Parent category - approval handled by children
                'children' => [
                    [
                        'name' => 'Hardware Requests',
                        'description' => 'New hardware purchases: laptops, desktops, monitors, printers, mobile devices, and peripherals.',
                        'sort_order' => 11,
                        'requires_approval' => true,
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 1000.00, // HOD approval for purchases >= $1,000
                    ],
                    [
                        'name' => 'Hardware Issues',
                        'description' => 'Hardware problems: broken devices, repairs, replacements, warranty claims.',
                        'sort_order' => 12,
                        'requires_approval' => false, // Repairs don't need approval
                    ],
                    [
                        'name' => 'Software Installation',
                        'description' => 'Request new software installation, licenses, or software updates.',
                        'sort_order' => 13,
                        'requires_approval' => true, // Software purchases need approval
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 500.00, // HOD approval for software >= $500
                    ],
                    [
                        'name' => 'Application Access',
                        'description' => 'Request access to applications, systems, or shared resources. Password resets and MFA issues.',
                        'sort_order' => 14,
                        'requires_approval' => false, // Access requests are routine
                    ],
                    [
                        'name' => 'Network & Connectivity',
                        'description' => 'Network issues: VPN access, Wi-Fi problems, internet connectivity, network configuration.',
                        'sort_order' => 15,
                        'requires_approval' => false, // Network troubleshooting is routine
                    ],
                    [
                        'name' => 'Email & Communication',
                        'description' => 'Email issues: Outlook problems, email delivery, calendar sync, Teams/Slack issues.',
                        'sort_order' => 16,
                        'requires_approval' => false,
                    ],
                    [
                        'name' => 'Security & Permissions',
                        'description' => 'Security concerns: suspicious activity, permission changes, security policy questions.',
                        'sort_order' => 17,
                        'requires_approval' => true, // Security changes need approval
                    ],
                    [
                        'name' => 'Account Management',
                        'description' => 'User account creation, modification, deactivation, or deletion requests.',
                        'sort_order' => 18,
                        'requires_approval' => true, // Account changes need approval
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
                        'requires_approval' => true, // Equipment repairs need approval
                    ],
                    [
                        'name' => 'Equipment Maintenance',
                        'description' => 'Scheduled maintenance requests, inspections, and preventive maintenance.',
                        'sort_order' => 22,
                        'requires_approval' => false, // Routine maintenance
                    ],
                    [
                        'name' => 'Material Shortage',
                        'description' => 'Material requests: concrete, steel, lumber, finishing materials, and supplies.',
                        'sort_order' => 23,
                        'requires_approval' => true, // Material purchases need approval
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 2000.00, // HOD approval for materials >= $2,000
                    ],
                    [
                        'name' => 'Site Logistics',
                        'description' => 'Delivery coordination, storage management, site access, and logistics support.',
                        'sort_order' => 24,
                        'requires_approval' => false,
                    ],
                    [
                        'name' => 'Site Access & Security',
                        'description' => 'Site access requests, badge issues, gate access, and security concerns.',
                        'sort_order' => 25,
                        'requires_approval' => true, // Access requests need approval
                    ],
                    [
                        'name' => 'Utility & Infrastructure',
                        'description' => 'Power, water, gas, telecommunications, and infrastructure issues on site.',
                        'sort_order' => 26,
                        'requires_approval' => true, // Utility work needs approval
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
                        'requires_approval' => true, // Incidents need review
                    ],
                    [
                        'name' => 'Safety Inspection',
                        'description' => 'Request safety inspections, follow-up on inspection findings, compliance checks.',
                        'sort_order' => 32,
                        'requires_approval' => false, // Inspection requests are routine
                    ],
                    [
                        'name' => 'Safety Equipment',
                        'description' => 'Request safety equipment: PPE, first aid supplies, safety signage, emergency equipment.',
                        'sort_order' => 33,
                        'requires_approval' => true, // Equipment purchases need approval
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 500.00, // HOD approval for safety equipment >= $500
                    ],
                    [
                        'name' => 'Training & Certification',
                        'description' => 'Safety training requests, certification renewals, and compliance training.',
                        'sort_order' => 34,
                        'requires_approval' => true, // Training costs need approval
                    ],
                    [
                        'name' => 'Environmental Compliance',
                        'description' => 'Environmental concerns, waste management, pollution control, regulatory compliance.',
                        'sort_order' => 35,
                        'requires_approval' => true, // Compliance issues need review
                    ],
                ],
            ],
            [
                'name' => 'Procurement',
                'description' => 'Purchase requests, vendor management, RFQs, and procurement support.',
                'team_code' => 'PROC',
                'sort_order' => 40,
                'requires_approval' => true, // All procurement needs approval
                'requires_hod_approval' => false,
                'hod_approval_threshold' => 500.00, // HOD approval for purchases >= $500
                'children' => [
                    [
                        'name' => 'Purchase Request',
                        'description' => 'Submit new purchase requests for goods or services.',
                        'sort_order' => 41,
                        'requires_approval' => true,
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 500.00,
                    ],
                    [
                        'name' => 'Vendor Management',
                        'description' => 'Vendor registration, contract management, vendor performance issues.',
                        'sort_order' => 42,
                        'requires_approval' => true, // Vendor changes need approval
                    ],
                    [
                        'name' => 'RFQ & Bidding',
                        'description' => 'Request for Quotation, bid management, and procurement process support.',
                        'sort_order' => 43,
                        'requires_approval' => true, // Bidding processes need approval
                    ],
                    [
                        'name' => 'Purchase Order Status',
                        'description' => 'Check PO status, delivery tracking, invoice matching, and payment queries.',
                        'sort_order' => 44,
                        'requires_approval' => false, // Status queries don't need approval
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
                        'requires_approval' => true, // Reimbursements need approval
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 1000.00, // HOD approval for expenses >= $1,000
                    ],
                    [
                        'name' => 'Payroll Queries',
                        'description' => 'Payroll questions, salary adjustments, timesheet issues, and pay discrepancies.',
                        'sort_order' => 53,
                        'requires_approval' => true, // Payroll changes need approval
                    ],
                    [
                        'name' => 'Budget & Reporting',
                        'description' => 'Budget inquiries, financial reports, cost analysis, and budget approvals.',
                        'sort_order' => 54,
                        'requires_approval' => false, // Queries don't need approval
                    ],
                    [
                        'name' => 'Vendor Payments',
                        'description' => 'Vendor payment status, payment disputes, and payment method changes.',
                        'sort_order' => 55,
                        'requires_approval' => true, // Payment changes need approval
                    ],
                ],
            ],
            [
                'name' => 'Human Resources',
                'description' => 'HR services: recruitment, employee relations, benefits, and policy questions.',
                'team_code' => 'FIN', // Using FIN as placeholder - adjust if HR department exists
                'sort_order' => 60,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Recruitment',
                        'description' => 'Job postings, candidate screening, interview scheduling, and hiring requests.',
                        'sort_order' => 61,
                        'requires_approval' => true, // Hiring needs approval
                    ],
                    [
                        'name' => 'Employee Relations',
                        'description' => 'Employee concerns, complaints, disciplinary actions, and workplace conflicts.',
                        'sort_order' => 62,
                        'requires_approval' => true, // Employee relations issues need review
                    ],
                    [
                        'name' => 'Benefits & Leave',
                        'description' => 'Benefits enrollment, leave requests, time-off management, and benefits questions.',
                        'sort_order' => 63,
                        'requires_approval' => true, // Leave requests need approval
                    ],
                    [
                        'name' => 'Policy & Compliance',
                        'description' => 'HR policy questions, compliance queries, and policy update requests.',
                        'sort_order' => 64,
                        'requires_approval' => false, // Policy queries don't need approval
                    ],
                ],
            ],
            [
                'name' => 'Facilities & Maintenance',
                'description' => 'Office facilities, building maintenance, cleaning, and workspace management.',
                'team_code' => 'FIELD-ENG', // Using FIELD-ENG as placeholder - adjust if Facilities department exists
                'sort_order' => 70,
                'requires_approval' => false,
                'children' => [
                    [
                        'name' => 'Office Maintenance',
                        'description' => 'Building repairs, HVAC issues, plumbing, electrical, and general maintenance.',
                        'sort_order' => 71,
                        'requires_approval' => true, // Maintenance work needs approval
                        'requires_hod_approval' => false,
                        'hod_approval_threshold' => 1000.00, // HOD approval for major repairs >= $1,000
                    ],
                    [
                        'name' => 'Cleaning & Janitorial',
                        'description' => 'Cleaning requests, janitorial services, waste management, and sanitation issues.',
                        'sort_order' => 72,
                        'requires_approval' => false, // Routine cleaning
                    ],
                    [
                        'name' => 'Workspace Setup',
                        'description' => 'Office setup, desk moves, furniture requests, and workspace configuration.',
                        'sort_order' => 73,
                        'requires_approval' => true, // Workspace changes need approval
                    ],
                    [
                        'name' => 'Access Cards & Keys',
                        'description' => 'Office key requests, access card issues, and building access management.',
                        'sort_order' => 74,
                        'requires_approval' => true, // Access requests need approval
                    ],
                ],
            ],
        ];

        $sortOrder = 0;
        foreach ($categories as $category) {
            $parent = $this->createCategory($category, null, $teams, $sortOrder++);

            if (isset($category['children'])) {
                $childSortOrder = 0;
                foreach ($category['children'] as $child) {
                    $child['team_code'] = $category['team_code'];
                    $this->createCategory($child, $parent->id, $teams, $childSortOrder++);
                }
            }
        }
    }

    private function createCategory(array $data, ?int $parentId, $teams, int $sortOrder = 0): TicketCategory
    {
        $slug = Str::slug($data['name']);

        // Use provided sort_order or fall back to passed parameter
        $finalSortOrder = $data['sort_order'] ?? $sortOrder;
        
        // Real-world approval settings:
        // - Hardware/Software Purchases: Require approval with cost thresholds
        // - Access Requests: Some require approval (security-sensitive)
        // - Repairs/Maintenance: Usually routine, but major repairs need approval
        // - Procurement: All purchases need approval with HOD threshold
        // - Safety Incidents: Require review and approval
        // - Routine Queries: No approval needed
        
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
                'sort_order' => $finalSortOrder,
                'is_active' => true,
                'requires_approval' => $requiresApproval,
                'requires_hod_approval' => $requiresHODApproval,
                'hod_approval_threshold' => $hodThreshold,
            ]
        );
    }
}


