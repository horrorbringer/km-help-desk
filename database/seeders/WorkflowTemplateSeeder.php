<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\TicketCategory;
use App\Models\WorkflowTemplate;
use Illuminate\Database\Seeder;

class WorkflowTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $categories = TicketCategory::all()->keyBy('slug');
        $departments = Department::all()->keyBy('code');
        
        $itCategory = $categories->get('hardware-issues') ?? $categories->first();
        $itDepartment = $departments->get('IT-SD') ?? $departments->where('code', 'IT')->first() ?? $departments->first();

        $templates = [
            [
                'name' => 'Global Default Approval Workflow',
                'description' => 'System-wide default: LM Approval -> Optional HOD (cost/priority) -> Optional CEO (high cost) -> Route to Team.',
                'category_id' => null,
                'department_id' => null,
                'workflow_steps' => [
                    [
                        'step_id' => 1,
                        'type' => 'conditional_approval',
                        'approval_level' => 'lm',
                        'approver_type' => 'line_manager',
                        'condition' => [
                            'or' => [
                                ['category.requires_approval', '==', true],
                                ['priority', 'in', ['high', 'critical']],
                                ['estimated_cost', '>=', 1000] // Default threshold
                            ]
                        ],
                        'if_false' => 'route_directly'
                    ],
                    [
                        'step_id' => 2,
                        'type' => 'conditional_approval',
                        'approval_level' => 'hod',
                        'approver_type' => 'head_of_department',
                        'condition' => [
                            'or' => [
                                ['category.requires_hod_approval', '==', true],
                                ['priority', 'in', ['high', 'critical']],
                                ['estimated_cost', '>=', 5000] // Default HOD threshold
                            ]
                        ]
                    ],
                    [
                        'step_id' => 3,
                        'type' => 'conditional_approval',
                        'approval_level' => 'ceo',
                        'approver_type' => 'ceo',
                        'condition' => [
                            ['estimated_cost', '>=', 10000] // CEO threshold
                        ]
                    ],
                    [
                        'step_id' => 4,
                        'type' => 'routing',
                        'route_to' => 'category_default_team',
                    ],
                ],
                'routing_rules' => [],
                'approval_rules' => [],
                'is_active' => true,
                'priority' => 1, // Lowest priority, acts as fallback
            ],
            [
                'name' => 'IT Hardware Issue Workflow',
                'description' => 'For IT hardware issues (computer, printer fixes). HOD notified, LM/DLM approves, routes to IT team.',
                'category_id' => $itCategory?->id,
                'department_id' => null, // Applies to all departments
                'workflow_steps' => [
                    [
                        'step_id' => 1,
                        'type' => 'notification',
                        'notify_type' => 'head_of_department',
                    ],
                    [
                        'step_id' => 2,
                        'type' => 'approval',
                        'approval_level' => 'lm',
                        'approver_type' => 'line_manager',
                    ],
                    [
                        'step_id' => 3,
                        'type' => 'routing',
                        'route_to' => 'category_default_team',
                    ],
                    [
                        'step_id' => 4,
                        'type' => 'assignment',
                        'assign_to' => 'approver', // Assign to LM/DLM who approved
                    ],
                ],
                'routing_rules' => [],
                'approval_rules' => [],
                'is_active' => true,
                'priority' => 10,
            ],
        ];

        foreach ($templates as $templateData) {
            WorkflowTemplate::updateOrCreate(
                [
                    'name' => $templateData['name'],
                    'category_id' => $templateData['category_id'],
                ],
                $templateData
            );
        }

        $this->command->info('Workflow templates seeded successfully.');
    }
}