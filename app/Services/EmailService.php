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

            Log::info("Email sent successfully", [
                'event_type' => $eventType,
                'recipient' => $recipient->email,
                'ticket_id' => $ticket?->id,
            ]);
            return true;
        } catch (\Exception $e) {
            Log::error("Failed to send email: {$e->getMessage()}", [
                'event_type' => $eventType,
                'recipient' => $recipient->email,
                'ticket_id' => $ticket?->id,
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);
            return false;
        }
    }

    /**
     * Send ticket created email
     */
    public function sendTicketCreated(Ticket $ticket): bool
    {
        if (!$ticket->requester) {
            Log::warning("Cannot send ticket created email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }

        Log::info("Sending ticket created email", [
            'event_type' => 'ticket_created',
            'ticket_id' => $ticket->id,
            'requester_email' => $ticket->requester->email,
        ]);

        $data = $this->getTicketData($ticket);
        $result = $this->sendTemplate('ticket_created', $ticket->requester, $data, $ticket);
        
        if ($result) {
            Log::info("Ticket created email sent successfully", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        } else {
            Log::warning("Failed to send ticket created email", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Send ticket assigned email
     */
    public function sendTicketAssigned(Ticket $ticket, ?User $assignedTo = null): bool
    {
        $user = $assignedTo ?? $ticket->assignedAgent;
        if (!$user) {
            Log::warning("Cannot send ticket assigned email: no assigned user", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }

        Log::info("Sending ticket assigned email", [
            'event_type' => 'ticket_assigned',
            'ticket_id' => $ticket->id,
            'assigned_user_email' => $user->email,
        ]);

        $data = $this->getTicketData($ticket);
        $result = $this->sendTemplate('ticket_assigned', $user, $data, $ticket);
        
        if ($result) {
            Log::info("Ticket assigned email sent successfully", [
                'ticket_id' => $ticket->id,
                'assigned_user_email' => $user->email,
            ]);
        } else {
            Log::warning("Failed to send ticket assigned email", [
                'ticket_id' => $ticket->id,
                'assigned_user_email' => $user->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Send ticket updated email
     */
    public function sendTicketUpdated(Ticket $ticket, User $updatedBy, array $changes = []): bool
    {
        $sent = false;
        
        Log::info("Sending ticket updated email", [
            'event_type' => 'ticket_updated',
            'ticket_id' => $ticket->id,
            'updated_by' => $updatedBy->id,
            'changes' => array_keys($changes),
        ]);

        $data = $this->getTicketData($ticket);
        $data['updated_by'] = $updatedBy->name;
        $data['changes'] = implode(', ', array_keys($changes));

        // Notify requester (always notify, even if they updated it themselves - they should know what changed)
        if ($ticket->requester) {
            Log::info("Sending ticket updated email to requester", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
                'updated_by_id' => $updatedBy->id,
                'requester_id' => $ticket->requester_id,
            ]);
            $result = $this->sendTemplate('ticket_updated', $ticket->requester, $data, $ticket);
            if ($result) {
                $sent = true;
                Log::info("Ticket updated email sent to requester", [
                    'ticket_id' => $ticket->id,
                    'requester_email' => $ticket->requester->email,
                ]);
            } else {
                Log::warning("Failed to send ticket updated email to requester", [
                    'ticket_id' => $ticket->id,
                    'requester_email' => $ticket->requester->email,
                ]);
            }
        } else {
            Log::warning("Cannot send ticket updated email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
        }

        // Notify assigned agent (always notify, even if they updated it themselves)
        if ($ticket->assignedAgent) {
            Log::info("Sending ticket updated email to assigned agent", [
                'ticket_id' => $ticket->id,
                'assigned_agent_email' => $ticket->assignedAgent->email,
                'updated_by_id' => $updatedBy->id,
                'assigned_agent_id' => $ticket->assigned_agent_id,
            ]);
            $result = $this->sendTemplate('ticket_updated', $ticket->assignedAgent, $data, $ticket);
            if ($result) {
                $sent = true;
                Log::info("Ticket updated email sent to assigned agent", [
                    'ticket_id' => $ticket->id,
                    'assigned_agent_email' => $ticket->assignedAgent->email,
                ]);
            } else {
                Log::warning("Failed to send ticket updated email to assigned agent", [
                    'ticket_id' => $ticket->id,
                    'assigned_agent_email' => $ticket->assignedAgent->email,
                ]);
            }
        } else {
            Log::info("No assigned agent to notify for ticket update", [
                'ticket_id' => $ticket->id,
            ]);
        }
        
        if (!$sent) {
            Log::warning("No ticket updated emails sent", [
                'ticket_id' => $ticket->id,
                'requester_id' => $ticket->requester_id,
                'assigned_agent_id' => $ticket->assigned_agent_id,
                'updated_by_id' => $updatedBy->id,
            ]);
        }
        
        return $sent;
    }

    /**
     * Send ticket resolved email
     */
    public function sendTicketResolved(Ticket $ticket, User $resolvedBy): bool
    {
        if (!$ticket->requester) {
            Log::warning("Cannot send ticket resolved email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }

        Log::info("Sending ticket resolved email", [
            'event_type' => 'ticket_resolved',
            'ticket_id' => $ticket->id,
            'requester_email' => $ticket->requester->email,
        ]);

        $data = $this->getTicketData($ticket);
        $data['resolved_by'] = $resolvedBy->name;
        $result = $this->sendTemplate('ticket_resolved', $ticket->requester, $data, $ticket);
        
        if ($result) {
            Log::info("Ticket resolved email sent successfully", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        } else {
            Log::warning("Failed to send ticket resolved email", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Send ticket closed email
     */
    public function sendTicketClosed(Ticket $ticket, User $closedBy): bool
    {
        if (!$ticket->requester) {
            Log::warning("Cannot send ticket closed email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }

        Log::info("Sending ticket closed email", [
            'event_type' => 'ticket_closed',
            'ticket_id' => $ticket->id,
            'requester_email' => $ticket->requester->email,
        ]);

        $data = $this->getTicketData($ticket);
        $data['closed_by'] = $closedBy->name;
        $result = $this->sendTemplate('ticket_closed', $ticket->requester, $data, $ticket);
        
        if ($result) {
            Log::info("Ticket closed email sent successfully", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        } else {
            Log::warning("Failed to send ticket closed email", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        }
        
        return $result;
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
    public function sendCommentAdded(Ticket $ticket, TicketComment $comment, User $commenter): bool
    {
        $sent = false;
        
        Log::info("Sending comment added email", [
            'event_type' => 'comment_added',
            'ticket_id' => $ticket->id,
            'comment_id' => $comment->id,
            'commenter_id' => $commenter->id,
            'is_internal' => $comment->is_internal,
        ]);

        $data = $this->getTicketData($ticket);
        $data['commenter'] = $commenter->name;
        $data['comment_body'] = $comment->body;
        $data['is_internal'] = $comment->is_internal;

        // Notify requester (only if not internal)
        if (!$comment->is_internal && $ticket->requester && $ticket->requester_id !== $commenter->id) {
            Log::info("Sending comment added email to requester", [
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
            $result = $this->sendTemplate('comment_added', $ticket->requester, $data, $ticket);
            if ($result) {
                $sent = true;
            }
        }

        // Notify assigned agent
        if ($ticket->assignedAgent && $ticket->assigned_agent_id !== $commenter->id) {
            Log::info("Sending comment added email to assigned agent", [
                'ticket_id' => $ticket->id,
                'assigned_agent_email' => $ticket->assignedAgent->email,
            ]);
            $result = $this->sendTemplate('comment_added', $ticket->assignedAgent, $data, $ticket);
            if ($result) {
                $sent = true;
            }
        }

        // Notify watchers (only if not internal)
        if (!$comment->is_internal && $ticket->watchers) {
            foreach ($ticket->watchers as $watcher) {
                if ($watcher->id !== $commenter->id && $watcher->id !== $ticket->requester_id) {
                    Log::info("Sending comment added email to watcher", [
                        'ticket_id' => $ticket->id,
                        'watcher_email' => $watcher->email,
                    ]);
                    $result = $this->sendTemplate('comment_added', $watcher, $data, $ticket);
                    if ($result) {
                        $sent = true;
                    }
                }
            }
        }
        
        if ($sent) {
            Log::info("Comment added emails sent successfully", [
                'ticket_id' => $ticket->id,
            ]);
        } else {
            Log::warning("No comment added emails sent", [
                'ticket_id' => $ticket->id,
                'is_internal' => $comment->is_internal,
            ]);
        }
        
        return $sent;
    }

    /**
     * Send approval requested email
     */
    public function sendApprovalRequested(Ticket $ticket, User $approver, string $approvalLevel): bool
    {
        if (!$approver) {
            Log::warning("Cannot send approval requested email: approver is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }

        $data = $this->getTicketData($ticket);
        $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        $data['approver_name'] = $approver->name;
        
        $eventType = $approvalLevel === 'lm' ? 'approval_lm_requested' : 'approval_hod_requested';
        
        Log::info("Sending approval requested email", [
            'event_type' => $eventType,
            'ticket_id' => $ticket->id,
            'approver_email' => $approver->email,
        ]);
        
        $result = $this->sendTemplate($eventType, $approver, $data, $ticket);
        
        if (!$result) {
            Log::error("Failed to send approval requested email", [
                'event_type' => $eventType,
                'ticket_id' => $ticket->id,
                'approver_email' => $approver->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Send approval approved email
     */
    public function sendApprovalApproved(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): bool
    {
        // Notify requester
        if (!$ticket->requester) {
            Log::warning("Cannot send approval approved email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }
        
        $data = $this->getTicketData($ticket);
        $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        $data['approver_name'] = $approver->name;
        $data['comments'] = $comments ?? '';
        
        $eventType = $approvalLevel === 'lm' ? 'approval_lm_approved' : 'approval_hod_approved';
        
        Log::info("Sending approval approved email", [
            'event_type' => $eventType,
            'ticket_id' => $ticket->id,
            'requester_email' => $ticket->requester->email,
        ]);
        
        $result = $this->sendTemplate($eventType, $ticket->requester, $data, $ticket);
        
        if (!$result) {
            Log::error("Failed to send approval approved email", [
                'event_type' => $eventType,
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Send approval rejected email
     */
    public function sendApprovalRejected(Ticket $ticket, User $approver, string $approvalLevel, ?string $comments = null): bool
    {
        // Notify requester
        if (!$ticket->requester) {
            Log::warning("Cannot send approval rejected email: requester is null", [
                'ticket_id' => $ticket->id,
            ]);
            return false;
        }
        
        $data = $this->getTicketData($ticket);
        $data['approval_level'] = $approvalLevel === 'lm' ? 'Line Manager' : 'Head of Department';
        $data['approver_name'] = $approver->name;
        $data['comments'] = $comments ?? '';
        $data['rejection_comments'] = $comments ?? '';
        
        $eventType = $approvalLevel === 'lm' ? 'approval_lm_rejected' : 'approval_hod_rejected';
        
        Log::info("Sending approval rejected email", [
            'event_type' => $eventType,
            'ticket_id' => $ticket->id,
            'requester_email' => $ticket->requester->email,
        ]);
        
        $result = $this->sendTemplate($eventType, $ticket->requester, $data, $ticket);
        
        if (!$result) {
            Log::error("Failed to send approval rejected email", [
                'event_type' => $eventType,
                'ticket_id' => $ticket->id,
                'requester_email' => $ticket->requester->email,
            ]);
        }
        
        return $result;
    }

    /**
     * Get ticket data for email templates
     */
    protected function getTicketData(Ticket $ticket): array
    {
        // Reload relationships to ensure we have fresh data
        $ticket->load(['assignedAgent', 'assignedTeam', 'requester', 'category', 'project']);
        
        return [
            'ticket_number' => $ticket->ticket_number,
            'subject' => $ticket->subject,
            'description' => $ticket->description,
            'status' => ucfirst($ticket->status ?? 'open'),
            'priority' => ucfirst($ticket->priority ?? 'medium'),
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

