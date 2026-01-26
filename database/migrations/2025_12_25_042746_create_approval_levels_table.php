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
        Schema::create('approval_levels', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Unique code (e.g., lm, dlm, hod, finance_manager)');
            $table->string('label')->comment('Human-readable label (e.g., Line Manager, Finance Manager)');
            $table->text('description')->nullable()->comment('Optional description of this approval level');
            $table->json('role_names')->comment('Array of role names that can approve at this level');
            $table->integer('hierarchy_order')->default(99)->comment('Order in approval hierarchy (lower = earlier)');
            $table->boolean('is_active')->default(true)->comment('Whether this approval level is active');
            $table->boolean('is_system_level')->default(false)->comment('System levels cannot be deleted');
            $table->integer('sort_order')->default(0)->comment('For UI display ordering');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'sort_order']);
            $table->index('hierarchy_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_levels');
    }
};

