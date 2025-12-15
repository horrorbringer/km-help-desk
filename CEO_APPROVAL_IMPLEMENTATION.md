# CEO Approval Implementation

## ✅ CEO Approval Added to Workflow

CEO approval has been successfully added to the approval workflow system.

## 📊 Approval Flow

The complete approval flow is now:

```
Employee Creates Ticket
    ↓
Does it need approval?
    ├─→ NO → Route directly to department ✅
    │
    └─→ YES → Line Manager Approval
            ↓
        Approved?
            ├─→ NO → Ticket Rejected ❌
            │
            └─→ YES → Check if HOD approval needed
                    ├─→ NO → Check if CEO approval needed
                    │       ├─→ NO → Route to Department ✅
                    │       └─→ YES → CEO Approval
                    │               ↓
                    │           Approved?
                    │               ├─→ NO → Ticket Rejected ❌
                    │               └─→ YES → Route to Department ✅
                    │
                    └─→ YES → HOD Approval
                            ↓
                        Approved?
                            ├─→ NO → Ticket Rejected ❌
                            │
                            └─→ YES → Check if CEO approval needed
                                    ├─→ NO → Route to Department ✅
                                    └─→ YES → CEO Approval
                                            ↓
                                        Approved?
                                            ├─→ NO → Ticket Rejected ❌
                                            └─→ YES → Route to Department ✅
```

## 🎯 When CEO Approval is Required

CEO approval is required when:

1. **Cost Threshold**: Ticket cost >= $10,000 (default, configurable per category)
   - Can be set via `category.ceo_approval_threshold` field

2. **Category Flag**: Category has `requires_ceo_approval = true`
   - For categories that always need CEO approval regardless of cost

## 📝 Implementation Details

### 1. TicketApproval Model
- Added `'ceo'` to `LEVELS` constant
- Now supports: `['lm', 'hod', 'ceo']`

### 2. ApprovalWorkflowService
- **`requiresCEOApproval()`** - Checks if CEO approval is needed
- **`findCEO()`** - Finds CEO user (with fallbacks: Director → Super Admin)
- **`routeAfterCEOApproval()`** - Routes ticket after CEO approval
- **`checkNextApproval()`** - Now checks for CEO approval after HOD
- **`approve()`** - Handles CEO approval level

### 3. Approval Sequence
- **LM Approval** → Check HOD → Check CEO
- **HOD Approval** → Check CEO
- **CEO Approval** → Route to department (final approval)

## 🔧 Configuration

### Per-Category CEO Approval Threshold

To set a custom CEO approval threshold for a category, you would need to add:

```php
// Migration: add_ceo_approval_fields_to_ticket_categories.php
Schema::table('ticket_categories', function (Blueprint $table) {
    $table->decimal('ceo_approval_threshold', 10, 2)->nullable()
        ->after('hod_approval_threshold')
        ->comment('Cost threshold for CEO approval (default: 10000)');
    $table->boolean('requires_ceo_approval')->default(false)
        ->after('ceo_approval_threshold')
        ->comment('Always require CEO approval for this category');
});
```

### Example Usage

```php
// Category with $50,000 CEO threshold
$category->ceo_approval_threshold = 50000;

// Category that always requires CEO approval
$category->requires_ceo_approval = true;
```

## 📊 Approval Limits Summary

| Role | Default Approval Limit | When Required |
|------|----------------------|---------------|
| **Line Manager** | $1,000 | First-level approval |
| **Head of Department** | $10,000 | High priority or cost > threshold |
| **CEO** | $10,000+ | Very expensive purchases |

## 🎯 Real-World Example

### Scenario: $15,000 Hardware Purchase

```
1. Employee creates ticket: "Need server - $15,000"
2. Line Manager approves ✅
3. System checks: Cost $15,000 > $1,000 → HOD approval needed
4. HOD approves ✅
5. System checks: Cost $15,000 > $10,000 → CEO approval needed
6. CEO approves ✅
7. Ticket routed to IT Department
8. Purchase proceeds
```

## ✅ Status

- ✅ CEO approval level added to TicketApproval
- ✅ CEO approval logic implemented
- ✅ CEO finder method with fallbacks
- ✅ Routing after CEO approval
- ✅ Integration with existing workflow
- ✅ Backward compatible (only triggers for high-cost tickets)

## 📝 Notes

- **Default Threshold**: $10,000 (can be configured per category)
- **Fallback Chain**: CEO → Director → Super Admin
- **CEO Approval is Final**: After CEO approval, ticket is routed (no further approvals)
- **Optional**: CEO approval only triggers for very expensive purchases or specific categories
