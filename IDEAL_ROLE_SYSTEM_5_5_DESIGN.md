# Ideal Role System & Approval Workflow: 5/5 Design

## 🎯 What Makes a 5/5 System?

A **perfect 5/5 system** would have:
1. ✅ **Fully Dynamic Roles** (database-driven, not hardcoded)
2. ✅ **Flexible Hierarchy** (customizable organizational structure)
3. ✅ **Workflow Builder** (visual/database-driven workflow configuration)
4. ✅ **Multi-Tenant Support** (different workflows per department/organization)
5. ✅ **Rule Engine** (complex conditional logic without code changes)

---

## 🏗️ Architecture: 5/5 Role System

### 1. Dynamic Role Management

```php
// Database Schema
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->integer('hierarchy_level')->default(0); // 0 = lowest, 10 = highest
    $table->foreignId('parent_role_id')->nullable(); // For role hierarchy
    $table->json('metadata')->nullable(); // Custom role properties
    $table->boolean('is_system_role')->default(false); // Cannot be deleted
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// Example Data
[
    'name' => 'Line Manager',
    'slug' => 'line-manager',
    'hierarchy_level' => 3,
    'parent_role_id' => 4, // Reports to "Manager"
    'metadata' => [
        'approval_authority' => 1000, // Can approve up to $1000
        'team_size_limit' => 20,
        'department_scope' => 'own_department'
    ]
]
```

**Benefits:**
- ✅ Create roles without code changes
- ✅ Define role hierarchy explicitly
- ✅ Store role-specific metadata
- ✅ Support custom organizational structures

---

### 2. Flexible Permission System

```php
Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('group'); // tickets, users, reports, etc.
    $table->text('description')->nullable();
    $table->timestamps();
});

Schema::create('role_permissions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('role_id');
    $table->foreignId('permission_id');
    $table->json('conditions')->nullable(); // Conditional permissions
    $table->timestamps();
});

// Example: Conditional Permission
[
    'role_id' => 5, // Line Manager
    'permission_id' => 12, // tickets.approve
    'conditions' => [
        'max_amount' => 1000,
        'department_scope' => 'own_department',
        'exclude_categories' => [10, 15] // Cannot approve these categories
    ]
]
```

**Benefits:**
- ✅ Granular permission control
- ✅ Conditional permissions (e.g., "approve if < $1000")
- ✅ Context-aware permissions
- ✅ Easy to audit and manage

---

### 3. Dynamic Organizational Structure

```php
Schema::create('organizational_units', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('type'); // department, team, division, company
    $table->foreignId('parent_unit_id')->nullable(); // Hierarchical structure
    $table->foreignId('head_user_id')->nullable(); // Unit head
    $table->json('settings')->nullable(); // Unit-specific settings
    $table->timestamps();
});

Schema::create('user_organizational_assignments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id');
    $table->foreignId('organizational_unit_id');
    $table->foreignId('role_id');
    $table->date('start_date');
    $table->date('end_date')->nullable();
    $table->boolean('is_primary')->default(false);
    $table->timestamps();
});
```

**Benefits:**
- ✅ Support matrix organizations
- ✅ Multiple roles per user
- ✅ Time-based role assignments
- ✅ Clear reporting structure

---

## 🔄 Architecture: 5/5 Approval Workflow

### 1. Workflow Builder (Database-Driven)

```php
Schema::create('workflow_templates', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->json('workflow_steps'); // Define workflow structure
    $table->json('routing_rules'); // Define routing logic
    $table->json('approval_rules'); // Define approval conditions
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// Example Workflow Template
[
    'name' => 'Standard Purchase Request',
    'workflow_steps' => [
        [
            'step_id' => 1,
            'type' => 'approval',
            'approver_type' => 'line_manager',
            'required' => true,
            'parallel' => false,
            'conditions' => [
                'if' => ['estimated_cost', '>', 0],
                'then' => 'require'
            ]
        ],
        [
            'step_id' => 2,
            'type' => 'routing',
            'route_to' => 'category_default_team',
            'conditions' => [
                'if' => ['approval_step_1', '==', 'approved'],
                'then' => 'route'
            ]
        ],
        [
            'step_id' => 3,
            'type' => 'approval',
            'approver_type' => 'head_of_department',
            'required' => false,
            'parallel' => false,
            'conditions' => [
                'or' => [
                    ['priority', 'in', ['high', 'critical']],
                    ['estimated_cost', '>=', 1000],
                    ['category.requires_hod_approval', '==', true]
                ]
            ]
        ]
    ],
    'routing_rules' => [
        [
            'condition' => ['estimated_cost', '>', 1000],
            'action' => 'route_to_team',
            'team_id' => 5, // Procurement
            'after_step' => 2
        ],
        [
            'condition' => ['estimated_cost', '>', 5000],
            'action' => 'route_to_team',
            'team_id' => 3, // Finance
            'after_step' => 2
        ]
    ],
    'approval_rules' => [
        [
            'rule_name' => 'auto_approve_low_cost',
            'condition' => [
                'and' => [
                    ['estimated_cost', '<=', 100],
                    ['priority', '==', 'low']
                ]
            ],
            'action' => 'auto_approve',
            'skip_steps' => [1, 3] // Skip LM and HOD approval
        ]
    ]
]
```

**Benefits:**
- ✅ Visual workflow builder possible
- ✅ No code changes needed
- ✅ Complex conditional logic
- ✅ Multi-step routing
- ✅ Parallel approvals support

---

### 2. Rule Engine

```php
Schema::create('workflow_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workflow_template_id');
    $table->string('rule_name');
    $table->string('rule_type'); // condition, action, routing
    $table->json('conditions'); // Rule conditions
    $table->json('actions'); // What to do if condition met
    $table->integer('priority')->default(0); // Rule execution order
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// Example Rule: Department-Specific Workflow
[
    'workflow_template_id' => 1,
    'rule_name' => 'HR Leave Request - Skip LM',
    'rule_type' => 'condition',
    'conditions' => [
        'and' => [
            ['category.department', '==', 'HR'],
            ['category.name', '==', 'Leave Request'],
            ['priority', '==', 'low']
        ]
    ],
    'actions' => [
        'skip_steps' => [1], // Skip LM approval
        'route_directly' => true
    ],
    'priority' => 10 // High priority (executes first)
]
```

**Benefits:**
- ✅ Complex business logic without coding
- ✅ Department-specific rules
- ✅ Category-specific rules
- ✅ Easy to modify and test

---

### 3. Dynamic Approver Selection

```php
Schema::create('approver_rules', function (Blueprint $table) {
    $table->id();
    $table->foreignId('workflow_template_id');
    $table->integer('step_id');
    $table->string('approver_selection_type'); // role, user, department_head, custom
    $table->json('selection_criteria'); // How to find approver
    $table->json('fallback_rules'); // What to do if approver not found
    $table->timestamps();
});

// Example Approver Selection
[
    'workflow_template_id' => 1,
    'step_id' => 1,
    'approver_selection_type' => 'hierarchical',
    'selection_criteria' => [
        'primary' => [
            'type' => 'line_manager',
            'scope' => 'requester_department',
            'role' => 'Line Manager'
        ],
        'fallback_1' => [
            'type' => 'department_manager',
            'scope' => 'requester_department',
            'role' => 'Manager'
        ],
        'fallback_2' => [
            'type' => 'any',
            'role' => 'Super Admin'
        ]
    ],
    'fallback_rules' => [
        'if_not_found' => 'escalate_to_hod',
        'notify' => ['admin@company.com']
    ]
]
```

**Benefits:**
- ✅ Flexible approver selection
- ✅ Multiple fallback levels
- ✅ Department-aware
- ✅ Custom selection logic

---

## 📊 Complete 5/5 System Example

### Example 1: HR Leave Request Workflow

```json
{
  "workflow_name": "HR Leave Request",
  "steps": [
    {
      "step_id": 1,
      "type": "conditional_approval",
      "condition": {
        "if": ["leave_days", ">", 5],
        "then": "require_approval",
        "approver": "line_manager"
      },
      "if_false": "skip_step"
    },
    {
      "step_id": 2,
      "type": "routing",
      "route_to": "hr_department",
      "condition": "always"
    }
  ],
  "rules": [
    {
      "name": "Auto-approve routine leave",
      "condition": {
        "and": [
          ["leave_days", "<=", 3],
          ["leave_type", "==", "annual"]
        ]
      },
      "action": "auto_approve_and_route"
    }
  ]
}
```

### Example 2: Multi-Department Purchase Workflow

```json
{
  "workflow_name": "IT Hardware Purchase",
  "steps": [
    {
      "step_id": 1,
      "type": "approval",
      "approver": "line_manager",
      "required": true
    },
    {
      "step_id": 2,
      "type": "routing",
      "route_to": "it_department",
      "condition": "after_approval"
    },
    {
      "step_id": 3,
      "type": "conditional_routing",
      "condition": {
        "if": ["estimated_cost", ">", 1000],
        "then": "route_to_team",
        "team": "procurement"
      }
    },
    {
      "step_id": 4,
      "type": "approval",
      "approver": "head_of_department",
      "condition": {
        "or": [
          ["estimated_cost", ">=", 5000],
          ["priority", "==", "critical"]
        ]
      }
    },
    {
      "step_id": 5,
      "type": "conditional_routing",
      "condition": {
        "if": ["estimated_cost", ">", 10000],
        "then": "route_to_team",
        "team": "finance"
      }
    }
  ]
}
```

### Example 3: Parallel Approval Workflow

```json
{
  "workflow_name": "Budget Approval",
  "steps": [
    {
      "step_id": 1,
      "type": "parallel_approval",
      "approvers": [
        {
          "type": "line_manager",
          "required": true
        },
        {
          "type": "finance_manager",
          "required": true
        }
      ],
      "completion_rule": "all_required" // or "any_one"
    },
    {
      "step_id": 2,
      "type": "routing",
      "route_to": "finance_department"
    }
  ]
}
```

---

## 🎯 Key Features of 5/5 System

### 1. Visual Workflow Builder
```
[Start] → [LM Approval?] → [Route to Team] → [HOD Approval?] → [End]
            ↓ Yes              ↓                  ↓ Yes
         [Approve]        [IT Dept]          [Approve]
            ↓                                   ↓
         [Next]                              [Next]
```

### 2. Rule Builder UI
- Drag-and-drop workflow steps
- Visual condition builder
- Test workflow before activation
- Version control for workflows

### 3. Dynamic Role Assignment
- Assign roles based on:
  - Department
  - Project
  - Time period
  - Custom criteria

### 4. Analytics & Reporting
- Workflow performance metrics
- Approval time tracking
- Bottleneck identification
- Role usage statistics

---

## 🔄 Migration Path: Current → 5/5

### Phase 1: Database-Driven Roles
```php
// Step 1: Create roles table
// Step 2: Migrate existing roles
// Step 3: Update RoleConstants to read from DB
// Step 4: Add role management UI
```

### Phase 2: Workflow Templates
```php
// Step 1: Create workflow_templates table
// Step 2: Convert current logic to templates
// Step 3: Add workflow builder UI
// Step 4: Test with existing workflows
```

### Phase 3: Rule Engine
```php
// Step 1: Create rules table
// Step 2: Implement rule evaluator
// Step 3: Add rule builder UI
// Step 4: Migrate conditional logic
```

### Phase 4: Advanced Features
```php
// Step 1: Parallel approvals
// Step 2: Multi-step routing
// Step 3: Custom approver selection
// Step 4: Analytics dashboard
```

---

## 📈 Comparison: Current vs 5/5

| Feature | Current (3/5) | Ideal (5/5) |
|---------|---------------|-------------|
| **Role Management** | Hardcoded constants | Database-driven |
| **Workflow Configuration** | Code-based | Visual builder |
| **Approval Sequence** | Fixed (LM→Team→HOD) | Fully customizable |
| **Department Workflows** | Same for all | Per-department |
| **Multi-Step Routing** | Manual | Automatic |
| **Parallel Approvals** | ❌ Not supported | ✅ Supported |
| **Rule Engine** | Hardcoded logic | Database-driven rules |
| **Custom Conditions** | Limited | Unlimited |
| **Workflow Testing** | Manual testing | Built-in testing |
| **Version Control** | Git only | Workflow versions |

---

## 💡 Implementation Example

### Current System (3/5)
```php
// Hardcoded in ApprovalWorkflowService
if ($ticket->category->requires_approval) {
    // Create LM approval
    // Route to team
    if ($ticket->priority === 'high') {
        // Create HOD approval
    }
}
```

### 5/5 System
```php
// Database-driven
$workflow = WorkflowTemplate::forTicket($ticket)->first();
$engine = new WorkflowEngine($workflow);
$engine->execute($ticket);

// Workflow engine evaluates rules dynamically
// No code changes needed for new workflows
```

---

## 🎯 Conclusion

A **5/5 system** would be:
- ✅ **Fully Dynamic**: No code changes for new workflows
- ✅ **Visual Builder**: Drag-and-drop workflow creation
- ✅ **Rule Engine**: Complex logic without coding
- ✅ **Flexible**: Support any organizational structure
- ✅ **Scalable**: Handle complex multi-department scenarios

**Key Difference:**
- **Current (3/5)**: Flexible enough for standard use cases, but requires code changes for custom scenarios
- **Ideal (5/5)**: Fully configurable through UI, supports any workflow scenario without code changes

The current system is **good for most use cases**, but a 5/5 system would support **any possible workflow scenario** through configuration alone.
