<?php

namespace App\Services;

use App\Models\EscalationRule;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;

class EscalationService
{
    /**
     * Check and escalate tickets based on rules
     */
    public function checkAndEscalate(): void
    {
        try {
            $rules = EscalationRule::active()->ordered()->get();
            
            if ($rules->isEmpty()) {
                return;
            }

            // Get tickets that might need escalation
            // Only check open/assigned/in_progress/pending tickets
            $tickets = Ticket::whereIn('status', ['open', 'assigned', 'in_progress', 'pending'])
                ->get();

            $escalatedCount = 0;

            foreach ($tickets as $ticket) {
                foreach ($rules as $rule) {
                    if ($rule->matches($ticket)) {
                        $rule->execute($ticket);
                        $escalatedCount++;
                        
                        // Refresh ticket to get updated values
                        $ticket->refresh();
                        
                        Log::info("Ticket escalated", [
                            'ticket_id' => $ticket->id,
                            'ticket_number' => $ticket->ticket_number,
                            'rule_id' => $rule->id,
                            'rule_name' => $rule->name,
                        ]);

                        // Only apply one rule per ticket per run
                        break;
                    }
                }
            }

            Log::info("Escalation check completed", [
                'tickets_checked' => $tickets->count(),
                'tickets_escalated' => $escalatedCount,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to check escalations: {$e->getMessage()}", [
                'exception' => $e,
            ]);
        }
    }

    /**
     * Check and escalate a specific ticket
     */
    public function checkTicket(Ticket $ticket): void
    {
        $rules = EscalationRule::active()->ordered()->get();

        foreach ($rules as $rule) {
            if ($rule->matches($ticket)) {
                $rule->execute($ticket);
                $ticket->refresh();
                break; // Only apply one rule per check
            }
        }
    }
}

