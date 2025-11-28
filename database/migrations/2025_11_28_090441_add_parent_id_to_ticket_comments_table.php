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
        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->foreignId('parent_id')
                ->nullable()
                ->after('ticket_id')
                ->constrained('ticket_comments')
                ->onDelete('cascade')
                ->comment('Parent comment ID for threaded replies');
            
            $table->index(['parent_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_comments', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['parent_id', 'created_at']);
            $table->dropColumn('parent_id');
        });
    }
};
