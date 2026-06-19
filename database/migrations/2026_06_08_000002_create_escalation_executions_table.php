<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('escalation_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('escalation_rule_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('ticket_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('occurrence_key');
            $table->timestamp('executed_at');
            $table->timestamps();

            $table->unique(
                ['escalation_rule_id', 'ticket_id', 'occurrence_key'],
                'escalation_execution_occurrence_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('escalation_executions');
    }
};
