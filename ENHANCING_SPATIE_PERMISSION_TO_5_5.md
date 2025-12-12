# Enhancing Spatie Permission System to 5/5

## 🎯 Current State Analysis

### ✅ What You Already Have (Spatie Permission)

1. **Database-Driven Roles** ✅
   - Roles stored in `roles` table
   - Managed via `RoleController` (UI)
   - Can create/edit/delete roles dynamically

2. **Database-Driven Permissions** ✅
   - Permissions stored in `permissions` table
   - Role-permission relationships (`role_has_permissions`)
   - User-role relationships (`model_has_roles`)

3. **Built-in Features** ✅
   - `HasRoles` trait on User model
   - `hasRole()`, `hasAnyRole()`, `hasAllRoles()` methods
   - `hasPermission()`, `hasAnyPermission()` methods
   - Permission caching
   - Guard-based permissions

4. **UI Management** ✅
   - Role CRUD interface
   - Permission assignment UI

### ⚠️ What's Missing for 5/5

1. **Role Hierarchy** - No parent-child relationships
2. **Role Metadata** - No custom properties (approval limits, etc.)
3. **Workflow Templates** - Separate from roles
4. **Rule Engine** - Complex conditional logic

---

## 🚀 Enhancement Plan: Spatie → 5/5

### Phase 1: Add Role Hierarchy & Metadata

#### Step 1: Extend Roles Table

```php
// Migration: add_role_hierarchy_and_metadata.php
Schema::table('roles', function (Blueprint $table) {
    $table->foreignId('parent_role_id')->nullable()->after('id');
    $table->integer('hierarchy_level')->default(0)->after('parent_role_id');
    $table->json('metadata')->nullable()->after('guard_name');
    $table->boolean('is_system_role')->default(false)->after('metadata');
    
    $table->foreign('parent_role_id')->references('id')->on('roles')->onDelete('set null');
    $table->index('hierarchy_level');
});
```

#### Step 2: Create Role Model Extension

```php
// app/Models/Role.php (extend Spatie's Role)
<?php

namespace App\Models;

use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
        'parent_role_id',
        'hierarchy_level',
        'metadata',
        'is_system_role',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_system_role' => 'boolean',
    ];

    // Relationships
    public function parent()
    {
        return $this->belongsTo(Role::class, 'parent_role_id');
    }

    public function children()
    {
        return $this->hasMany(Role::class, 'parent_role_id');
    }

    // Helper Methods
    public function getApprovalLimit(): ?float
    {
        return $this->metadata['approval_limit'] ?? null;
    }

    public function getDepartmentScope(): string
    {
        return $this->metadata['department_scope'] ?? 'all';
    }

    public function isHigherThan(Role $otherRole): bool
    {
        return $this->hierarchy_level > $otherRole->hierarchy_level;
    }

    public function getAncestors(): Collection
    {
        $ancestors = collect();
        $current = $this->parent;
        
        while ($current) {
            $ancestors->push($current);
            $current = $current->parent;
        }
        
        return $ancestors;
    }

    public function getDescendants(): Collection
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getDescendants());
        }
        
        return $descendants;
    }
}
```

#### Step 3: Update Spatie Config

```php
// config/permission.php
'models' => [
    'role' => App\Models\Role::class, // Use your extended model
    'permission' => Spatie\Permission\Models\Permission::class,
],
```

#### Step 4: Update Role Seeder

```php
// database/seeders/RolePermissionSeeder.php
protected function createRoles(): void
{
    $roles = [
        [
            'name' => 'Super Admin',
            'hierarchy_level' => 10,
            'metadata' => [
                'approval_limit' => null, // Unlimited
                'department_scope' => 'all',
            ],
            'is_system_role' => true,
        ],
        [
            'name' => 'Head of Department',
            'hierarchy_level' => 7,
            'parent_role_id' => null, // Will set after creation
            'metadata' => [
                'approval_limit' => 10000,
                'department_scope' => 'own_department',
            ],
            'is_system_role' => true,
        ],
        [
            'name' => 'Line Manager',
            'hierarchy_level' => 5,
            'parent_role_id' => null, // Will set after creation
            'metadata' => [
                'approval_limit' => 1000,
                'department_scope' => 'own_department',
            ],
            'is_system_role' => true,
        ],
        // ... other roles
    ];

    foreach ($roles as $roleData) {
        $parentName = $roleData['parent_role_name'] ?? null;
        unset($roleData['parent_role_name']);
        
        $role = Role::firstOrCreate(
            ['name' => $roleData['name']],
            $roleData
        );
        
        // Set parent after creation
        if ($parentName) {
            $parent = Role::where('name', $parentName)->first();
            if ($parent) {
                $role->update(['parent_role_id' => $parent->id]);
            }
        }
    }
}
```

---

### Phase 2: Add Workflow Templates

#### Step 1: Create Workflow Templates Table

```php
// Migration: create_workflow_templates.php
Schema::create('workflow_templates', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->text('description')->nullable();
    $table->foreignId('category_id')->nullable();
    $table->foreignId('department_id')->nullable();
    $table->json('workflow_steps'); // Workflow definition
    $table->json('routing_rules')->nullable();
    $table->json('approval_rules')->nullable();
    $table->boolean('is_active')->default(true);
    $table->integer('priority')->default(0); // Higher priority = evaluated first
    $table->timestamps();
    
    $table->foreign('category_id')->references('id')->on('ticket_categories')->onDelete('cascade');
    $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
    $table->index(['category_id', 'department_id', 'is_active']);
});
```

#### Step 2: Create Workflow Template Model

```php
// app/Models/WorkflowTemplate.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category_id',
        'department_id',
        'workflow_steps',
        'routing_rules',
        'approval_rules',
        'is_active',
        'priority',
    ];

    protected $casts = [
        'workflow_steps' => 'array',
        'routing_rules' => 'array',
        'approval_rules' => 'array',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Find workflow template for a ticket
     */
    public static function forTicket(Ticket $ticket): ?self
    {
        // Priority order:
        // 1. Category + Department specific
        // 2. Category specific
        // 3. Department specific
        // 4. Default workflow
        
        return static::where('is_active', true)
            ->where(function ($query) use ($ticket) {
                $query->whereNull('category_id')
                    ->orWhere('category_id', $ticket->category_id);
            })
            ->where(function ($query) use ($ticket) {
                $query->whereNull('department_id')
                    ->orWhere('department_id', $ticket->requester?->department_id);
            })
            ->orderBy('priority', 'desc')
            ->orderByRaw('CASE 
                WHEN category_id IS NOT NULL AND department_id IS NOT NULL THEN 1
                WHEN category_id IS NOT NULL THEN 2
                WHEN department_id IS NOT NULL THEN 3
                ELSE 4
            END')
            ->first();
    }
}
```

#### Step 3: Example Workflow Template Data

```php
// Example: HR Leave Request Workflow
WorkflowTemplate::create([
    'name' => 'HR Leave Request - Routine',
    'category_id' => 5, // HR Leave Request category
    'workflow_steps' => [
        [
            'step_id' => 1,
            'type' => 'conditional_approval',
            'condition' => [
                'if' => ['leave_days', '>', 5],
                'then' => 'require_approval',
                'approver_type' => 'line_manager'
            ],
            'if_false' => 'skip_step'
        ],
        [
            'step_id' => 2,
            'type' => 'routing',
            'route_to' => 'category_default_team'
        ]
    ],
    'approval_rules' => [
        [
            'name' => 'auto_approve_routine_leave',
            'condition' => [
                'and' => [
                    ['leave_days', '<=', 3],
                    ['leave_type', '==', 'annual']
                ]
            ],
            'action' => 'auto_approve_and_route'
        ]
    ]
]);
```

---

### Phase 3: Create Workflow Engine

#### Step 1: Workflow Engine Service

```php
// app/Services/WorkflowEngine.php
<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\WorkflowTemplate;
use App\Services\ApprovalWorkflowService;

class WorkflowEngine
{
    protected ApprovalWorkflowService $approvalService;

    public function __construct(ApprovalWorkflowService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    /**
     * Execute workflow for a ticket
     */
    public function execute(Ticket $ticket): void
    {
        $template = WorkflowTemplate::forTicket($ticket);
        
        if (!$template) {
            // Fallback to default workflow
            $this->approvalService->initializeWorkflow($ticket);
            return;
        }

        // Evaluate approval rules first
        $this->evaluateApprovalRules($ticket, $template);

        // Execute workflow steps
        $this->executeWorkflowSteps($ticket, $template);
    }

    /**
     * Evaluate approval rules (can skip steps)
     */
    protected function evaluateApprovalRules(Ticket $ticket, WorkflowTemplate $template): void
    {
        if (empty($template->approval_rules)) {
            return;
        }

        foreach ($template->approval_rules as $rule) {
            if ($this->evaluateCondition($ticket, $rule['condition'])) {
                $this->executeAction($ticket, $rule['action']);
                break; // First matching rule wins
            }
        }
    }

    /**
     * Execute workflow steps
     */
    protected function executeWorkflowSteps(Ticket $ticket, WorkflowTemplate $template): void
    {
        foreach ($template->workflow_steps as $step) {
            if ($this->shouldSkipStep($ticket, $step)) {
                continue;
            }

            match ($step['type']) {
                'approval' => $this->createApproval($ticket, $step),
                'conditional_approval' => $this->createConditionalApproval($ticket, $step),
                'routing' => $this->routeTicket($ticket, $step),
                'conditional_routing' => $this->routeConditionally($ticket, $step),
                default => null,
            };
        }
    }

    /**
     * Evaluate condition (simple rule engine)
     */
    protected function evaluateCondition(Ticket $ticket, array $condition): bool
    {
        if (isset($condition['and'])) {
            return collect($condition['and'])->every(fn($c) => $this->evaluateSingleCondition($ticket, $c));
        }

        if (isset($condition['or'])) {
            return collect($condition['or'])->some(fn($c) => $this->evaluateSingleCondition($ticket, $c));
        }

        return $this->evaluateSingleCondition($ticket, $condition);
    }

    /**
     * Evaluate single condition
     */
    protected function evaluateSingleCondition(Ticket $ticket, array $condition): bool
    {
        [$field, $operator, $value] = $condition;

        $ticketValue = data_get($ticket, $field);

        return match ($operator) {
            '==' => $ticketValue == $value,
            '!=' => $ticketValue != $value,
            '>' => $ticketValue > $value,
            '>=' => $ticketValue >= $value,
            '<' => $ticketValue < $value,
            '<=' => $ticketValue <= $value,
            'in' => in_array($ticketValue, $value),
            'not_in' => !in_array($ticketValue, $value),
            default => false,
        };
    }

    /**
     * Execute action
     */
    protected function executeAction(Ticket $ticket, string $action): void
    {
        match ($action) {
            'auto_approve_and_route' => $this->autoApproveAndRoute($ticket),
            'skip_approval' => null, // Already skipped
            default => null,
        };
    }

    // ... more methods
}
```

---

### Phase 4: Update Approval Workflow Service

```php
// app/Services/ApprovalWorkflowService.php
// Update initializeWorkflow method

public function initializeWorkflow(Ticket $ticket): void
{
    // Check if workflow template exists
    $workflowEngine = app(WorkflowEngine::class);
    
    try {
        $workflowEngine->execute($ticket);
    } catch (\Exception $e) {
        // Fallback to default workflow
        $this->initializeDefaultWorkflow($ticket);
    }
}
```

---

## 📊 Enhanced Role Usage Examples

### Example 1: Using Role Hierarchy

```php
// Find approver based on hierarchy
$lineManagerRole = Role::where('name', 'Line Manager')->first();
$hodRole = Role::where('name', 'Head of Department')->first();

// Check hierarchy
if ($hodRole->isHigherThan($lineManagerRole)) {
    // HOD is higher in hierarchy
}

// Get all managers above Line Manager
$lineManagerRole->getAncestors(); // Returns HOD, Director, etc.
```

### Example 2: Using Role Metadata

```php
// Check approval limit
$lineManagerRole = Role::where('name', 'Line Manager')->first();
$approvalLimit = $lineManagerRole->getApprovalLimit(); // 1000

if ($ticket->estimated_cost <= $approvalLimit) {
    // Line Manager can approve
} else {
    // Needs HOD approval
}
```

### Example 3: Dynamic Approver Selection

```php
// Find approver based on role hierarchy and metadata
protected function findApprover(Ticket $ticket, string $roleName): ?User
{
    $role = Role::where('name', $roleName)->first();
    
    // Check department scope
    $scope = $role->getDepartmentScope();
    
    $query = User::whereHas('roles', fn($q) => $q->where('name', $roleName));
    
    if ($scope === 'own_department' && $ticket->requester?->department_id) {
        $query->where('department_id', $ticket->requester->department_id);
    }
    
    return $query->where('is_active', true)->first();
}
```

---

## 🎯 Migration Strategy

### Step 1: Add Role Hierarchy (Non-Breaking)

1. Create migration to add `parent_role_id`, `hierarchy_level`, `metadata`
2. Update Role model to extend Spatie's Role
3. Update config to use extended model
4. Populate hierarchy data
5. Test existing functionality

### Step 2: Add Workflow Templates (Parallel)

1. Create `workflow_templates` table
2. Create WorkflowTemplate model
3. Create WorkflowEngine service
4. Migrate existing logic to templates
5. Test with existing tickets

### Step 3: Gradual Migration

1. Start with new categories using templates
2. Keep existing categories using old workflow
3. Gradually migrate categories to templates
4. Remove old workflow code once all migrated

---

## ✅ Benefits of Enhanced System

1. **Leverages Spatie Permission** ✅
   - Uses existing role/permission infrastructure
   - No need to replace Spatie
   - Builds on proven foundation

2. **Adds Missing Features** ✅
   - Role hierarchy
   - Role metadata
   - Workflow templates
   - Rule engine

3. **Backward Compatible** ✅
   - Existing code continues to work
   - Gradual migration possible
   - No breaking changes

4. **UI Manageable** ✅
   - Workflow templates can be managed via UI
   - Role hierarchy visible in UI
   - Rule builder possible

---

## 🎯 Final Score: 3/5 → 5/5

| Feature | Before | After |
|---------|--------|-------|
| **Role Management** | Spatie (database) ✅ | Spatie + Hierarchy ✅ |
| **Role Metadata** | ❌ | ✅ |
| **Workflow Config** | Code-based | Database templates ✅ |
| **Rule Engine** | Hardcoded | Database-driven ✅ |
| **Flexibility** | Moderate | Full ✅ |

**Result: 5/5 System** 🎉
