<?php

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
use App\Http\Controllers\Admin\TimeEntryController;
use App\Http\Controllers\Admin\TicketController;
use App\Http\Controllers\Admin\TicketTemplateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Frontend\ProjectFrontendController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('projects', \App\Http\Controllers\Admin\ProjectController::class)
        ->names('admin.projects');

    // Ticket export route must be defined BEFORE resource route
    Route::get('tickets/export', [TicketController::class, 'export'])
        ->name('admin.tickets.export');
    
    Route::resource('tickets', TicketController::class)
        ->names('admin.tickets');
    
    Route::post('tickets/bulk-update', [TicketController::class, 'bulkUpdate'])
        ->name('admin.tickets.bulk-update');
    Route::post('tickets/bulk-delete', [TicketController::class, 'bulkDelete'])
        ->name('admin.tickets.bulk-delete');

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

    Route::resource('categories', CategoryController::class)
        ->names('admin.categories');

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
    });

    Route::prefix('notifications')->name('admin.notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('read');
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::get('/recent', [NotificationController::class, 'recent'])->name('recent');
    });
});

require __DIR__.'/settings.php';
