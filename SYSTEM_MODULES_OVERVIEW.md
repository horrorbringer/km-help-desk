# Kimmix CMS - System Modules Overview

This document provides a comprehensive overview of all modules and features in the Kimmix CMS system.

## Core Modules

### 1. **Dashboard** 📊
- **Route**: `/admin/dashboard`
- **Controller**: `DashboardController`
- **Description**: Main dashboard with system overview, statistics, and quick actions
- **Features**:
  - Ticket statistics
  - Recent activity
  - Quick access to common tasks

### 2. **Tickets** 🎫 (Core Module)
- **Route**: `/admin/tickets`
- **Controller**: `TicketController`
- **Description**: Complete ticket management system
- **Features**:
  - Create, view, edit, delete tickets
  - File attachments with image preview
  - Comments with threading/replies
  - Activity timeline/history
  - Advanced search and filtering
  - Bulk operations
  - CSV export
  - Status management (open, assigned, in_progress, pending, resolved, closed, cancelled)
  - Priority levels (low, medium, high, critical)
  - SLA tracking
  - Tags support
  - Custom fields
  - Watchers
  - **Approval Workflow**:
    - Line Manager approval
    - Head of Department approval
    - Pending approvals page
    - Rejected tickets management
    - Resubmit functionality

### 3. **Ticket Templates** 📝
- **Route**: `/admin/ticket-templates`
- **Controller**: `TicketTemplateController`
- **Description**: Pre-configured ticket templates
- **Features**:
  - Create/edit templates
  - Template variables/placeholders (`{date}`, `{user}`, `{time}`)
  - Quick create from template
  - Template duplication
  - Bulk operations (activate/deactivate, delete, duplicate)
  - Active/inactive status
  - Public/private templates
  - Usage tracking

### 4. **Ticket Approvals** ✅
- **Route**: `/admin/ticket-approvals`
- **Controller**: `TicketApprovalController`
- **Description**: Approval workflow management
- **Features**:
  - Pending approvals page
  - Approve/reject tickets
  - Approval routing to teams
  - Approval history
  - Multi-level approvals (LM, HOD)
  - Conditional approvals based on category/priority

### 5. **Rejected Tickets** ❌
- **Route**: `/admin/tickets/rejected`
- **Controller**: `TicketController@rejected`
- **Description**: Management of rejected tickets
- **Features**:
  - View all rejected tickets
  - Resubmit rejected tickets
  - Visibility controls (requester, manager, admin)
  - Rejection reason tracking

## Management Modules

### 6. **Users** 👥
- **Route**: `/admin/users`
- **Controller**: `UserController`
- **Description**: User management
- **Features**:
  - Create, edit, delete users
  - User profiles
  - Bulk operations
  - CSV export/import
  - Toggle active/inactive
  - Department assignment
  - Role assignment

### 7. **Roles & Permissions** 🔐
- **Route**: `/admin/roles`
- **Controller**: `RoleController`
- **Description**: Role-based access control
- **Features**:
  - Create/edit roles
  - Assign permissions to roles
  - Permission management
  - Role assignment to users

### 8. **Departments** 🏢
- **Route**: `/admin/departments`
- **Controller**: `DepartmentController`
- **Description**: Department/team management
- **Features**:
  - Create, edit, delete departments
  - Department details
  - Team assignment
  - Department hierarchy

### 9. **Projects** 📁
- **Route**: `/admin/projects`
- **Controller**: `ProjectController`
- **Description**: Project management
- **Features**:
  - Create, edit, delete projects
  - Project details
  - Project code
  - Ticket association

## Configuration Modules

### 10. **Categories** 📂
- **Route**: `/admin/categories`
- **Controller**: `CategoryController`
- **Description**: Ticket category management
- **Features**:
  - Create, edit, delete categories
  - Category configuration
  - Approval workflow settings per category
  - HOD approval thresholds

### 11. **Tags** 🏷️
- **Route**: `/admin/tags`
- **Controller**: `TagController`
- **Description**: Tag management
- **Features**:
  - Create, edit, delete tags
  - Color coding
  - Tag assignment to tickets

### 12. **SLA Policies** ⏱️
- **Route**: `/admin/sla-policies`
- **Controller**: `SlaPolicyController`
- **Description**: Service Level Agreement management
- **Features**:
  - Create, edit, delete SLA policies
  - Response time targets
  - Resolution time targets
  - SLA breach tracking
  - Policy details

### 13. **Custom Fields** 📋
- **Route**: `/admin/custom-fields`
- **Controller**: `CustomFieldController`
- **Description**: Custom field configuration
- **Features**:
  - Create, edit, delete custom fields
  - Multiple field types (text, number, select, etc.)
  - Field validation
  - Required/optional fields
  - Default values

### 14. **Canned Responses** 💬
- **Route**: `/admin/canned-responses`
- **Controller**: `CannedResponseController`
- **Description**: Pre-written response templates
- **Features**:
  - Create, edit, delete canned responses
  - Quick insert into tickets/comments
  - Category organization

### 15. **Email Templates** 📧
- **Route**: `/admin/email-templates`
- **Controller**: `EmailTemplateController`
- **Description**: Email template management
- **Features**:
  - Create, edit, delete email templates
  - Template variables
  - Email notifications

### 16. **Automation Rules** ⚙️
- **Route**: `/admin/automation-rules`
- **Controller**: `AutomationRuleController`
- **Description**: Automated ticket processing
- **Features**:
  - Create, edit, delete automation rules
  - Rule conditions
  - Rule actions
  - Trigger-based automation

### 17. **Escalation Rules** 📈
- **Route**: `/admin/escalation-rules`
- **Controller**: `EscalationRuleController`
- **Description**: Ticket escalation management
- **Features**:
  - Create, edit, delete escalation rules
  - Escalation triggers
  - Escalation actions
  - Time-based escalation

## Content Modules

### 18. **Knowledge Base** 📚
- **Route**: `/admin/knowledge-base`
- **Controller**: `KnowledgeBaseArticleController`
- **Description**: Knowledge base article management
- **Features**:
  - Create, edit, delete articles
  - Article categories
  - Search functionality
  - Public/private articles
  - Article details view

## Analytics & Reporting

### 19. **Reports** 📊
- **Route**: `/admin/reports`
- **Controller**: `ReportController`
- **Description**: Analytics and reporting
- **Features**:
  - Ticket reports
  - Agent performance
  - Team performance
  - Category reports
  - Project reports
  - SLA reports
  - Custom date ranges
  - Export capabilities

## Additional Features

### 20. **Time Entries** ⏰
- **Route**: `/admin/time-entries`
- **Controller**: `TimeEntryController`
- **Description**: Time tracking
- **Features**:
  - Log time on tickets
  - Time entry management
  - Time approval (for managers)
  - Time reports

### 21. **Notifications** 🔔
- **Route**: `/admin/notifications`
- **Controller**: `NotificationController`
- **Description**: Notification management
- **Features**:
  - View notifications
  - Mark as read/unread
  - Notification preferences

### 22. **Saved Searches** 🔍
- **Route**: `/admin/saved-searches`
- **Controller**: `SavedSearchController`
- **Description**: Save and reuse search filters
- **Features**:
  - Save search filters
  - Quick access to saved searches
  - Share searches
  - Usage tracking

### 23. **Settings** ⚙️
- **Route**: `/admin/settings`
- **Controller**: `SettingsController`
- **Description**: System configuration
- **Features**:
  - General settings
  - Email settings
  - System preferences
  - Configuration management

## Supporting Features

### 24. **Ticket Comments** 💬
- **Controller**: `TicketCommentController`
- **Description**: Comment management
- **Features**:
  - Add comments to tickets
  - Edit/delete comments
  - Threaded replies
  - Internal/public comments
  - Email notifications

### 25. **Ticket Attachments** 📎
- **Controller**: `TicketAttachmentController`
- **Description**: File attachment management
- **Features**:
  - Upload attachments
  - Download attachments
  - Delete attachments
  - Image preview with zoom/pan
  - Fullscreen view

## Module Relationships

```
Tickets (Core)
├── Ticket Templates
├── Ticket Approvals
├── Ticket Comments
├── Ticket Attachments
├── Categories
├── Tags
├── Projects
├── SLA Policies
├── Custom Fields
├── Users (Requester, Agent, Manager)
├── Departments (Teams)
└── Time Entries

Automation Rules → Tickets
Escalation Rules → Tickets
Canned Responses → Tickets/Comments
Email Templates → Notifications
Knowledge Base → Self-service
Reports → All modules
```

## Permission Structure

Each module has standard permissions:
- `{module}.view` - View records
- `{module}.create` - Create records
- `{module}.edit` - Edit records
- `{module}.delete` - Delete records

Special permissions:
- `tickets.assign` - Assign tickets to agents/teams
- `tickets.resolve` - Resolve tickets
- `tickets.close` - Close tickets
- `tickets.auto-approve` - Bypass approval workflow
- `time-entries.approve` - Approve time entries

## Module Status

✅ **Fully Implemented**: Tickets, Ticket Templates, Ticket Approvals, Users, Roles, Departments, Projects, Categories, Tags, SLA Policies, Custom Fields, Canned Responses, Email Templates, Automation Rules, Escalation Rules, Knowledge Base, Reports, Time Entries, Notifications, Settings

🔄 **In Progress**: Advanced reporting features, Enhanced automation

📋 **Planned**: 
- Asset Management
- Change Management
- Problem Management
- Service Catalog
- Contract Management
- Vendor Management

## Quick Access

All modules are accessible via:
- **Sidebar Navigation**: Organized by category
- **Direct Routes**: `/admin/{module}`
- **Dashboard**: Quick links and statistics
- **Search**: Global search functionality

