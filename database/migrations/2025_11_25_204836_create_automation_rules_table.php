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
        Schema::create('automation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('trigger_event')->default('ticket_created')->comment('ticket_created, ticket_updated, ticket_status_changed');
            $table->json('conditions')->comment('JSON array of conditions to match');
            $table->json('actions')->comment('JSON array of actions to execute');
            $table->integer('priority')->default(0)->comment('Higher priority rules execute first');
            $table->boolean('is_active')->default(true);
            $table->integer('execution_count')->default(0)->comment('Number of times rule has been executed');
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('trigger_event');
            $table->index('is_active');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_rules');
    }
};
