<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('priority', ['low', 'medium', 'high', 'critical']);
            $table->integer('response_time')->comment('Minutes until first response required');
            $table->integer('resolution_time')->comment('Minutes until resolution required');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_policies');
    }
};


