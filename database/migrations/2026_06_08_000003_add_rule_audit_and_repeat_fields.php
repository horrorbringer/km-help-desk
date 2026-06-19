<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('escalation_rules', function (Blueprint $table) {
            $table->unsignedInteger('repeat_interval_minutes')
                ->nullable()
                ->after('time_trigger_minutes');
        });

        Schema::table('ticket_histories', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('ticket_histories', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });

        Schema::table('escalation_rules', function (Blueprint $table) {
            $table->dropColumn('repeat_interval_minutes');
        });
    }
};
