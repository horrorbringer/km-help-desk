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
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('event_type')->comment('ticket_created, ticket_assigned, ticket_updated, ticket_resolved, ticket_commented, etc.');
            $table->string('subject');
            $table->text('body_html')->nullable();
            $table->text('body_text')->nullable();
            $table->text('variables')->nullable()->comment('JSON array of available variables');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('event_type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
