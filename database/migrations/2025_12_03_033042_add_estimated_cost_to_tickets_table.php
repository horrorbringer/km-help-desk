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
        Schema::table('tickets', function (Blueprint $table) {
            $table->decimal('estimated_cost', 10, 2)
                  ->nullable()
                  ->after('priority')
                  ->comment('Estimated cost for purchase/expense tickets. Used for cost-based HOD approval.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn('estimated_cost');
        });
    }
};
