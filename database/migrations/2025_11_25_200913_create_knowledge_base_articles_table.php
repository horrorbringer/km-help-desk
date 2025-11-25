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
        Schema::create('knowledge_base_articles', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->text('excerpt')->nullable()->comment('Short summary for listings');
            $table->foreignId('category_id')->nullable()->constrained('ticket_categories')->nullOnDelete();
            $table->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->integer('views_count')->default(0);
            $table->integer('helpful_count')->default(0);
            $table->integer('not_helpful_count')->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('category_id');
            $table->index('is_featured');
            // Note: Fulltext index not supported in SQLite, using regular indexes instead
            $table->index('title');
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('knowledge_base_articles');
    }
};
