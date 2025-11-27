<?php

namespace App\Providers;

use App\Models\KnowledgeBaseArticle;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Bind 'knowledge_base' route parameter to KnowledgeBaseArticle model
        Route::bind('knowledge_base', function ($value) {
            return KnowledgeBaseArticle::findOrFail($value);
        });
    }
}
