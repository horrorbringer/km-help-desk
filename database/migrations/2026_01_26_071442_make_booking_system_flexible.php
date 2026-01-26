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
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignId('parent_id')->nullable()->after('id')->comment('For recurring series')->constrained('bookings')->nullOnDelete();
            $table->json('video_conference')->nullable()->after('status')->comment('Zoom/Google Meet details');
            $table->json('metadata')->nullable()->after('video_conference')->comment('Flexible data: guests, recurrence rules, check-in status');
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->json('metadata')->nullable()->after('color')->comment('Flexible data: rules, specific constraints');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn(['parent_id', 'video_conference', 'metadata']);
        });

        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn(['metadata']);
        });
    }
};
