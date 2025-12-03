# Approval Workflow Quick Test Guide

Quick reference for testing approval workflows manually.

## Quick Test Commands

### Run Automated Test Script
```bash
php test-approval-workflow.php
```

### Run PHPUnit Tests
```bash
php artisan test --filter ApprovalWorkflowTest
```

---

## Manual Testing Steps

### Test 1: No Approval Required (30 seconds)

1. **Login as**: Regular user (Requester)
2. **Create Ticket**:
   - Category: `Network & Connectivity`
   - Subject: "Wi-Fi not working"
   - Priority: Medium
   - Cost: $0
3. **Expected**: Ticket immediately assigned to IT team (no approval)

---

### Test 2: LM Approval Only (2 minutes)

1. **Login as**: Regular user
2. **Create Ticket**:
   - Category: `Hardware Requests`
   - Subject: "Need new keyboard"
   - Priority: Medium
   - Cost: $50
3. **Expected**: Ticket pending, LM approval created
4. **Login as**: Line Manager
5. **Go to**: Pending Approvals page
6. **Approve** the ticket
7. **Expected**: Ticket assigned to IT team, no HOD approval

---

### Test 3: LM + HOD Approval (5 minutes)

1. **Login as**: Regular user
2. **Create Ticket**:
   - Category: `Hardware Requests`
   - Subject: "Request 10 laptops"
   - Priority: High
   - Cost: $15,000
3. **Expected**: LM approval created
4. **Login as**: Line Manager → Approve
5. **Expected**: HOD approval auto-created
6. **Login as**: Head of Department → Approve
7. **Expected**: Ticket assigned to team

---

### Test 4: Approval Rejection (2 minutes)

1. **Create ticket** requiring approval
2. **Login as**: Line Manager
3. **Reject** the ticket with comment
4. **Expected**: Ticket rejected, requester notified

---

### Test 5: Cost Threshold (3 minutes)

Create 3 tickets with same category but different costs:

1. **Ticket A**: Cost = $999.99
   - Expected: Only LM approval

2. **Ticket B**: Cost = $1,000.00
   - Expected: LM + HOD approval

3. **Ticket C**: Cost = $1,000.01
   - Expected: LM + HOD approval

---

## Quick Verification Commands

### Check Ticket Approval Status
```php
php artisan tinker

$ticket = Ticket::latest()->first();
$ticket->approvals()->get();
$ticket->currentApproval();
$ticket->status;
```

### Check Approval Emails Sent
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log | grep -i "approval\|email"
```

### View Pending Approvals
```php
php artisan tinker

TicketApproval::pending()->with('ticket', 'approver')->get();
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Approval not created | Check category `requires_approval` setting |
| HOD approval not triggered | Verify cost exceeds threshold |
| Email not sent | Check email configuration and templates |
| Ticket not routed | Check category has `default_team_id` |

---

## Test Data Reference

### Categories for Testing

| Category | Approval Required | HOD Threshold | Use Case |
|----------|------------------|---------------|----------|
| Network & Connectivity | No | N/A | Direct routing test |
| Hardware Requests | Yes | $1,000 | Cost-based approval |
| Hardware Issues | No | N/A | Direct routing (repairs) |
| Purchase Request | Yes | $500 | Always HOD approval |
| Application Access | No | N/A | Direct routing |

### Test Users

| Role | Email | Password |
|------|-------|----------|
| Super Admin | bringerhorror@gmail.com | password |
| HOD | kmhodsokun@outlook.com | password |
| Line Manager | fnak98755@gmail.com | password |
| Requester | chanthou121@outlook.com | password |

---

## Expected Results Checklist

- [ ] No approval → Direct routing
- [ ] LM approval → Email sent to LM
- [ ] LM approved → Ticket routed, HOD created if needed
- [ ] HOD approval → Email sent to HOD
- [ ] HOD approved → Ticket routed to team
- [ ] Rejection → Requester notified
- [ ] Cost threshold → HOD only if cost >= threshold
- [ ] Auto-approve → Bypass workflow

