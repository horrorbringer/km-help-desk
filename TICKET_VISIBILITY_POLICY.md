# Ticket Visibility Policy

This document defines who can see which tickets in the system.

## Current Implementation ✅

Ticket visibility is now properly implemented with role-based filtering:

1. **SearchService**: Applies visibility filters at the query level for the ticket index
2. **TicketController**: Checks visibility before showing individual tickets
3. **Role-based**: Filters based on user role, permissions, and relationships

## Recommended Visibility Rules

### 1. **Administrators** 👑
- **Can See**: ALL tickets
- **Permission**: `tickets.view` + `tickets.assign`
- **Rationale**: Full system access for management and oversight

### 2. **Managers** 📊
- **Can See**: 
  - ALL tickets (if they have `tickets.assign` permission)
  - OR tickets in their department/team
  - Tickets they created
  - Tickets assigned to them
- **Permission**: `tickets.view`
- **Rationale**: Department/team oversight while maintaining privacy

### 3. **Agents** 🎯
- **Can See**:
  - Tickets assigned to them
  - Tickets assigned to their team/department
  - Tickets they created (as requester)
  - Tickets they're watching
- **Permission**: `tickets.view`
- **Rationale**: Only see tickets they're responsible for

### 4. **Requesters** 👤
- **Can See**:
  - Tickets they created
  - Tickets they're watching
  - Public tickets (if applicable)
- **Permission**: `tickets.view`
- **Rationale**: Users should see their own tickets

## Implementation Strategy ✅ (IMPLEMENTED)

**Option 1: Role-Based Filtering** - This is the implemented approach.

Filter tickets based on user role and relationships:
- ✅ Admin/Manager with `tickets.assign`: See all tickets
- ✅ Manager without `tickets.assign`: See department tickets
- ✅ Agent: See assigned/team tickets
- ✅ Requester: See own tickets

### Implementation Details

1. **SearchService::applyVisibilityFilters()**
   - Applied automatically in ticket search
   - Filters at database query level for performance
   - Respects user permissions and roles

2. **TicketController::canUserViewTicket()**
   - Checks visibility before showing individual tickets
   - Returns 403 if user cannot view ticket
   - Used in `show()` method

3. **Visibility Criteria** (checked in order):
   - User has `tickets.assign` permission → See all
   - User is the requester → Can see
   - User is the assigned agent → Can see
   - Ticket is in user's department → Can see
   - User is watching the ticket → Can see
   - User is Manager in ticket's department → Can see

## Visibility Scenarios

### Scenario 1: Regular User (Requester)
- Creates ticket → Can see it
- Ticket assigned to agent → Still can see it (they created it)
- Ticket resolved → Still can see it
- Other users' tickets → Cannot see

### Scenario 2: Agent
- Ticket assigned to them → Can see it
- Ticket in their team → Can see it
- Ticket they created → Can see it
- Unassigned ticket in their team → Can see it
- Ticket in other team → Cannot see (unless watching)

### Scenario 3: Manager
- All tickets in their department → Can see
- Tickets assigned to their team members → Can see
- Tickets they created → Can see
- Tickets in other departments → Cannot see (unless admin)

### Scenario 4: Administrator
- ALL tickets → Can see
- All departments → Can see
- All statuses → Can see

## Special Cases

### Rejected Tickets
- Requester: Can see their own rejected tickets
- Manager/Admin: Can see all rejected tickets
- Agent: Can see rejected tickets assigned to them/their team

### Internal Comments
- Only visible to users who can see the ticket
- Additional check for `is_internal` flag

### Watchers
- Users watching a ticket can see it (even if not assigned)
- Useful for stakeholders who need visibility

## Implementation Notes

1. **Performance**: Filter at query level, not in application
2. **Caching**: Consider caching visibility rules per user
3. **Audit**: Log visibility access for security
4. **Flexibility**: Allow configuration per organization

