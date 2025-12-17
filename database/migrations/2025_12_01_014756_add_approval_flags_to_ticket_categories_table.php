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
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->boolean('requires_approval')->default(true)
                ->after('default_team_id')
                ->comment('Whether tickets in this category require Line Manager approval');
            
            $table->boolean('requires_hod_approval')->default(false)
                ->after('requires_approval')
                ->comment('Whether tickets in this category require Head of Department approval');
            
            $table->decimal('hod_approval_threshold', 10, 2)->nullable()
                ->after('requires_hod_approval')
                ->comment('Cost threshold above which HOD approval is required (if applicable)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_categories', function (Blueprint $table) {
            $table->dropColumn(['requires_approval', 'requires_hod_approval', 'hod_approval_threshold']);
        });
    }
};
