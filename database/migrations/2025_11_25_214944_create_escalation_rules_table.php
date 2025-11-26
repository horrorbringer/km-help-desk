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
        Schema::create('escalation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('conditions')->nullable()->comment('JSON conditions to match tickets');
            $table->string('time_trigger_type')->nullable()->comment('created_at, updated_at, first_response_due_at, resolution_due_at');
            $table->integer('time_trigger_minutes')->nullable()->comment('Minutes after trigger to escalate');
            $table->json('actions')->comment('JSON actions to execute on escalation');
            $table->integer('priority')->default(0)->comment('Higher priority rules execute first');
            $table->boolean('is_active')->default(true);
            $table->integer('execution_count')->default(0)->comment('Number of times rule has been executed');
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('priority');
            $table->index('time_trigger_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escalation_rules');
    }
};
