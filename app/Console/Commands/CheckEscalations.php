<?php

namespace App\Console\Commands;

use App\Services\EscalationService;
use Illuminate\Console\Command;

class CheckEscalations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:check-escalations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check and escalate tickets based on escalation rules';

    /**
     * Execute the console command.
     */
    public function handle(EscalationService $escalationService): int
    {
        $this->info('Checking for tickets that need escalation...');

        $escalationService->checkAndEscalate();

        $this->info('Escalation check completed.');

        return Command::SUCCESS;
    }
}
