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
        Schema::create('custom_fields', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('label');
            $table->text('description')->nullable();
            $table->string('field_type')->comment('text, textarea, number, select, multiselect, date, datetime, boolean, file');
            $table->json('options')->nullable()->comment('JSON array of options for select/multiselect fields');
            $table->string('default_value')->nullable();
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->string('validation_rules')->nullable()->comment('JSON validation rules');
            $table->string('placeholder')->nullable();
            $table->text('help_text')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('display_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('custom_fields');
    }
};
