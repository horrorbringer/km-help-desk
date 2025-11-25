<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_comments', function (Blueprint $table) {
            $table->id();
            $table->text('body');

            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->onDelete('cascade');

            $table->foreignId('user_id')
                ->constrained('users')
                ->onDelete('restrict');

            $table->boolean('is_internal')
                ->default(false)
                ->comment('True if comment is only visible to agents');

            $table->enum('type', ['comment', 'status_change', 'assignment', 'system'])
                ->default('comment');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['ticket_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_comments');
    }
};


