<?php

namespace App\Services;

use App\Models\EmailTemplate;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Send email using a template
     */
    public function sendTemplate(
        string $eventType,
        User $recipient,
        array $data,
        ?Ticket $ticket = null
    ): bool {
        try {
            $template = EmailTemplate::active()
                ->forEvent($eventType)
                ->first();

            if (!$template) {
                Log::warning("No active email template found for event: {$eventType}");
                return false;
            }

            $rendered = $template->render($data);

            // Check if email notifications are enabled
            $mailEnabled = \App\Models\Setting::get('mail_enabled', true);
            if (!$mailEnabled) {
                return false;
            }

            Mail::send([], [], function ($message) use ($recipient, $rendered, $template) {
                $fromAddress = \App\Models\Setting::get('mail_from_address', config('mail.from.address'));
                $fromName = \App\Models\Setting::get('mail_from_name', config('mail.from.name'));

                $message->to($recipient->email, $recipient->name)
                    ->from($fromAddress, $fromName)
                    ->subject($rendered['subject']);

                if (!empty($rendered['body_html'])) {
                    $message->html($rendered['body_html']);
                }

                if (!empty($rendered['body_text'])) {
                    $message->text($rendered['body_text']);
                }
            });

            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send email: {$e->getMessage()}", [
                'event_type' => $eventType,
                'recipient' => $recipient->email,
                'ticket_id' => $ticket?->id,
            ]);
            return false;
        }
    }

    /**
     * Send ticket created email
     */
    public function sendTicketCreated(Ticket $ticket): void
    {
        if (!$ticket->requester) {
            return;
        }

        $data = $this->getTicketData($ticket);
        $this->sendTemplate('ticket_created', $ticket->requester, $data, $ticket);
    }

    /**
     * Send ticket assigned email
     */
    public function sendTicketAssigned(Ticket $ticket, ?User $assignedTo = null): void
    {
        $user = $assignedTo ?? $ticket->assignedAgent;
        if (!$user) {
            return;
        }

        $data = $this->getTicketData($ticket);
        $this->sendTemplate('ticket_assigned', $user, $data, $ticket);
    }

    /**
     * Send ticket updated email
     */
    public function sendTicketUpdated(Ticket $ticket, User $updatedBy, array $changes = []): void
    {
        $data = $this->getTicketData($ticket);
        $data['updated_by'] = $updatedBy->name;
        $data['changes'] = implode(', ', array_keys($changes));

        // Notify requester
        if ($ticket->requester && $ticket->requester_id !== $updatedBy->id) {
            $this->sendTemplate('ticket_updated', $ticket->requester, $data, $ticket);
        }

        // Notify assigned agent
        if ($ticket->assignedAgent && $ticket->assigned_agent_id !== $updatedBy->id) {
            $this->sendTemplate('ticket_updated', $ticket->assignedAgent, $data, $ticket);
        }
    }

    /**
     * Send ticket resolved email
     */
    public function sendTicketResolved(Ticket $ticket, User $resolvedBy): void
    {
        if (!$ticket->requester) {
            return;
        }

        $data = $this->getTicketData($ticket);
        $data['resolved_by'] = $resolvedBy->name;
        $this->sendTemplate('ticket_resolved', $ticket->requester, $data, $ticket);
    }

    /**
     * Send ticket commented email
     */
    public function sendTicketCommented(Ticket $ticket, User $commenter, bool $isInternal = false): void
    {
        if ($isInternal) {
            return; // Don't send emails for internal comments
        }

        $data = $this->getTicketData($ticket);
        $data['commenter'] = $commenter->name;

        // Notify requester
        if ($ticket->requester && $ticket->requester_id !== $commenter->id) {
            $this->sendTemplate('ticket_commented', $ticket->requester, $data, $ticket);
        }

        // Notify assigned agent
        if ($ticket->assignedAgent && $ticket->assigned_agent_id !== $commenter->id) {
            $this->sendTemplate('ticket_commented', $ticket->assignedAgent, $data, $ticket);
        }
    }

    /**
     * Send comment added email
     */
    public function sendCommentAdded(Ticket $ticket, TicketComment $comment, User $commenter): void
    {
        $data = $this->getTicketData($ticket);
        $data['commenter'] = $commenter->name;
        $data['comment_body'] = $comment->body;
        $data['is_internal'] = $comment->is_internal;

        // Notify requester (only if not internal)
        if (!$comment->is_internal && $ticket->requester && $ticket->requester_id !== $commenter->id) {
            $this->sendTemplate('comment_added', $ticket->requester, $data, $ticket);
        }

        // Notify assigned agent
        if ($ticket->assignedAgent && $ticket->assigned_agent_id !== $commenter->id) {
            $this->sendTemplate('comment_added', $ticket->assignedAgent, $data, $ticket);
        }

        // Notify watchers (only if not internal)
        if (!$comment->is_internal && $ticket->watchers) {
            foreach ($ticket->watchers as $watcher) {
                if ($watcher->id !== $commenter->id && $watcher->id !== $ticket->requester_id) {
                    $this->sendTemplate('comment_added', $watcher, $data, $ticket);
                }
            }
        }
    }

    /**
     * Send approval requested email
     */
    public function sendApprovalRequested(Ticket $ticket, User $approver, string $approvalLevel): void
    {
        if (!$approver) {
            return;
        }

        $data = $this->getTicketData($ticket);
        $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        $data['approver_name'] = $approver->name;
        
        $eventType = $approvalLevel === 'lm' ? 'approval_lm_requested' : 'approval_hod_requested';
        $this->sendTemplate($eventType, $approver, $data, $ticket);
    }

    /**
     * Send approval approved email
     */
    public function sendApprovalApproved(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        // Notify requester
        if ($ticket->requester) {
            $data = $this->getTicketData($ticket);
            $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
            $data['approver_name'] = $approver->name;
            $data['comments'] = $comments ?? '';
            
            $eventType = $approvalLevel === 'lm' ? 'approval_lm_approved' : 'approval_hod_approved';
            $this->sendTemplate($eventType, $ticket->requester, $data, $ticket);
        }
    }

    /**
     * Send approval rejected email
     */
    public function sendApprovalRejected(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): void
    {
        // Notify requester
        if ($ticket->requester) {
            $data = $this->getTicketData($ticket);
            $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
            $data['approver_name'] = $approver->name;
            $data['comments'] = $comments ?? '';
            
            $eventType = $approvalLevel === 'lm' ? 'approval_lm_rejected' : 'approval_hod_rejected';
            $this->sendTemplate($eventType, $ticket->requester, $data, $ticket);
        }
    }

    /**
     * Get ticket data for email templates
     */
    protected function getTicketData(Ticket $ticket): array
    {
        return [
            'ticket_number' => $ticket->ticket_number,
            'subject' => $ticket->subject,
            'description' => $ticket->description,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'requester_name' => $ticket->requester?->name ?? 'Unknown',
            'assigned_agent' => $ticket->assignedAgent?->name ?? 'Unassigned',
            'assigned_team' => $ticket->assignedTeam?->name ?? 'Unassigned',
            'category' => $ticket->category?->name ?? 'No category',
            'project' => $ticket->project?->name ?? 'No project',
            'ticket_url' => route('admin.tickets.show', $ticket->id),
            'app_name' => \App\Models\Setting::get('app_name', 'Help Desk System'),
        ];
    }
}

