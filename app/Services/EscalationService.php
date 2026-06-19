<?php

namespace App\Services;

use App\Models\EscalationRule;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;
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
                    if ($rule->matches($ticket) && $this->executeOnce($rule, $ticket)) {
                        $escalatedCount++;

                        // Refresh ticket to get updated values
                        $ticket->refresh();

                        Log::info('Ticket escalated', [
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

            Log::info('Escalation check completed', [
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
            if ($rule->matches($ticket) && $this->executeOnce($rule, $ticket)) {
                $ticket->refresh();
                break; // Only apply one rule per check
            }
        }
    }

    protected function executeOnce(EscalationRule $rule, Ticket $ticket): bool
    {
        $now = now();
        $occurrenceKey = $rule->occurrenceKey($ticket);
        $reserved = DB::table('escalation_executions')->insertOrIgnore([
            'escalation_rule_id' => $rule->id,
            'ticket_id' => $ticket->id,
            'occurrence_key' => $occurrenceKey,
            'executed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        if ($reserved === 0) {
            return false;
        }

        try {
            $rule->execute($ticket, [
                'occurrence_key' => $occurrenceKey,
            ]);

            return true;
        } catch (\Throwable $exception) {
            DB::table('escalation_executions')
                ->where('escalation_rule_id', $rule->id)
                ->where('ticket_id', $ticket->id)
                ->where('occurrence_key', $occurrenceKey)
                ->delete();

            throw $exception;
        }
    }
}
