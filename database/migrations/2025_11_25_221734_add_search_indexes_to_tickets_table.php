<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Composite indexes for common search combinations
            $table->index(['status', 'priority'], 'tickets_status_priority_idx');
            $table->index(['assigned_agent_id', 'status'], 'tickets_agent_status_idx');
            $table->index(['assigned_team_id', 'status'], 'tickets_team_status_idx');
            $table->index(['category_id', 'status'], 'tickets_category_status_idx');
            $table->index(['project_id', 'status'], 'tickets_project_status_idx');
            $table->index(['requester_id', 'status'], 'tickets_requester_status_idx');
            $table->index(['created_at', 'status'], 'tickets_created_status_idx');
            
            // Full-text search index (if using MySQL)
            // For SQLite, we'll use regular indexes
            if (config('database.default') === 'mysql') {
                $table->fullText(['subject', 'description'], 'tickets_fulltext_idx');
            } else {
                $table->index('subject', 'tickets_subject_idx');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex('tickets_status_priority_idx');
            $table->dropIndex('tickets_agent_status_idx');
            $table->dropIndex('tickets_team_status_idx');
            $table->dropIndex('tickets_category_status_idx');
            $table->dropIndex('tickets_project_status_idx');
            $table->dropIndex('tickets_requester_status_idx');
            $table->dropIndex('tickets_created_status_idx');
            
            if (config('database.default') === 'mysql') {
                $table->dropIndex('tickets_fulltext_idx');
            } else {
                $table->dropIndex('tickets_subject_idx');
            }
        });
    }
};
