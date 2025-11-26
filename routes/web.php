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

    Route::resource('tickets', TicketController::class)
        ->names('admin.tickets');

    Route::resource('users', UserController::class)
        ->names('admin.users');

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

    Route::resource('time-entries', TimeEntryController::class)
        ->names('admin.time-entries');
    
    Route::post('time-entries/{timeEntry}/approve', [TimeEntryController::class, 'approve'])
        ->name('admin.time-entries.approve');

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
