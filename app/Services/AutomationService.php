<?php

namespace App\Services;

use App\Models\AutomationRule;
use App\Models\Ticket;
use Illuminate\Support\Facades\Log;

class AutomationService
{
    /**
     * Execute automation rules for a ticket
     */
    public function executeRules(Ticket $ticket, string $triggerEvent = 'ticket_created'): void
    {
        try {
            $rules = AutomationRule::active()
                ->forTrigger($triggerEvent)
                ->ordered()
                ->get();

            foreach ($rules as $rule) {
                if ($rule->matches($ticket)) {
                    $rule->execute($ticket);
                    
                    // Refresh ticket to get updated values
                    $ticket->refresh();
                    
                    Log::info("Automation rule executed", [
                        'rule_id' => $rule->id,
                        'rule_name' => $rule->name,
                        'ticket_id' => $ticket->id,
                        'trigger_event' => $triggerEvent,
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to execute automation rules: {$e->getMessage()}", [
                'ticket_id' => $ticket->id,
                'trigger_event' => $triggerEvent,
            ]);
        }
    }

    /**
     * Execute rules when ticket is created
     */
    public function onTicketCreated(Ticket $ticket): void
    {
        $this->executeRules($ticket, 'ticket_created');
    }

    /**
     * Execute rules when ticket is updated
     */
    public function onTicketUpdated(Ticket $ticket): void
    {
        $this->executeRules($ticket, 'ticket_updated');
    }

    /**
     * Execute rules when ticket status changes
     */
    public function onTicketStatusChanged(Ticket $ticket): void
    {
        $this->executeRules($ticket, 'ticket_status_changed');
    }
}

