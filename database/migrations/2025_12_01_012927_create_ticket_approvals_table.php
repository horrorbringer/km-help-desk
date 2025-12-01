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
        Schema::create('ticket_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')
                ->constrained('tickets')
                ->onDelete('cascade');
            
            $table->enum('approval_level', ['lm', 'hod'])
                ->comment('Line Manager (lm) or Head of Department (hod)');
            
            $table->foreignId('approver_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null')
                ->comment('User who approved/rejected');
            
            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending');
            
            $table->text('comments')->nullable()
                ->comment('Approver comments');
            
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            
            $table->foreignId('routed_to_team_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('set null')
                ->comment('Team/department to route ticket after approval');
            
            $table->integer('sequence')
                ->default(1)
                ->comment('Order of approval in workflow');
            
            $table->timestamps();
            
            $table->index(['ticket_id', 'approval_level', 'status']);
            $table->index(['approver_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ticket_approvals');
    }
};
