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
        Schema::table('roles', function (Blueprint $table) {
            $table->foreignId('parent_role_id')->nullable()->after('id');
            $table->integer('hierarchy_level')->default(0)->after('parent_role_id');
            $table->json('metadata')->nullable()->after('guard_name');
            $table->boolean('is_system_role')->default(false)->after('metadata');
            
            $table->foreign('parent_role_id')->references('id')->on('roles')->onDelete('set null');
            $table->index('hierarchy_level');
            $table->index('is_system_role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropForeign(['parent_role_id']);
            $table->dropIndex(['hierarchy_level']);
            $table->dropIndex(['is_system_role']);
            $table->dropColumn(['parent_role_id', 'hierarchy_level', 'metadata', 'is_system_role']);
        });
    }
};
