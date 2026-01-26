<?php

use App\Http\Controllers\Admin\ApprovalLevelController;
use App\Http\Controllers\Admin\AutomationRuleController;
use App\Http\Controllers\Admin\CannedResponseController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomFieldController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\DepartmentController;
use App\Http\Controllers\Admin\EmailTemplateController;
use App\Http\Controllers\Admin\EscalationRuleController;
use App\Http\Controllers\Admin\KnowledgeBaseArticleController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SavedSearchController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\SlaPolicyController;
use App\Http\Controllers\Admin\TagController;
use App\Http\Controllers\Admin\TicketController;
use App\Http\Controllers\Admin\TicketTemplateController;
use App\Http\Controllers\Admin\TimeEntryController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Health check endpoint for production monitoring
Route::get('/health', function () {
    try {
        // Check database connection
        DB::connection()->getPdo();

        // Check Redis connection
        Redis::connection()->ping();

        return response()->json([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
            'services' => [
                'database' => 'connected',
                'redis' => 'connected',
            ],
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'unhealthy',
            'timestamp' => now()->toIso8601String(),
            'error' => $e->getMessage(),
        ], 503);
    }
})->name('health');

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('system-monitor', [\App\Http\Controllers\Admin\SystemMonitorController::class, 'index'])->name('admin.system-monitor');

    Route::resource('projects', \App\Http\Controllers\Admin\ProjectController::class)
        ->names('admin.projects');

    // Ticket routes must be defined BEFORE resource route to avoid conflicts
    Route::get('tickets/export', [TicketController::class, 'export'])
        ->name('admin.tickets.export');
    Route::get('tickets/rejected', [TicketController::class, 'rejected'])
        ->name('admin.tickets.rejected');

    Route::resource('tickets', TicketController::class)
        ->names('admin.tickets');

    Route::post('tickets/bulk-update', [TicketController::class, 'bulkUpdate'])
        ->name('admin.tickets.bulk-update');
    Route::post('tickets/bulk-delete', [TicketController::class, 'bulkDelete'])
        ->name('admin.tickets.bulk-delete');

    // Ticket Approvals
    Route::get('tickets/{ticket}/approval', [\App\Http\Controllers\Admin\TicketApprovalController::class, 'show'])
        ->name('admin.tickets.approval');
    Route::post('ticket-approvals/{approval}/approve', [\App\Http\Controllers\Admin\TicketApprovalController::class, 'approve'])
        ->name('admin.ticket-approvals.approve');
    Route::post('ticket-approvals/{approval}/reject', [\App\Http\Controllers\Admin\TicketApprovalController::class, 'reject'])
        ->name('admin.ticket-approvals.reject');
    Route::get('ticket-approvals/pending', [\App\Http\Controllers\Admin\TicketApprovalController::class, 'pending'])
        ->name('admin.ticket-approvals.pending');

    // Resubmit rejected ticket
    Route::post('tickets/{ticket}/resubmit', [TicketController::class, 'resubmit'])
        ->name('admin.tickets.resubmit');

    // User export/import routes must be defined BEFORE resource route
    Route::get('users/export', [UserController::class, 'export'])
        ->name('admin.users.export');
    Route::post('users/import', [UserController::class, 'import'])
        ->name('admin.users.import');

    Route::resource('users', UserController::class)
        ->names('admin.users');

    Route::post('users/bulk-update', [UserController::class, 'bulkUpdate'])
        ->name('admin.users.bulk-update');
    Route::post('users/bulk-delete', [UserController::class, 'bulkDelete'])
        ->name('admin.users.bulk-delete');
    Route::post('users/{user}/toggle-active', [UserController::class, 'toggleActive'])
        ->name('admin.users.toggle-active');

    Route::resource('departments', DepartmentController::class)
        ->names('admin.departments');
    Route::post('departments/{department}/toggle-status', [DepartmentController::class, 'toggleStatus'])
        ->name('admin.departments.toggle-status');
    Route::post('departments/bulk-update', [DepartmentController::class, 'bulkUpdate'])
        ->name('admin.departments.bulk-update');

    Route::resource('categories', CategoryController::class)
        ->names('admin.categories');
    Route::post('categories/bulk-update', [CategoryController::class, 'bulkUpdate'])
        ->name('admin.categories.bulk-update');
    Route::post('categories/bulk-delete', [CategoryController::class, 'bulkDelete'])
        ->name('admin.categories.bulk-delete');
    Route::post('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])
        ->name('admin.categories.toggle-status');

    Route::resource('canned-responses', CannedResponseController::class)
        ->names('admin.canned-responses');

    Route::get('settings', [SettingsController::class, 'index'])->name('admin.settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('admin.settings.update');

    Route::resource('sla-policies', SlaPolicyController::class)
        ->names('admin.sla-policies');

    Route::resource('tags', TagController::class)
        ->names('admin.tags');

    Route::resource('knowledge-base', KnowledgeBaseArticleController::class)
        ->names('admin.knowledge-base');
    Route::post('knowledge-base/{article}/feedback', [KnowledgeBaseArticleController::class, 'submitFeedback'])
        ->name('admin.knowledge-base.feedback');

    Route::resource('email-templates', EmailTemplateController::class)
        ->names('admin.email-templates');

    Route::resource('automation-rules', AutomationRuleController::class)
        ->names('admin.automation-rules');

    Route::resource('escalation-rules', EscalationRuleController::class)
        ->names('admin.escalation-rules');

    Route::resource('custom-fields', CustomFieldController::class)
        ->names('admin.custom-fields');

    Route::resource('ticket-templates', TicketTemplateController::class)
        ->names('admin.ticket-templates');

    Route::resource('workflow-templates', \App\Http\Controllers\Admin\WorkflowTemplateController::class)
        ->names('admin.workflow-templates');
    Route::post('workflow-templates/{workflowTemplate}/toggle-status', [\App\Http\Controllers\Admin\WorkflowTemplateController::class, 'toggleStatus'])
        ->name('admin.workflow-templates.toggle-status');

    // Approval Levels
    Route::resource('approval-levels', ApprovalLevelController::class)
        ->names('admin.approval-levels');
    Route::post('approval-levels/{approvalLevel}/toggle-status', [ApprovalLevelController::class, 'toggleStatus'])
        ->name('admin.approval-levels.toggle-status');

    Route::resource('roles', RoleController::class)
        ->names('admin.roles');

    Route::prefix('saved-searches')->name('admin.saved-searches.')->group(function () {
        Route::get('/', [SavedSearchController::class, 'index'])->name('index');
        Route::post('/', [SavedSearchController::class, 'store'])->name('store');
        Route::delete('/{savedSearch}', [SavedSearchController::class, 'destroy'])->name('destroy');
        Route::get('/{savedSearch}/apply', [SavedSearchController::class, 'apply'])->name('apply');
    });

    Route::get('ticket-templates/{ticketTemplate}/data', [TicketTemplateController::class, 'getTemplateData'])
        ->name('admin.ticket-templates.data');

    Route::get('ticket-templates/active/list', [TicketTemplateController::class, 'getActiveTemplates'])
        ->name('admin.ticket-templates.active');

    Route::get('ticket-templates/{ticketTemplate}/duplicate', [TicketTemplateController::class, 'duplicate'])
        ->name('admin.ticket-templates.duplicate');

    Route::get('ticket-templates/{ticketTemplate}/create-ticket', [TicketTemplateController::class, 'createFromTemplate'])
        ->name('admin.ticket-templates.create-ticket');

    Route::post('ticket-templates/bulk-update', [TicketTemplateController::class, 'bulkUpdate'])
        ->name('admin.ticket-templates.bulk-update');

    Route::post('ticket-templates/bulk-delete', [TicketTemplateController::class, 'bulkDelete'])
        ->name('admin.ticket-templates.bulk-delete');

    Route::post('ticket-templates/bulk-duplicate', [TicketTemplateController::class, 'bulkDuplicate'])
        ->name('admin.ticket-templates.bulk-duplicate');

    Route::resource('time-entries', TimeEntryController::class)
        ->names('admin.time-entries');

    Route::post('time-entries/{timeEntry}/approve', [TimeEntryController::class, 'approve'])
        ->name('admin.time-entries.approve');

    // Ticket Attachments
    Route::post('tickets/{ticket}/attachments', [\App\Http\Controllers\Admin\TicketAttachmentController::class, 'store'])
        ->name('admin.ticket-attachments.store');
    Route::get('ticket-attachments/{attachment}/download', [\App\Http\Controllers\Admin\TicketAttachmentController::class, 'download'])
        ->name('admin.ticket-attachments.download');
    Route::delete('ticket-attachments/{attachment}', [\App\Http\Controllers\Admin\TicketAttachmentController::class, 'destroy'])
        ->name('admin.ticket-attachments.destroy');

    // Ticket Comments
    Route::post('tickets/{ticket}/comments', [\App\Http\Controllers\Admin\TicketCommentController::class, 'store'])
        ->name('admin.ticket-comments.store');
    Route::put('tickets/{ticket}/comments/{comment}', [\App\Http\Controllers\Admin\TicketCommentController::class, 'update'])
        ->name('admin.ticket-comments.update');
    Route::delete('tickets/{ticket}/comments/{comment}', [\App\Http\Controllers\Admin\TicketCommentController::class, 'destroy'])
        ->name('admin.ticket-comments.destroy');

    Route::prefix('reports')->name('admin.reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');
        Route::get('/tickets', [ReportController::class, 'tickets'])->name('tickets');
        Route::get('/agents', [ReportController::class, 'agents'])->name('agents');
        Route::get('/teams', [ReportController::class, 'teams'])->name('teams');
        Route::get('/sla', [ReportController::class, 'sla'])->name('sla');
        Route::get('/categories', [ReportController::class, 'categories'])->name('categories');
        Route::get('/projects', [ReportController::class, 'projects'])->name('projects');
        Route::get('/time-entries', [ReportController::class, 'timeEntries'])->name('time-entries');
    });

    Route::prefix('notifications')->name('admin.notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::get('/recent', [NotificationController::class, 'recent'])->name('recent');
        Route::delete('/bulk-delete', [NotificationController::class, 'bulkDelete'])->name('bulk-delete');
        Route::post('/bulk-mark-read', [NotificationController::class, 'bulkMarkAsRead'])->name('bulk-mark-read');
    });

    Route::resource('notification-templates', \App\Http\Controllers\Admin\NotificationTemplateController::class)->names([
        'index' => 'admin.notification-templates.index',
        'create' => 'admin.notification-templates.create',
        'store' => 'admin.notification-templates.store',
        'show' => 'admin.notification-templates.show',
        'edit' => 'admin.notification-templates.edit',
        'update' => 'admin.notification-templates.update',
        'destroy' => 'admin.notification-templates.destroy',
    ]);

    // Push notification routes
    Route::prefix('push')->name('push.')->group(function () {
        Route::post('/subscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'subscribe'])->name('subscribe');
        Route::post('/unsubscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'unsubscribe'])->name('unsubscribe');
        Route::get('/vapid-public-key', [\App\Http\Controllers\PushSubscriptionController::class, 'vapidPublicKey'])->name('vapid-public-key');
    });
});

// Route::get('/test-email', function () {
//     try {
//         \Illuminate\Support\Facades\Mail::raw('This is a test email from Kimmex Help Desk', function ($message) {
//             $message->to('chanthou121@outlook.com')
//                     ->subject('Test Email from Kimmex');
//         });
//         return 'Email sent successfully!';
//     } catch (\Exception $e) {
//         return 'Error: ' . $e->getMessage();
//     }
// })->middleware('auth');

require __DIR__.'/settings.php';
