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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->comment('Setting key (e.g., app_name, smtp_host)');
            $table->text('value')->nullable()->comment('Setting value');
            $table->string('type', 50)->default('string')->comment('Setting type: string, integer, boolean, json');
            $table->string('group', 50)->default('general')->comment('Setting group: general, email, ticket, notification, security');
            $table->text('description')->nullable()->comment('Human-readable description');
            $table->timestamps();
            
            $table->index('group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
