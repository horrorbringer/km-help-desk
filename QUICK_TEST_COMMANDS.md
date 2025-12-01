# Quick Test Commands

## 1. Setup (Run Once)

```bash
# Run migrations
php artisan migrate

# Seed categories with approval settings
php artisan db:seed --class=TicketCategorySeeder

# Seed permissions (includes auto-approve)
php artisan db:seed --class=RolePermissionSeeder
```

## 2. Quick Database Checks

### Check Category Approval Settings
```sql
SELECT name, requires_approval, requires_hod_approval, hod_approval_threshold
FROM ticket_categories
ORDER BY name;
```

### Check Recent Tickets and Their Approvals
```sql
SELECT 
    t.id,
    t.ticket_number,
    t.subject,
    t.status,
    tc.name as category,
    tc.requires_approval,
    COUNT(ta.id) as approval_count,
    GROUP_CONCAT(ta.approval_level, ':', ta.status) as approvals
FROM tickets t
JOIN ticket_categories tc ON t.category_id = tc.id
LEFT JOIN ticket_approvals ta ON ta.ticket_id = t.id
GROUP BY t.id
ORDER BY t.created_at DESC
LIMIT 10;
```

### Check Pending Approvals
```sql
SELECT 
    ta.id,
    ta.approval_level,
    ta.status,
    t.ticket_number,
    t.subject,
    u.name as approver_name
FROM ticket_approvals ta
JOIN tickets t ON ta.ticket_id = t.id
LEFT JOIN users u ON ta.approver_id = u.id
WHERE ta.status = 'pending'
ORDER BY ta.created_at DESC;
```

## 3. Test via Tinker

### Quick Test Script
```bash
php artisan tinker
```

Then paste:
```php
// Test 1: Create ticket without approval
$cat = \App\Models\TicketCategory::where('slug', 'finance-queries')->first();
$ticket = \App\Models\Ticket::create([
    'ticket_number' => \App\Models\Ticket::generateTicketNumber(),
    'subject' => 'Test Finance Query',
    'description' => 'Testing',
    'requester_id' => 1,
    'category_id' => $cat->id,
    'priority' => 'low',
    'status' => 'open',
]);
$service = app(\App\Services\ApprovalWorkflowService::class);
$service->initializeWorkflow($ticket);
echo "Approvals: " . $ticket->approvals()->count() . "\n"; // Should be 0

// Test 2: Create ticket with approval
$cat = \App\Models\TicketCategory::where('slug', 'hardware')->first();
$ticket2 = \App\Models\Ticket::create([
    'ticket_number' => \App\Models\Ticket::generateTicketNumber(),
    'subject' => 'Test Hardware',
    'description' => 'Testing',
    'requester_id' => 1,
    'category_id' => $cat->id,
    'priority' => 'medium',
    'status' => 'open',
]);
$service->initializeWorkflow($ticket2);
echo "Approvals: " . $ticket2->approvals()->count() . "\n"; // Should be 1

// Test 3: Approve a ticket
$approval = \App\Models\TicketApproval::where('status', 'pending')->first();
if ($approval) {
    $service->approve($approval, 'Test approval');
    echo "Approved! Ticket status: " . $approval->ticket->status . "\n";
}
```

## 4. Test via Browser (When UI is Ready)

1. **Create Ticket Without Approval**:
   - Go to: `/admin/tickets/create`
   - Select category: "Finance Queries"
   - Submit ticket
   - Check: Should route directly to Finance, no approval needed

2. **Create Ticket With Approval**:
   - Go to: `/admin/tickets/create`
   - Select category: "Hardware"
   - Submit ticket
   - Check: Should create LM approval, ticket status = pending

3. **Approve Ticket**:
   - Go to: `/admin/tickets/{id}`
   - Click "Approve" button
   - Add comments
   - Check: Ticket should route to IT Department

4. **View Pending Approvals**:
   - Go to: `/admin/ticket-approvals/pending`
   - Should show all tickets pending your approval

## 5. Verify Results

### Check Ticket History
```sql
SELECT 
    th.description,
    th.created_at,
    u.name as user_name
FROM ticket_histories th
LEFT JOIN users u ON th.user_id = u.id
WHERE th.ticket_id = [TICKET_ID]
ORDER BY th.created_at;
```

### Check Approval Timeline
```sql
SELECT 
    approval_level,
    status,
    comments,
    approved_at,
    rejected_at,
    u.name as approver_name
FROM ticket_approvals ta
LEFT JOIN users u ON ta.approver_id = u.id
WHERE ta.ticket_id = [TICKET_ID]
ORDER BY ta.sequence, ta.created_at;
```

## 6. Common Issues & Fixes

### Issue: "No approver assigned"
```sql
-- Check if managers exist
SELECT u.id, u.name, r.name as role
FROM users u
JOIN model_has_roles mhr ON u.id = mhr.model_id
JOIN roles r ON mhr.role_id = r.id
WHERE r.name IN ('Manager', 'Super Admin');
```

### Issue: "Ticket not routing correctly"
```sql
-- Check category default team
SELECT tc.name, d.name as default_team
FROM ticket_categories tc
LEFT JOIN departments d ON tc.default_team_id = d.id
WHERE tc.id = [CATEGORY_ID];
```

### Issue: "Approval not created"
```sql
-- Check category approval settings
SELECT name, requires_approval 
FROM ticket_categories 
WHERE id = [CATEGORY_ID];
```

## 7. Performance Check

```sql
-- Count approvals by status
SELECT status, COUNT(*) as count
FROM ticket_approvals
GROUP BY status;

-- Count tickets by approval requirement
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM ticket_approvals ta WHERE ta.ticket_id = t.id) 
        THEN 'Has Approval' 
        ELSE 'No Approval' 
    END as approval_status,
    COUNT(*) as count
FROM tickets t
GROUP BY approval_status;
```

