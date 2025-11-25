<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('ticket_categories')
                ->onDelete('restrict')
                ->comment('For hierarchical categories (e.g., IT > Hardware > Laptop)');

            $table->foreignId('default_team_id')
                ->constrained('departments')
                ->onDelete('restrict')
                ->comment('Default department for auto-routing');

            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['parent_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_categories');
    }
};


