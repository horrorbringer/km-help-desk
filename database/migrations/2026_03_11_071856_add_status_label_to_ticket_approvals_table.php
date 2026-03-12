<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ticket_approvals', function (Blueprint $table) {
            $table->string('status_label')->nullable()->after('approval_level')
                ->comment('Custom status display for the workflow step (e.g. Awaiting CEO)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ticket_approvals', function (Blueprint $table) {
            $table->dropColumn('status_label');
        });
    }
};