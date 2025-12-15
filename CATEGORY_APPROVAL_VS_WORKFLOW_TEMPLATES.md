# Category Approval Settings vs Workflow Templates

## 📋 Current System: Two Approval Methods

Your system has **two ways** to configure approvals:

### 1. **Category-Level Approval Settings** (Simple)
- `requires_approval` - Boolean: Does this category need LM approval?
- `requires_hod_approval` - Boolean: Does this category need HOD approval?
- `hod_approval_threshold` - Decimal: Cost threshold for HOD approval

**Location:** Category form (`/admin/categories/{id}/edit`)

### 2. **Workflow Templates** (Advanced)
- Custom approval order
- Conditional approvals
- Multiple steps
- Department-specific workflows

**Location:** Workflow Templates (`/admin/workflow-templates`)

---

## 🔄 How They Work Together

### Priority Order:

1. **Workflow Template** (if exists) → Uses template workflow
2. **Category Settings** (if no template) → Uses category approval flags
3. **Default Workflow** (fallback) → Standard LM → HOD → CEO

### Current Behavior:

```php
// WorkflowEngine.php - Line 36-46
public function execute(Ticket $ticket): void
{
    $template = WorkflowTemplate::forTicket($ticket);
    
    if (!$template) {
        // Fallback to default workflow (uses category settings)
        $this->approvalService->initializeWorkflow($ticket);
        return;
    }
    
    // Use workflow template
    // ...
}
```

**Result:**
- ✅ If workflow template exists → **Template wins** (ignores category settings)
- ✅ If no template → **Category settings used** (via default workflow)

---

## ⚠️ Current Issue

**Category approval settings are ignored when a workflow template exists!**

### Example Problem:

1. Category "Hardware Requests":
   - `requires_approval = true`
   - `requires_hod_approval = true`
   - `hod_approval_threshold = 1000`

2. Workflow Template "IT Hardware Purchase":
   - Category: "Hardware Requests"
   - Steps: [LM Approval only]

**Result:** Template is used, HOD approval is skipped (even though category says it's required)

---

## 💡 Solutions

### Option 1: Keep Current Behavior (Template Overrides Category)

**Pros:**
- ✅ Templates have full control
- ✅ Simple logic

**Cons:**
- ⚠️ Category settings become irrelevant when template exists
- ⚠️ Confusing for users

### Option 2: Merge Category Settings with Template (Recommended)

**How it works:**
- Template defines **order** and **steps**
- Category settings define **requirements** (which approvals are mandatory)
- System enforces category requirements even in templates

**Example:**
- Category: `requires_hod_approval = true`
- Template: [LM Approval, Routing]
- **Result:** System adds HOD approval after LM (category requirement)

### Option 3: Show Warning in UI

**How it works:**
- When creating/editing template, show warning if category has approval requirements
- Suggest including required approvals in template

---

## 🎯 Recommended Approach

### For Simple Cases: Use Category Settings

**When to use:**
- Standard approval flow (LM → HOD)
- No custom order needed
- Same workflow for all tickets in category

**How:**
1. Go to `/admin/categories/{id}/edit`
2. Set:
   - ✅ `Requires Approval` = Yes
   - ✅ `Requires HOD Approval` = Yes (optional)
   - ✅ `HOD Approval Threshold` = 1000 (optional)

### For Complex Cases: Use Workflow Templates

**When to use:**
- Custom approval order (HOD → LM)
- Conditional approvals
- Multi-step routing
- Department-specific workflows

**How:**
1. Go to `/admin/workflow-templates/create`
2. Set category/department scope
3. Define custom steps
4. **Note:** Category approval settings are ignored when template exists

---

## 📝 Category Approval Settings Explained

### `requires_approval` (Boolean)

**What it does:**
- If `true`: Tickets in this category need Line Manager approval
- If `false`: Tickets route directly to team (no approval)

**Used by:**
- `ApprovalWorkflowService::requiresApproval()`
- Default workflow initialization

**Example:**
```php
// Category: "Hardware Issues"
$category->requires_approval = false; // No approval needed, route directly
```

### `requires_hod_approval` (Boolean)

**What it does:**
- If `true`: Tickets need HOD approval (after LM)
- If `false`: Only LM approval needed

**Used by:**
- `ApprovalWorkflowService::requiresHODApproval()`
- Default workflow (checks after LM approval)

**Example:**
```php
// Category: "Hardware Requests"
$category->requires_hod_approval = true; // Always need HOD approval
```

### `hod_approval_threshold` (Decimal)

**What it does:**
- Cost threshold for HOD approval
- If ticket cost >= threshold → HOD approval required
- If ticket cost < threshold → Only LM approval needed

**Used by:**
- `ApprovalWorkflowService::requiresHODApproval()`
- Cost-based approval logic

**Example:**
```php
// Category: "Hardware Requests"
$category->hod_approval_threshold = 1000.00; // HOD approval if cost >= $1000
```

---

## 🔧 Where to Configure

### Category Approval Settings

**Location:** `/admin/categories/{id}/edit`

**Fields:**
- ✅ **Requires Approval** - Checkbox
- ✅ **Requires HOD Approval** - Checkbox
- ✅ **HOD Approval Threshold** - Number input

**Current UI:** Already exists in category form

### Workflow Templates

**Location:** `/admin/workflow-templates`

**Fields:**
- ✅ **Category** - Dropdown (optional)
- ✅ **Department** - Dropdown (optional)
- ✅ **Workflow Steps** - Custom steps builder

**Current UI:** Just created

---

## 🎯 Best Practice

1. **Start with Category Settings**
   - Use for standard workflows
   - Simple and quick

2. **Upgrade to Workflow Templates**
   - When you need custom order
   - When you need conditional logic
   - When you need department-specific workflows

3. **Document Your Choice**
   - Note in category description if using template
   - Note in template description which category it replaces

---

## 📊 Comparison Table

| Feature | Category Settings | Workflow Templates |
|---------|------------------|-------------------|
| **Approval Order** | Fixed (LM → HOD) | ✅ Customizable |
| **Skip Steps** | ❌ No | ✅ Yes (conditional) |
| **Multi-Step Routing** | ❌ No | ✅ Yes |
| **Department-Specific** | ❌ No | ✅ Yes |
| **Cost-Based Logic** | ✅ Yes (threshold) | ✅ Yes (conditions) |
| **Ease of Use** | ✅ Simple | ⚠️ More complex |
| **Flexibility** | ⚠️ Limited | ✅ Full control |

---

## 🚀 Future Enhancement

**Idea:** Merge both systems

1. Category settings define **requirements** (what approvals are mandatory)
2. Workflow templates define **order** and **logic** (how approvals happen)
3. System enforces category requirements in templates

**Example:**
- Category: `requires_hod_approval = true`
- Template: [LM Approval, Routing]
- **System adds:** HOD approval after LM (because category requires it)

This would give you:
- ✅ Flexibility of templates
- ✅ Safety of category requirements
- ✅ Best of both worlds

---

## ✅ Summary

**Current State:**
- Category settings: Simple approval flags
- Workflow templates: Advanced custom workflows
- **Templates override category settings**

**Recommendation:**
- Use **category settings** for simple cases
- Use **workflow templates** for complex cases
- Be aware that templates ignore category settings

**Future:**
- Consider merging both systems for best flexibility
