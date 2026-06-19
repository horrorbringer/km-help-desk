<?php

namespace App\Jobs;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Services\EmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendTicketEventEmailJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public array $backoff = [60, 180, 600];

    public int $uniqueFor = 300;

    public function __construct(
        public string $event,
        public int $ticketId,
        public int $actorId,
        public array $context,
        public string $occurrenceKey
    ) {}

    public function uniqueId(): string
    {
        return "ticket-email:{$this->event}:{$this->occurrenceKey}";
    }

    public function handle(EmailService $emailService): void
    {
        $ticket = Ticket::find($this->ticketId);
        $actor = User::find($this->actorId);

        if (! $ticket || ! $actor) {
            return;
        }

        match ($this->event) {
            'ticket_updated' => $emailService->sendTicketUpdated(
                $ticket,
                $actor,
                $this->context['changes'] ?? []
            ),
            'comment_added' => $this->sendCommentEmail($emailService, $ticket, $actor),
            'ticket_resolved' => $emailService->sendTicketResolved($ticket, $actor),
            'ticket_closed' => $emailService->sendTicketClosed($ticket, $actor),
            'approval_requested' => $emailService->sendApprovalRequested(
                $ticket,
                $actor,
                $this->context['approval_level']
            ),
            'approval_approved' => $emailService->sendApprovalApproved(
                $ticket,
                $actor,
                $this->context['approval_level'],
                $this->context['comments'] ?? null
            ),
            'approval_rejected' => $emailService->sendApprovalRejected(
                $ticket,
                $actor,
                $this->context['approval_level'],
                $this->context['comments'] ?? null
            ),
            default => null,
        };
    }

    protected function sendCommentEmail(
        EmailService $emailService,
        Ticket $ticket,
        User $actor
    ): void {
        $comment = TicketComment::find($this->context['comment_id'] ?? null);

        if ($comment) {
            $emailService->sendCommentAdded($ticket, $comment, $actor);
        }
    }
}
