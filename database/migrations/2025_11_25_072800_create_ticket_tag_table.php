<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_tag', function (Blueprint $table) {
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->onDelete('cascade');

            $table->foreignId('tag_id')
                ->constrained('tags')
                ->onDelete('cascade');

            $table->timestamp('created_at')->nullable();

            $table->primary(['ticket_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ticket_tag');
    }
};


