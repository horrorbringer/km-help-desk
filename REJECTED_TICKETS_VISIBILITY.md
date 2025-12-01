# Rejected Tickets - Visibility and Deletion Policy

## Deletion Behavior

**Rejected tickets are NOT deleted** - they remain in the system for audit and compliance purposes.

### Current Implementation:
- When a ticket is rejected, its status is changed to `cancelled`
- The ticket record remains in the database
- The rejection is recorded in the ticket history
- The approval record is marked as `rejected` with comments

### Why Not Delete?
1. **Audit Trail**: Maintains a complete history of all ticket requests
2. **Compliance**: Required for regulatory and compliance reporting
3. **Resubmission**: Allows tickets to be resubmitted after addressing rejection reasons
4. **Analytics**: Enables analysis of rejection patterns and reasons
5. **Accountability**: Keeps records of who rejected what and why

### Soft Delete Option:
The Ticket model uses Laravel's `SoftDeletes` trait, which means:
- Tickets can be soft-deleted (marked as deleted but not removed from database)
- Soft-deleted tickets are excluded from normal queries
- Only users with appropriate permissions can restore soft-deleted tickets
- Currently, rejected tickets are NOT soft-deleted automatically

## Visibility Rules

### Who Can See Rejected Tickets?

#### 1. **Requesters (Ticket Creators)**
- ✅ Can see their own rejected tickets
- ✅ Can view rejection reason and comments
- ✅ Can resubmit their rejected tickets (if they have `tickets.edit` permission)

#### 2. **Managers & Administrators**
- ✅ Can see ALL rejected tickets
- ✅ Full access to rejection details
- ✅ Can resubmit any rejected ticket
- ✅ Can view rejection analytics

#### 3. **Agents**
- ✅ Can see rejected tickets assigned to them
- ✅ Can see rejected tickets in their assigned team/department
- ✅ Limited visibility (only tickets they're involved with)

#### 4. **Regular Users (No Special Permissions)**
- ✅ Can see their own rejected tickets (as requester)
- ❌ Cannot see other users' rejected tickets

## Implementation Details

### Rejected Tickets Page (`/admin/tickets/rejected`)
- Filters tickets based on user role and permissions
- Shows only tickets the user is authorized to view
- Displays rejection reason, approver, and timestamp
- Provides resubmit functionality

### Main Ticket List
- Rejected tickets (status: `cancelled`) appear in the main list
- Can be filtered using the "Approval Status" filter
- Can be filtered by status: `cancelled`
- Badge indicator shows "Rejected" for easy identification

### Ticket Show Page
- Prominent red banner for rejected tickets
- Shows full rejection details
- Resubmit button (if user has `tickets.edit` permission)

## Permission Requirements

| Action | Permission Required |
|--------|-------------------|
| View own rejected tickets | `tickets.view` |
| View all rejected tickets | `tickets.view` + `tickets.assign` |
| View rejected tickets page | `tickets.view` |
| Resubmit rejected ticket | `tickets.edit` |
| Delete rejected ticket | `tickets.delete` |

## Best Practices

1. **Don't Delete Rejected Tickets**: Keep them for audit purposes
2. **Use Soft Delete if Needed**: If you must remove tickets, use soft delete to maintain audit trail
3. **Document Rejection Reasons**: Always provide clear rejection comments
4. **Enable Resubmission**: Allow requesters to address issues and resubmit
5. **Monitor Rejection Patterns**: Use analytics to identify common rejection reasons

## Future Enhancements

Potential improvements:
- Auto-archive rejected tickets after X days
- Bulk operations on rejected tickets
- Rejection reason templates
- Rejection analytics dashboard
- Email notifications for rejections
- Rejection workflow improvements

