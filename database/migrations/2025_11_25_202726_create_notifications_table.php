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
        Schema::create('help_desk_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->comment('ticket_created, ticket_assigned, ticket_updated, ticket_resolved, ticket_commented, etc.');
            $table->string('title');
            $table->text('message');
            $table->foreignId('ticket_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('related_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('data')->nullable()->comment('Additional data in JSON format');
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
            $table->index(['user_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('help_desk_notifications');
    }
};
