<?php

namespace App\Providers;

use App\Models\KnowledgeBaseArticle;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
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

        // Bind 'attachment' route parameter to TicketAttachment model
        Route::bind('attachment', function ($value) {
            return TicketAttachment::findOrFail($value);
        });

        // Bind 'comment' route parameter to TicketComment model
        Route::bind('comment', function ($value) {
            return TicketComment::findOrFail($value);
        });
    }
}
