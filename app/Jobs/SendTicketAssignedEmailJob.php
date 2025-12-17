<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendTicketAssignedEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Ticket $ticket,
        public User $user
    ) {
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

            Log::info('SendTicketAssignedEmailJob: Processing', [
                'ticket_id' => $this->ticket->id,
                'user_id' => $this->user->id,
                'user_email' => $this->user->email,
            ]);

            $result = $emailService->sendTicketAssigned($this->ticket, $this->user);

            if ($result) {
                Log::info('SendTicketAssignedEmailJob: Completed successfully', [
                    'ticket_id' => $this->ticket->id,
                    'user_id' => $this->user->id,
                    'user_email' => $this->user->email,
                ]);
            } else {
                Log::warning('SendTicketAssignedEmailJob: Failed to send email', [
                    'ticket_id' => $this->ticket->id,
                    'user_id' => $this->user->id,
                    'user_email' => $this->user->email,
                ]);
            }
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            $isRateLimitError = str_contains($errorMessage, 'Too many emails') || 
                               str_contains($errorMessage, 'rate limit') ||
                               str_contains($errorMessage, '550 5.7.0');

            if ($isRateLimitError) {
                Log::warning('SendTicketAssignedEmailJob: Rate limit detected, releasing job back to queue', [
                    'ticket_id' => $this->ticket->id,
                    'user_id' => $this->user->id,
                    'user_email' => $this->user->email,
                ]);
                
                // Release the job back to the queue with a delay
                $this->release(60); // Wait 60 seconds before retrying
                return;
            }

            Log::error('SendTicketAssignedEmailJob: Exception occurred', [
                'ticket_id' => $this->ticket->id,
                'user_id' => $this->user->id,
                'user_email' => $this->user->email,
                'error' => $errorMessage,
                'is_rate_limit' => $isRateLimitError,
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e; // Re-throw to mark job as failed
        }
    }
}
