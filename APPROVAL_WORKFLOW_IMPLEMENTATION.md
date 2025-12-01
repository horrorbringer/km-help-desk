# Ticket Approval Workflow Implementation

## Overview
This document describes the multi-level approval workflow system implemented for tickets, based on the workflow diagram:
**User → Line Manager (LM) → IT Department (ITD) → Result/HOD**

## Workflow Analysis

### Flow Diagram Interpretation
1. **User** creates a ticket
2. **Line Manager (LM)** approves/rejects the ticket
3. If **approved** → Ticket routes to **IT Department (ITD)**
4. **ITD** processes and can route to:
   - **Result** (completion)
   - **HOD** (Head of Department) for further review
   - Other destinations

## Implementation Details

### Database Schema

#### `ticket_approvals` Table
- `id` - Primary key
- `ticket_id` - Foreign key to tickets
- `approval_level` - Enum: 'lm' (Line Manager) or 'hod' (Head of Department)
- `approver_id` - Foreign key to users (nullable)
- `status` - Enum: 'pending', 'approved', 'rejected'
- `comments` - Text field for approver comments
- `approved_at` - Timestamp when approved
- `rejected_at` - Timestamp when rejected
- `routed_to_team_id` - Foreign key to departments (where to route after approval)
- `sequence` - Order of approval in workflow
- `timestamps` - created_at, updated_at

### Models

#### TicketApproval Model
- Relationships: `ticket()`, `approver()`, `routedToTeam()`
- Scopes: `pending()`, `approved()`, `rejected()`, `forLevel()`
- Helper methods: `isPending()`, `isApproved()`, `isRejected()`

#### Ticket Model Updates
- Added relationships: `approvals()`, `pendingApprovals()`, `currentApproval()`

### Services

#### ApprovalWorkflowService
Main service handling approval workflow logic:

**Methods:**
- `initializeWorkflow(Ticket $ticket)` - Creates initial LM approval when ticket is created
- `approve(TicketApproval $approval, $comments, $routedToTeamId)` - Processes approval
- `reject(TicketApproval $approval, $comments)` - Processes rejection
- `routeAfterLMApproval(Ticket $ticket, $routedToTeamId)` - Routes to ITD after LM approval
- `routeAfterHODApproval(Ticket $ticket, $routedToTeamId)` - Routes after HOD approval
- `checkNextApproval(Ticket $ticket)` - Determines if HOD approval is needed
- `findLineManager(Ticket $ticket)` - Finds appropriate Line Manager
- `findHOD(Ticket $ticket)` - Finds Head of Department

**Workflow Logic:**
1. On ticket creation, LM approval is automatically created
2. LM can approve or reject
3. If approved, ticket routes to IT Department (ITD)
4. If priority is high/critical, HOD approval is automatically created
5. HOD can approve and route to final destination or mark as resolved

### Controllers

#### TicketApprovalController
- `show(Ticket $ticket)` - Display approval interface
- `approve(Request $request, TicketApproval $approval)` - Process approval
- `reject(Request $request, TicketApproval $approval)` - Process rejection
- `pending()` - List pending approvals for current user

### Routes
```php
GET  /admin/tickets/{ticket}/approval - Show approval interface
POST /admin/ticket-approvals/{approval}/approve - Approve ticket
POST /admin/ticket-approvals/{approval}/reject - Reject ticket
GET  /admin/ticket-approvals/pending - List pending approvals
```

## Configuration & Customization

### Finding Approvers
The system finds approvers using the following logic:

**Line Manager:**
1. Requester's department manager (users with Manager/Line Manager role)
2. Assigned team manager
3. Fallback: First active manager

**Head of Department:**
1. Users with HOD/Head of Department/Director role
2. First active HOD found

### HOD Approval Requirements
Currently, HOD approval is required for:
- High priority tickets
- Critical priority tickets

This can be customized in `ApprovalWorkflowService::requiresHODApproval()`

### Routing After Approval
- **LM Approval:** Routes to IT Department (ITD) by default
- **HOD Approval:** Can route to specified team or mark as resolved

## Integration Points

### Ticket Creation
Approval workflow is automatically initialized when a ticket is created via `TicketController::store()`

### Ticket History
All approval actions are recorded in ticket history:
- `approval_requested` - When approval is needed
- `approved` - When ticket is approved
- `rejected` - When ticket is rejected
- `routed` - When ticket is routed to a team

### Notifications
Notifications are sent (via NotificationService) for:
- Approval requests to approvers
- Approval/rejection to requester
- Routing notifications

## Usage Examples

### Creating a Ticket with Approval
1. User creates ticket
2. System automatically creates LM approval
3. LM receives notification
4. LM approves/rejects via approval interface

### Approving a Ticket
```php
POST /admin/ticket-approvals/{approval}/approve
{
    "comments": "Approved for IT processing",
    "routed_to_team_id": 5  // Optional: IT Department ID
}
```

### Rejecting a Ticket
```php
POST /admin/ticket-approvals/{approval}/reject
{
    "comments": "Budget not approved"
}
```

## Next Steps (UI Implementation)

1. **Add Approval Section to Ticket Show Page**
   - Display current approval status
   - Show approval history
   - Add approve/reject buttons for authorized users

2. **Create Pending Approvals Page**
   - List all tickets pending user's approval
   - Quick approve/reject actions

3. **Add Approval Badge to Ticket List**
   - Show approval status in ticket index
   - Filter by approval status

4. **Approval Notifications**
   - Email notifications for approval requests
   - Dashboard notifications

## Recommendations

1. **Make Workflow Configurable**
   - Allow different approval workflows per category
   - Configurable approval levels
   - Custom routing rules

2. **Add Approval Deadlines**
   - SLA for approvals
   - Escalation if not approved in time

3. **Multi-Approver Support**
   - Require multiple approvers
   - Parallel vs sequential approvals

4. **Approval Templates**
   - Pre-defined routing rules
   - Approval criteria templates

5. **Analytics**
   - Approval time metrics
   - Rejection rate analysis
   - Approver performance

## Security Considerations

- Permission checks: `tickets.edit` required for approval
- Approver validation: Only assigned approver or admin can approve
- Audit trail: All actions logged in ticket history
- Soft deletes: Approvals preserved even if ticket is deleted

