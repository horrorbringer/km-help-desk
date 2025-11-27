<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Makes assigned_team_id nullable to allow tickets to be assigned
     * to agents without requiring a team assignment.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver === 'sqlite') {
            // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
            DB::statement('PRAGMA foreign_keys=off;');
            
            // Create new table with nullable assigned_team_id
            DB::statement('
                CREATE TABLE tickets_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticket_number VARCHAR(20) UNIQUE NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    requester_id INTEGER NOT NULL,
                    assigned_team_id INTEGER NULL,
                    assigned_agent_id INTEGER NULL,
                    category_id INTEGER NOT NULL,
                    project_id INTEGER NULL,
                    sla_policy_id INTEGER NULL,
                    status VARCHAR(255) NOT NULL DEFAULT "open",
                    priority VARCHAR(255) NOT NULL DEFAULT "medium",
                    source VARCHAR(50) NOT NULL DEFAULT "web",
                    first_response_at TIMESTAMP NULL,
                    first_response_due_at TIMESTAMP NULL,
                    resolution_due_at TIMESTAMP NULL,
                    resolved_at TIMESTAMP NULL,
                    closed_at TIMESTAMP NULL,
                    response_sla_breached BOOLEAN NOT NULL DEFAULT 0,
                    resolution_sla_breached BOOLEAN NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NULL,
                    updated_at TIMESTAMP NULL,
                    deleted_at TIMESTAMP NULL,
                    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_team_id) REFERENCES departments(id) ON DELETE RESTRICT,
                    FOREIGN KEY (assigned_agent_id) REFERENCES users(id) ON DELETE SET NULL,
                    FOREIGN KEY (category_id) REFERENCES ticket_categories(id) ON DELETE RESTRICT,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
                    FOREIGN KEY (sla_policy_id) REFERENCES sla_policies(id) ON DELETE SET NULL
                )
            ');
            
            // Copy data from old table
            DB::statement('INSERT INTO tickets_new SELECT * FROM tickets;');
            
            // Drop old table and rename new one
            DB::statement('DROP TABLE tickets;');
            DB::statement('ALTER TABLE tickets_new RENAME TO tickets;');
            
            // Recreate indexes
            DB::statement('CREATE INDEX IF NOT EXISTS tickets_status_priority_assigned_team_id_index ON tickets(status, priority, assigned_team_id);');
            DB::statement('CREATE INDEX IF NOT EXISTS tickets_requester_id_status_index ON tickets(requester_id, status);');
            DB::statement('CREATE INDEX IF NOT EXISTS tickets_assigned_agent_id_status_index ON tickets(assigned_agent_id, status);');
            DB::statement('CREATE INDEX IF NOT EXISTS tickets_resolution_due_at_index ON tickets(resolution_due_at);');
            DB::statement('CREATE INDEX IF NOT EXISTS tickets_project_id_index ON tickets(project_id);');
            
            DB::statement('PRAGMA foreign_keys=on;');
        } else {
            // For MySQL/PostgreSQL, modify the column directly
            Schema::table('tickets', function (Blueprint $table) {
                $table->foreignId('assigned_team_id')
                    ->nullable()
                    ->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        
        if ($driver !== 'sqlite') {
            // For MySQL/PostgreSQL, make it NOT NULL again
            // Note: This will fail if there are tickets with null assigned_team_id
            Schema::table('tickets', function (Blueprint $table) {
                $table->foreignId('assigned_team_id')
                    ->nullable(false)
                    ->change();
            });
        }
        // SQLite rollback would require recreating the table again
    }
};
