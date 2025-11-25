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
        Schema::create('ticket_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('template_data')->comment('Pre-filled ticket data (subject, description, category, priority, etc.)');
            $table->integer('usage_count')->default(0)->comment('Number of times template has been used');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true)->comment('Can be used by all users');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('is_public');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_templates');
    }
};
