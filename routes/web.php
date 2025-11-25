<?php

use App\Http\Controllers\Frontend\ProjectFrontendController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');
// Public projects pages
Route::get('/projects', [ProjectFrontendController::class, 'index'])
    ->name('projects.index');

Route::get('/projects/{slug}', [ProjectFrontendController::class, 'show'])
    ->name('projects.show');

Route::middleware(['auth', 'verified'])->prefix('admin')->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('projects', \App\Http\Controllers\Admin\ProjectController::class)
        ->names('admin.projects');
});

require __DIR__.'/settings.php';
