# Workflow Template Management - Current Status

## ⚠️ Current Situation

**Workflow templates are supported** but there's **NO admin UI** to create/edit them yet.

### What Exists:
- ✅ `WorkflowTemplate` model
- ✅ `workflow_templates` database table
- ✅ `WorkflowEngine` service (can execute templates)
- ❌ **NO Controller** (`WorkflowTemplateController`)
- ❌ **NO Admin UI** (no form/page to create/edit)
- ❌ **NO Routes** (no web routes for workflow templates)

### How to Use Currently:

**Option 1: Manual Database Entry**
```php
// Via Tinker or Seeder
WorkflowTemplate::create([
    'name' => 'IT Hardware Purchase',
    'description' => 'Standard workflow for IT hardware purchases',
    'category_id' => 1, // IT Support category
    'workflow_steps' => [
        [
            'step_id' => 1,
            'type' => 'approval',
            'approval_level' => 'lm',
            'approver_type' => 'line_manager',
        ],
        [
            'step_id' => 2,
            'type' => 'approval',
            'approval_level' => 'hod',
            'approver_type' => 'head_of_department',
        ],
    ],
    'approval_rules' => [
        [
            'condition' => [
                'and' => [
                    ['estimated_cost', '<=', 100],
                    ['priority', '==', 'low']
                ]
            ],
            'action' => 'skip_approval',
            'skip_steps' => [1, 2] // Skip LM and HOD
        ]
    ],
    'is_active' => true,
    'priority' => 10,
]);
```

**Option 2: Via Seeder**
Create a `WorkflowTemplateSeeder` to seed common workflows.

---

## 📋 Workflow Template Structure

### workflow_steps (Array)
```json
[
  {
    "step_id": 1,
    "type": "approval",  // or "conditional_approval", "routing", "conditional_routing"
    "approval_level": "lm",  // "lm", "hod", "ceo"
    "approver_type": "line_manager"  // "line_manager", "head_of_department"
  },
  {
    "step_id": 2,
    "type": "conditional_approval",
    "approval_level": "hod",
    "approver_type": "head_of_department",
    "condition": {
      "or": [
        ["priority", "==", "high"],
        ["estimated_cost", ">=", 1000]
      ]
    },
    "if_false": "skip_step"
  }
]
```

### approval_rules (Array)
```json
[
  {
    "condition": {
      "and": [
        ["estimated_cost", "<=", 100],
        ["priority", "==", "low"]
      ]
    },
    "action": "skip_approval",
    "skip_steps": [1, 2]
  },
  {
    "condition": {
      "or": [
        ["category.name", "==", "Hardware Issues"],
        ["priority", "==", "critical"]
      ]
    },
    "action": "auto_approve_and_route"
  }
]
```

---

## 🎯 Next Steps

To make workflow templates accessible, we need to create:

1. **WorkflowTemplateController** - CRUD operations
2. **Admin UI Pages** - List, Create, Edit forms
3. **Routes** - Web routes for workflow template management
4. **Request Validation** - Form request validation

Would you like me to create the admin interface for workflow templates?
