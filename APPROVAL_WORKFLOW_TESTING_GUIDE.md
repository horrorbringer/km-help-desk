# Approval Workflow Testing Guide

## Prerequisites

1. **Run Migrations**
   ```bash
   php artisan migrate
   ```

2. **Seed Categories** (to get realistic approval settings)
   ```bash
   php artisan db:seed --class=TicketCategorySeeder
   ```

3. **Seed Permissions** (to get auto-approve permission)
   ```bash
   php artisan db:seed --class=RolePermissionSeeder
   ```

## Test Scenarios

### Test 1: Ticket Without Approval (Finance Queries)

**Goal**: Verify that routine tickets bypass approval workflow

**Steps**:
1. Create a new ticket with:
   - Category: "Finance Queries"
   - Subject: "Payroll Query"
   - Priority: Low/Medium
   - Description: "Need clarification on my payslip"

2. **Expected Results**:
   - ✅ No approval record created in `ticket_approvals` table
   - ✅ Ticket status: `assigned` (not `pending`)
   - ✅ Ticket assigned to Finance Department (FIN)
   - ✅ Ticket history shows: "Ticket routed directly to Finance Department (no approval required)"

**Database Check**:
```sql
-- Check no approval was created
SELECT * FROM ticket_approvals WHERE ticket_id = [TICKET_ID];
-- Should return 0 rows

-- Check ticket was routed correctly
SELECT t.id, t.status, t.assigned_team_id, d.name as team_name
FROM tickets t
LEFT JOIN departments d ON t.assigned_team_id = d.id
WHERE t.id = [TICKET_ID];
-- assigned_team_id should be Finance Department ID
```

---

### Test 2: Ticket With LM Approval (Hardware Request)

**Goal**: Verify that tickets requiring approval create LM approval record

**Steps**:
1. Create a new ticket with:
   - Category: "Hardware" (under IT Support)
   - Subject: "New Laptop Request"
   - Priority: Medium/High
   - Description: "Need new laptop for new employee"

2. **Expected Results**:
   - ✅ Approval record created with `approval_level = 'lm'` and `status = 'pending'`
   - ✅ Ticket status: `open` or `pending` (waiting for approval)
   - ✅ Approver assigned (Line Manager found)
   - ✅ Ticket history shows: "Ticket submitted for Line Manager approval"

**Database Check**:
```sql
-- Check approval was created
SELECT ta.*, u.name as approver_name
FROM ticket_approvals ta
LEFT JOIN users u ON ta.approver_id = u.id
WHERE ta.ticket_id = [TICKET_ID] AND ta.approval_level = 'lm';
-- Should return 1 row with status = 'pending'

-- Check ticket status
SELECT id, status FROM tickets WHERE id = [TICKET_ID];
-- Status should be 'open' or 'pending'
```

---

### Test 3: Approve Ticket (LM Approval)

**Goal**: Verify approval process routes ticket correctly

**Steps**:
1. As the Line Manager (or user with approval permission):
   - Go to ticket show page
   - Click "Approve" button
   - Add optional comments: "Approved for IT processing"
   - Optionally select routing team

2. **Expected Results**:
   - ✅ Approval status changes to `approved`
   - ✅ `approved_at` timestamp set
   - ✅ Ticket routes to IT Department (category's default team)
   - ✅ Ticket status changes to `assigned`
   - ✅ Ticket history shows: "Line Manager approved the ticket"
   - ✅ If high/critical priority → HOD approval created

**Database Check**:
```sql
-- Check approval status
SELECT * FROM ticket_approvals 
WHERE ticket_id = [TICKET_ID] AND approval_level = 'lm';
-- status should be 'approved', approved_at should be set

-- Check ticket routing
SELECT t.id, t.status, t.assigned_team_id, d.name as team_name
FROM tickets t
LEFT JOIN departments d ON t.assigned_team_id = d.id
WHERE t.id = [TICKET_ID];
-- assigned_team_id should be IT Department ID, status should be 'assigned'
```

---

### Test 4: Reject Ticket (LM Rejection)

**Goal**: Verify rejection process cancels ticket

**Steps**:
1. As the Line Manager:
   - Go to ticket show page
   - Click "Reject" button
   - Add required comments: "Budget not approved for this quarter"

2. **Expected Results**:
   - ✅ Approval status changes to `rejected`
   - ✅ `rejected_at` timestamp set
   - ✅ Ticket status changes to `cancelled`
   - ✅ Ticket history shows: "Line Manager rejected the ticket: [comments]"
   - ✅ No further approvals created

**Database Check**:
```sql
-- Check approval status
SELECT * FROM ticket_approvals 
WHERE ticket_id = [TICKET_ID] AND approval_level = 'lm';
-- status should be 'rejected', rejected_at should be set

-- Check ticket status
SELECT id, status FROM tickets WHERE id = [TICKET_ID];
-- status should be 'cancelled'
```

---

### Test 5: HOD Approval (High Priority Hardware)

**Goal**: Verify HOD approval is created for high-priority tickets

**Steps**:
1. Create a new ticket with:
   - Category: "Hardware"
   - Subject: "Critical Server Hardware Replacement"
   - Priority: **High** or **Critical**
   - Description: "Server hardware failure, urgent replacement needed"

2. Approve the LM approval first

3. **Expected Results**:
   - ✅ After LM approval, HOD approval automatically created
   - ✅ HOD approval has `approval_level = 'hod'` and `status = 'pending'`
   - ✅ HOD approver assigned
   - ✅ Ticket history shows: "Ticket submitted for Head of Department approval"

**Database Check**:
```sql
-- Check both approvals exist
SELECT approval_level, status, approver_id
FROM ticket_approvals
WHERE ticket_id = [TICKET_ID]
ORDER BY sequence;
-- Should show: lm=approved, hod=pending

-- Check HOD approval details
SELECT ta.*, u.name as approver_name
FROM ticket_approvals ta
LEFT JOIN users u ON ta.approver_id = u.id
WHERE ta.ticket_id = [TICKET_ID] AND ta.approval_level = 'hod';
-- Should return 1 row with status = 'pending'
```

---

### Test 6: Category-Based Routing

**Goal**: Verify tickets route to correct departments based on category

**Steps**:
1. Create tickets in different categories:
   - Finance Queries → Should route to Finance Department
   - IT Support → Should route to IT Department
   - Procurement → Should route to Procurement Department
   - Site Operations → Should route to Field Engineering

2. **Expected Results**:
   - ✅ Each ticket routes to its category's `default_team_id`
   - ✅ Not all tickets go to IT Department

**Database Check**:
```sql
-- Check routing by category
SELECT 
    tc.name as category_name,
    t.id as ticket_id,
    t.subject,
    d.name as assigned_team,
    d.code as team_code
FROM tickets t
JOIN ticket_categories tc ON t.category_id = tc.id
LEFT JOIN departments d ON t.assigned_team_id = d.id
ORDER BY t.created_at DESC
LIMIT 10;
-- Verify teams match categories
```

---

### Test 7: Auto-Approval Permission

**Goal**: Verify users with auto-approve permission bypass approval

**Steps**:
1. Assign `tickets.auto-approve` permission to a user:
   ```php
   $user = User::find([USER_ID]);
   $user->givePermissionTo('tickets.auto-approve');
   ```

2. As that user, create a ticket with:
   - Category: "Hardware" (normally requires approval)
   - Subject: "Test Auto-Approval"
   - Priority: Medium

3. **Expected Results**:
   - ✅ No approval record created
   - ✅ Ticket routes directly to IT Department
   - ✅ Ticket status: `assigned`
   - ✅ Ticket history shows direct routing

**Database Check**:
```sql
-- Check no approval was created
SELECT COUNT(*) FROM ticket_approvals WHERE ticket_id = [TICKET_ID];
-- Should return 0

-- Check direct routing
SELECT t.id, t.status, t.assigned_team_id
FROM tickets t
WHERE t.id = [TICKET_ID];
-- Should be assigned to category's default team
```

---

### Test 8: Category Approval Flags

**Goal**: Verify category approval settings work correctly

**Steps**:
1. Check category settings:
   ```sql
   SELECT name, requires_approval, requires_hod_approval, hod_approval_threshold
   FROM ticket_categories
   ORDER BY name;
   ```

2. Create tickets in categories with different settings:
   - Network & VPN (`requires_approval = false`) → Should bypass approval
   - Hardware (`requires_approval = true`) → Should require approval
   - Procurement (`requires_hod_approval = true`) → Should require HOD

3. **Expected Results**:
   - ✅ Categories with `requires_approval = false` bypass approval
   - ✅ Categories with `requires_approval = true` require approval
   - ✅ Categories with `requires_hod_approval = true` create HOD approval

**Database Check**:
```sql
-- Verify category settings
SELECT 
    tc.name,
    tc.requires_approval,
    tc.requires_hod_approval,
    tc.hod_approval_threshold,
    COUNT(t.id) as ticket_count,
    COUNT(ta.id) as approval_count
FROM ticket_categories tc
LEFT JOIN tickets t ON t.category_id = tc.id
LEFT JOIN ticket_approvals ta ON ta.ticket_id = t.id
GROUP BY tc.id, tc.name, tc.requires_approval, tc.requires_hod_approval, tc.hod_approval_threshold;
```

---

## Manual Testing via UI (When UI is Implemented)

### Test Approval Interface

1. **View Pending Approvals**:
   - Navigate to: `/admin/ticket-approvals/pending`
   - Should show all tickets pending your approval
   - Should filter by your user ID

2. **Approve from Ticket Show Page**:
   - Navigate to ticket detail page
   - Should show approval section if ticket has pending approval
   - Should show "Approve" and "Reject" buttons
   - Should allow adding comments

3. **Approval History**:
   - On ticket show page, check activity/history section
   - Should show all approval actions
   - Should show approver names and timestamps

---

## API Testing (Using Tinker or Postman)

### Test 1: Create Ticket with Approval

```php
php artisan tinker

// Create ticket requiring approval
$ticket = \App\Models\Ticket::create([
    'ticket_number' => \App\Models\Ticket::generateTicketNumber(),
    'subject' => 'Test Hardware Request',
    'description' => 'Testing approval workflow',
    'requester_id' => 1,
    'category_id' => \App\Models\TicketCategory::where('slug', 'hardware')->first()->id,
    'priority' => 'medium',
    'status' => 'open',
]);

// Initialize workflow
$service = app(\App\Services\ApprovalWorkflowService::class);
$service->initializeWorkflow($ticket);

// Check approval was created
$approval = $ticket->approvals()->first();
echo "Approval Level: " . $approval->approval_level . "\n";
echo "Status: " . $approval->status . "\n";
```

### Test 2: Approve Ticket

```php
php artisan tinker

$approval = \App\Models\TicketApproval::where('status', 'pending')->first();
$service = app(\App\Services\ApprovalWorkflowService::class);

// Approve
$service->approve($approval, 'Approved for processing', null);

// Check result
$approval->refresh();
echo "Status: " . $approval->status . "\n";
echo "Approved At: " . $approval->approved_at . "\n";

$ticket = $approval->ticket;
echo "Ticket Status: " . $ticket->status . "\n";
echo "Assigned Team: " . $ticket->assignedTeam->name . "\n";
```

### Test 3: Reject Ticket

```php
php artisan tinker

$approval = \App\Models\TicketApproval::where('status', 'pending')->first();
$service = app(\App\Services\ApprovalWorkflowService::class);

// Reject
$service->reject($approval, 'Budget not approved');

// Check result
$approval->refresh();
echo "Status: " . $approval->status . "\n";

$ticket = $approval->ticket;
echo "Ticket Status: " . $ticket->status . "\n";
// Should be 'cancelled'
```

---

## Automated Testing (PHPUnit)

Create test file: `tests/Feature/ApprovalWorkflowTest.php`

```php
<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketApproval;
use App\Models\User;
use App\Models\Department;
use App\Services\ApprovalWorkflowService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_without_approval_routes_directly()
    {
        // Create category that doesn't require approval
        $category = TicketCategory::factory()->create([
            'requires_approval' => false,
            'default_team_id' => Department::factory()->create()->id,
        ]);

        // Create ticket
        $ticket = Ticket::factory()->create([
            'category_id' => $category->id,
        ]);

        // Initialize workflow
        $service = app(ApprovalWorkflowService::class);
        $service->initializeWorkflow($ticket);

        // Assert no approval was created
        $this->assertCount(0, $ticket->approvals);

        // Assert ticket was routed directly
        $this->assertEquals($category->default_team_id, $ticket->assigned_team_id);
        $this->assertEquals('assigned', $ticket->status);
    }

    public function test_ticket_with_approval_creates_lm_approval()
    {
        // Create category that requires approval
        $category = TicketCategory::factory()->create([
            'requires_approval' => true,
        ]);

        // Create ticket
        $ticket = Ticket::factory()->create([
            'category_id' => $category->id,
        ]);

        // Initialize workflow
        $service = app(ApprovalWorkflowService::class);
        $service->initializeWorkflow($ticket);

        // Assert approval was created
        $this->assertCount(1, $ticket->approvals);
        $approval = $ticket->approvals->first();
        $this->assertEquals('lm', $approval->approval_level);
        $this->assertEquals('pending', $approval->status);
    }

    public function test_approval_routes_ticket_to_category_team()
    {
        $team = Department::factory()->create();
        $category = TicketCategory::factory()->create([
            'requires_approval' => true,
            'default_team_id' => $team->id,
        ]);

        $ticket = Ticket::factory()->create([
            'category_id' => $category->id,
        ]);

        $service = app(ApprovalWorkflowService::class);
        $service->initializeWorkflow($ticket);

        $approval = $ticket->approvals->first();
        $service->approve($approval, 'Approved');

        $ticket->refresh();
        $this->assertEquals($team->id, $ticket->assigned_team_id);
        $this->assertEquals('assigned', $ticket->status);
    }

    public function test_rejection_cancels_ticket()
    {
        $category = TicketCategory::factory()->create([
            'requires_approval' => true,
        ]);

        $ticket = Ticket::factory()->create([
            'category_id' => $category->id,
        ]);

        $service = app(ApprovalWorkflowService::class);
        $service->initializeWorkflow($ticket);

        $approval = $ticket->approvals->first();
        $service->reject($approval, 'Rejected');

        $ticket->refresh();
        $this->assertEquals('cancelled', $ticket->status);
        $this->assertEquals('rejected', $approval->status);
    }
}
```

---

## Quick Verification Checklist

After running tests, verify:

- [ ] Migrations ran successfully
- [ ] Categories have correct approval flags
- [ ] Tickets without approval route directly
- [ ] Tickets with approval create approval records
- [ ] Approvals can be approved and rejected
- [ ] Approved tickets route to correct departments
- [ ] Rejected tickets are cancelled
- [ ] HOD approval created for high-priority tickets
- [ ] Auto-approve permission works
- [ ] Ticket history records all actions
- [ ] Category-based routing works correctly

---

## Troubleshooting

### Issue: No approver assigned
**Solution**: Check if Line Manager/HOD users exist with Manager/HOD roles:
```sql
SELECT u.id, u.name, r.name as role
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.model_id
JOIN roles r ON mhr.role_id = r.id
WHERE r.name IN ('Manager', 'Line Manager', 'HOD', 'Head of Department', 'Super Admin');
```

### Issue: Ticket not routing to correct team
**Solution**: Check category's default_team_id:
```sql
SELECT tc.name, tc.default_team_id, d.name as team_name
FROM ticket_categories tc
LEFT JOIN departments d ON tc.default_team_id = d.id;
```

### Issue: Approval not being created
**Solution**: Check category's requires_approval flag:
```sql
SELECT name, requires_approval FROM ticket_categories;
```

---

## Performance Testing

Test with multiple tickets:
```php
php artisan tinker

// Create 100 tickets
for ($i = 0; $i < 100; $i++) {
    $ticket = Ticket::factory()->create();
    $service = app(\App\Services\ApprovalWorkflowService::class);
    $service->initializeWorkflow($ticket);
}

// Check performance
\DB::enableQueryLog();
// ... run operations
dd(\DB::getQueryLog());
```

This guide should help you thoroughly test all approval workflow features! 🧪

