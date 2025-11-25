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
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->integer('duration_minutes')->comment('Duration in minutes');
            $table->text('description')->nullable();
            $table->string('activity_type')->nullable()->comment('e.g., Development, Support, Meeting, etc.');
            $table->boolean('is_billable')->default(true);
            $table->decimal('hourly_rate', 10, 2)->nullable()->comment('Hourly rate for billing calculation');
            $table->decimal('amount', 10, 2)->nullable()->comment('Calculated amount (duration * rate)');
            $table->boolean('is_approved')->default(false);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('ticket_id');
            $table->index('user_id');
            $table->index('date');
            $table->index('is_billable');
            $table->index('is_approved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_entries');
    }
};
