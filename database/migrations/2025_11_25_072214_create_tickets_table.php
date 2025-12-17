<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number', 20)->unique()->comment('Human-readable ticket number');
            $table->string('subject');
            $table->text('description');

            $table->foreignId('requester_id')
                ->constrained('users')
                ->onDelete('cascade');

            $table->foreignId('assigned_team_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('restrict');

            $table->foreignId('assigned_agent_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');

            $table->foreignId('category_id')
                ->constrained('ticket_categories')
                ->onDelete('restrict');

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->onDelete('set null')
                ->comment('Link ticket to construction project if applicable');

            $table->foreignId('sla_policy_id')
                ->nullable()
                ->constrained('sla_policies')
                ->onDelete('set null');

            $table->enum('status', ['open', 'assigned', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'])
                ->default('open');

            $table->enum('priority', ['low', 'medium', 'high', 'critical'])
                ->default('medium');

            $table->string('source', 50)
                ->default('web')
                ->comment('email, phone, web, mobile_app, walk_in');

            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('first_response_due_at')->nullable();
            $table->timestamp('resolution_due_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->boolean('response_sla_breached')->default(false);
            $table->boolean('resolution_sla_breached')->default(false);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'priority', 'assigned_team_id']);
            $table->index(['requester_id', 'status']);
            $table->index(['assigned_agent_id', 'status']);
            $table->index('resolution_due_at');
            $table->index('project_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
