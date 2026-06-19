<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->foreignId('workflow_template_id')
                ->nullable()
                ->after('default_team_id')
                ->constrained('workflow_templates')
                ->nullOnDelete()
                ->comment('Preferred workflow template for tickets in this category');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->dropConstrainedForeignId('workflow_template_id');
        });
    }
};
