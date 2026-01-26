<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Changes approval_level from enum to string to support dynamic approval levels
     * like dlm, dhod, dceo, and custom levels for different companies.
     */
    public function up(): void
    {
        // For MySQL, we need to drop the enum and recreate as string
        // For PostgreSQL, we can use ALTER COLUMN TYPE
        
        if (DB::getDriverName() === 'mysql') {
            // MySQL: Drop enum constraint and change to string
            DB::statement("ALTER TABLE ticket_approvals MODIFY approval_level VARCHAR(50) NOT NULL COMMENT 'Approval level (lm, dlm, hod, dhod, ceo, dceo, or custom)'");
        } else {
            // PostgreSQL and others: Use ALTER COLUMN
            Schema::table('ticket_approvals', function (Blueprint $table) {
                $table->string('approval_level', 50)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore enum for backward compatibility
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE ticket_approvals MODIFY approval_level ENUM('lm', 'hod', 'ceo') NOT NULL COMMENT 'Line Manager (lm), Head of Department (hod), or CEO (ceo)'");
        } else {
            // For PostgreSQL, we'd need to use a check constraint
            // This is simplified - in production, you might want to handle this differently
            Schema::table('ticket_approvals', function (Blueprint $table) {
                $table->enum('approval_level', ['lm', 'hod', 'ceo'])->change();
            });
        }
    }
};
