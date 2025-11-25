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
        Schema::create('ticket_custom_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('tickets')->onDelete('cascade');
            $table->foreignId('custom_field_id')->constrained('custom_fields')->onDelete('cascade');
            $table->text('value')->nullable()->comment('Stored as text, JSON for multiselect');
            $table->timestamps();

            $table->unique(['ticket_id', 'custom_field_id']);
            $table->index('ticket_id');
            $table->index('custom_field_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_custom_field_values');
    }
};
