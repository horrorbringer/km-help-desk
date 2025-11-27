<?php

namespace Database\Seeders;

use App\Models\CustomField;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomFieldSeeder extends Seeder
{
    public function run(): void
    {
        $fields = [
            [
                'name' => 'Site Location',
                'label' => 'Site Location',
                'description' => 'Physical location or address of the issue',
                'field_type' => 'text',
                'is_required' => false,
                'display_order' => 1,
                'placeholder' => 'e.g., Building A, Floor 3, Room 301',
                'help_text' => 'Enter the specific location where the issue occurred',
            ],
            [
                'name' => 'Equipment Serial Number',
                'label' => 'Equipment Serial Number',
                'description' => 'Serial number or asset tag of the equipment',
                'field_type' => 'text',
                'is_required' => false,
                'display_order' => 2,
                'placeholder' => 'e.g., EQ-2024-001',
                'help_text' => 'If applicable, provide the equipment serial number',
            ],
            [
                'name' => 'Impact Level',
                'label' => 'Impact Level',
                'description' => 'How many users or systems are affected',
                'field_type' => 'select',
                'options' => [
                    'Single User' => 'Single User',
                    'Department' => 'Department',
                    'Multiple Departments' => 'Multiple Departments',
                    'Company Wide' => 'Company Wide',
                ],
                'is_required' => false,
                'display_order' => 3,
                'default_value' => 'Single User',
            ],
            [
                'name' => 'Work Hours',
                'label' => 'Work Hours',
                'description' => 'Estimated hours required to resolve',
                'field_type' => 'number',
                'is_required' => false,
                'display_order' => 4,
                'placeholder' => 'e.g., 2.5',
                'help_text' => 'Enter estimated hours (can be decimal)',
            ],
            [
                'name' => 'Vendor Name',
                'label' => 'Vendor Name',
                'description' => 'Name of the vendor or supplier',
                'field_type' => 'text',
                'is_required' => false,
                'display_order' => 5,
                'placeholder' => 'e.g., ABC Construction Supplies',
            ],
            [
                'name' => 'Purchase Order Number',
                'label' => 'PO Number',
                'description' => 'Purchase order or requisition number',
                'field_type' => 'text',
                'is_required' => false,
                'display_order' => 6,
                'placeholder' => 'e.g., PO-2024-1234',
            ],
            [
                'name' => 'Budget Approval',
                'label' => 'Budget Approved',
                'description' => 'Whether budget has been approved for this request',
                'field_type' => 'boolean',
                'is_required' => false,
                'display_order' => 7,
                'default_value' => '0',
            ],
            [
                'name' => 'Incident Type',
                'label' => 'Incident Type',
                'description' => 'Type of safety incident',
                'field_type' => 'select',
                'options' => [
                    'Near Miss' => 'Near Miss',
                    'First Aid' => 'First Aid',
                    'Medical Treatment' => 'Medical Treatment',
                    'Lost Time' => 'Lost Time',
                    'Property Damage' => 'Property Damage',
                ],
                'is_required' => false,
                'display_order' => 8,
            ],
            [
                'name' => 'Witnesses',
                'label' => 'Witnesses',
                'description' => 'Names of witnesses to the incident',
                'field_type' => 'multiselect',
                'options' => [
                    'John Doe' => 'John Doe',
                    'Jane Smith' => 'Jane Smith',
                    'Bob Johnson' => 'Bob Johnson',
                    'Alice Brown' => 'Alice Brown',
                ],
                'is_required' => false,
                'display_order' => 9,
            ],
            [
                'name' => 'Expected Delivery Date',
                'label' => 'Expected Delivery Date',
                'description' => 'When is this item expected to be delivered',
                'field_type' => 'date',
                'is_required' => false,
                'display_order' => 10,
            ],
            [
                'name' => 'Urgency Reason',
                'label' => 'Urgency Reason',
                'description' => 'Why is this request urgent',
                'field_type' => 'textarea',
                'is_required' => false,
                'display_order' => 11,
                'placeholder' => 'Explain why this request requires urgent attention',
            ],
            [
                'name' => 'Related Ticket',
                'label' => 'Related Ticket Number',
                'description' => 'Ticket number of related or duplicate ticket',
                'field_type' => 'text',
                'is_required' => false,
                'display_order' => 12,
                'placeholder' => 'e.g., KT-10001',
            ],
        ];

        foreach ($fields as $field) {
            $slug = Str::slug($field['name']);

            CustomField::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $field['name'],
                    'slug' => $slug,
                    'label' => $field['label'] ?? $field['name'],
                    'description' => $field['description'] ?? null,
                    'field_type' => $field['field_type'],
                    'options' => $field['options'] ?? null,
                    'default_value' => $field['default_value'] ?? null,
                    'is_required' => $field['is_required'] ?? false,
                    'is_active' => true,
                    'display_order' => $field['display_order'] ?? 0,
                    'placeholder' => $field['placeholder'] ?? null,
                    'help_text' => $field['help_text'] ?? null,
                ]
            );
        }
    }
}
