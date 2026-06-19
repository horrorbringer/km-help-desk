<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketCreatedEmailJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 5;

    public $backoff = 60;

    public $uniqueFor = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Ticket $ticket
    ) {}

    public function uniqueId(): string
    {
        return "ticket-created:{$this->ticket->id}:{$this->ticket->requester_id}";
    }

    /**
     * Execute the job.
     */
    public function handle(EmailService $emailService): void
    {
        try {
            // Refresh ticket to ensure relationships are loaded
            $this->ticket->refresh();
            $this->ticket->load(['requester', 'assignedAgent', 'assignedTeam']);

            Log::info('SendTicketCreatedEmailJob: Processing', [
                'ticket_id' => $this->ticket->id,
                'requester_email' => $this->ticket->requester?->email,
            ]);

            $result = $emailService->sendTicketCreated($this->ticket);

            if ($result) {
                Log::info('SendTicketCreatedEmailJob: Completed successfully', [
                    'ticket_id' => $this->ticket->id,
                ]);
            } else {
                Log::warning('SendTicketCreatedEmailJob: Failed to send email', [
                    'ticket_id' => $this->ticket->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('SendTicketCreatedEmailJob: Exception occurred', [
                'ticket_id' => $this->ticket->id,
                'error_class' => get_class($e),
                'error_message' => $e->getMessage(),
                'attempts' => $this->attempts(),
            ]);

            throw $e; // Re-throw to mark job as failed
        }
    }
}
