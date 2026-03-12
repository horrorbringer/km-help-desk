<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\User;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Services\ApprovalWorkflowService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;

class TelegramWebhookController extends Controller
{
    /**
     * Handle incoming webhooks from Telegram
     */
    public function handle(Request $request)
    {
        // 1. Verify Secret Token (Ensures request is actually from Telegram)
        $secret = $request->header('X-Telegram-Bot-Api-Secret-Token');
        $dbSecret = Setting::get('telegram_secret_token', config('services.telegram-bot-api.secret_token'));

        if ($secret !== $dbSecret) {
            Log::warning('Unauthorized Telegram Webhook attempt', ['ip' => $request->ip()]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();

        // 2. Handle standard text messages (like /start)
        if (isset($payload['message']['text'])) {
            $text = $payload['message']['text'];
            $chatId = $payload['message']['chat']['id'];
            $username = $payload['message']['from']['username'] ?? null;

            // Handle Account Linking
            if (str_starts_with($text, '/start link-')) {
                $token = str_replace('/start ', '', $text);

                $userId = Cache::get('telegram_token_' . $token);

                if ($userId) {
                    $user = User::find($userId);
                    if ($user) {
                        $user->update([
                            'telegram_chat_id' => $chatId,
                            'telegram_username' => $username,
                        ]);
                        Cache::forget('telegram_token_' . $token);
                        $this->sendMessage($chatId, "✅ Your Telegram account has been successfully linked to Kimmix Help Desk, {$user->name}!");
                    }
                    else {
                        $this->sendMessage($chatId, "❌ User not found.");
                    }
                }
                else {
                    $this->sendMessage($chatId, "❌ Invalid or expired token. Please generate a new connection link from your profile settings.");
                }
            }
            else if ($text === '/start') {
                $this->sendMessage($chatId, "Welcome to the Help Desk Bot! Please link your account from your web portal settings.");
            }
            else if (str_starts_with($text, '/id')) {
                $this->sendMessage($chatId, "🆔 This Chat ID is: `{$chatId}`");
            }
        }

        // 3. Handle Callback Queries (Button Clicks - implemented later)
        if (isset($payload['callback_query'])) {
            $this->handleCallbackQuery($payload['callback_query']);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Helper to send plain text message back to Telegram
     */
    private function sendMessage($chatId, $text)
    {
        $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));
        if (!$token) {
            Log::error('Cannot send Telegram message: Bot token missing.');
            return;
        }

        Http::timeout(15)->post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
        ]);
    }

    private function handleCallbackQuery($query)
    {
        $callbackId = $query['id'];
        $chatId = $query['message']['chat']['id'] ?? null;
        $messageId = $query['message']['message_id'] ?? null;
        $data = $query['data'] ?? '';
        $fromId = $query['from']['id'] ?? null;
        $username = $query['from']['username'] ?? null;
        $token = Setting::get('telegram_bot_token', config('services.telegram-bot-api.token'));

        if (!$token || !$chatId || !$fromId)
            return;

        // Try to find the user by their Telegram ID
        // Note: In Telegram, a user's private chat ID is the same as their User ID.
        $user = User::where('telegram_chat_id', $fromId)
            ->where('is_active', true)
            ->first();

        if (!$user) {
            Log::warning('Telegram Callback: Unrecognized user', [
                'telegram_id' => $fromId,
                'username' => $username,
                'chat_id' => $chatId
            ]);
            $this->answerCallbackQuery($token, $callbackId, 'Unrecognized account. Please link your Telegram in your profile settings.', true);
            return;
        }

        // Example data: "pick_ticket:11"
        if (str_starts_with($data, 'pick_ticket:')) {
            $ticketId = explode(':', $data)[1] ?? null;
            $ticket = Ticket::find($ticketId);

            if (!$ticket) {
                $this->answerCallbackQuery($token, $callbackId, 'Ticket not found.', true);
                return;
            }

            if ($ticket->assigned_agent_id) {
                $this->answerCallbackQuery($token, $callbackId, 'Ticket is already assigned.', true);

                // Still update the message to remove the button since it's taken
                $this->editMessageToAssigned($token, $chatId, $messageId, $ticket);
                return;
            }

            // Perform Action
            Auth::login($user); // Login for history/automation tracking

            // Assign the ticket to the user
            $ticket->assigned_agent_id = $user->id;

            // If it's open, change it to assigned
            if ($ticket->status === 'open') {
                $ticket->status = 'assigned';
            }
            $ticket->save();

            Log::info('Ticket claimed via Telegram', [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'chat_id' => $chatId
            ]);

            // Record in database history
            if (class_exists('App\Models\TicketHistory')) {
                \App\Models\TicketHistory::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'action' => 'assigned',
                    'field_name' => 'assigned_agent_id',
                    'new_value' => $user->name,
                    'description' => "Picked up via Telegram by {$user->name}",
                    'created_at' => now(),
                ]);
            }

            $this->answerCallbackQuery($token, $callbackId, "Success! You picked up Ticket #{$ticket->ticket_number}");

            // Refresh to get relations for the edit message
            $ticket->load('assignedAgent');
            $this->editMessageToAssigned($token, $chatId, $messageId, $ticket, $user);
            return;
        }

        // --- NEW: Approve/Reject Ticket Approval ---
        if (str_starts_with($data, 'approve_ticket:') || str_starts_with($data, 'reject_ticket:')) {
            $isApprove = str_starts_with($data, 'approve_ticket:');
            $approvalId = explode(':', $data)[1] ?? null;
            $approval = TicketApproval::with('ticket')->find($approvalId);

            if (!$approval || !$approval->ticket) {
                $this->answerCallbackQuery($token, $callbackId, 'Approval record not found.', true);
                return;
            }

            if ($approval->status !== 'pending') {
                $this->answerCallbackQuery($token, $callbackId, "This ticket has already been {$approval->status}.", true);
                $this->editMessageAfterApproval($token, $chatId, $messageId, $approval);
                return;
            }

            // Authorization Check
            if (!$this->canUserApprove($user, $approval)) {
                $this->answerCallbackQuery($token, $callbackId, 'Unauthorized: You are not the assigned approver for this level.', true);
                return;
            }

            // Perform Action
            Auth::login($user); // Temporary login so history/notifications use this user
            $workflowService = app(ApprovalWorkflowService::class);

            if ($isApprove) {
                $workflowService->approve($approval, "Approved via Telegram");
                $this->answerCallbackQuery($token, $callbackId, "✅ Ticket #{$approval->ticket->ticket_number} approved!");
            }
            else {
                $workflowService->reject($approval, "Rejected via Telegram");
                $this->answerCallbackQuery($token, $callbackId, "❌ Ticket #{$approval->ticket->ticket_number} rejected.");
            }

            $this->editMessageAfterApproval($token, $chatId, $messageId, $approval->fresh(), $user);
            return;
        }

        // --- NEW: Resolve Ticket ---
        if (str_starts_with($data, 'resolve_ticket:')) {
            $ticketId = explode(':', $data)[1] ?? null;
            $ticket = Ticket::find($ticketId);

            if (!$ticket) {
                $this->answerCallbackQuery($token, $callbackId, 'Ticket not found.', true);
                return;
            }

            if ($ticket->status === 'resolved' || $ticket->status === 'closed') {
                $this->answerCallbackQuery($token, $callbackId, "Ticket is already {$ticket->status}.", true);
                return;
            }

            // Authorization
            if ($ticket->assigned_agent_id !== $user->id && !$user->hasRole(\App\Constants\RoleConstants::SUPER_ADMIN)) {
                $this->answerCallbackQuery($token, $callbackId, 'Unauthorized: You are not assigned to this ticket.', true);
                return;
            }

            // Perform Action
            Auth::login($user);

            // Update status
            $ticket->status = 'resolved';
            $ticket->resolved_at = now();
            $ticket->save();

            Log::info('Ticket resolved via Telegram', [
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
            ]);

            // Log history
            if (class_exists('App\Models\TicketHistory')) {
                \App\Models\TicketHistory::create([
                    'ticket_id' => $ticket->id,
                    'user_id' => $user->id,
                    'action' => 'status_changed',
                    'field_name' => 'status',
                    'old_value' => 'assigned',
                    'new_value' => 'resolved',
                    'description' => "Resolved via Telegram by {$user->name}",
                    'created_at' => now(),
                ]);
            }

            $this->answerCallbackQuery($token, $callbackId, "✅ Ticket #{$ticket->ticket_number} resolved!");
            $this->editMessageToResolved($token, $chatId, $messageId, $ticket, $user);
            return;
        }

        // Default ACK
        $this->answerCallbackQuery($token, $callbackId);
    }

    /**
     * Reusable authorization check similar to TicketApprovalController
     */
    private function canUserApprove($user, $approval)
    {
        if ($user->hasRole(\App\Constants\RoleConstants::SUPER_ADMIN))
            return true;
        if ($approval->approver_id === $user->id)
            return true;
        if ($user->can('tickets.assign'))
            return true;

        // Fallback to role-based check for the level
        $requiredRoles = \App\Constants\ApprovalLevelConstants::getRolesForLevel($approval->approval_level);
        return $user->hasAnyRole($requiredRoles);
    }

    private function editMessageAfterApproval($token, $chatId, $messageId, $approval, $user = null)
    {
        $ticket = $approval->ticket;
        $url = rtrim(config('app.url'), '/') . "/admin/tickets/{$ticket->id}";
        $statusEmoji = $approval->status === 'approved' ? '✅' : '❌';
        $statusLabel = ucfirst($approval->status);
        $approverName = $approval->approver ? $approval->approver->name : 'System';

        $message = "🚨 *Approval Decision*\n\n";
        $message .= "Ticket: [#{$ticket->ticket_number}]({$url})\n";
        $message .= "Subject: {$ticket->subject}\n";
        $message .= "Level: *" . \App\Constants\ApprovalLevelConstants::getLabel($approval->approval_level) . "*\n\n";
        $message .= "{$statusEmoji} *{$statusLabel}* by {$approverName}";

        $loginUrl = $user ? \App\Http\Controllers\Api\TelegramLoginController::generateLoginUrl($user, "/admin/tickets/{$ticket->id}") : $url;

        $response = Http::timeout(15)->post("https://api.telegram.org/bot{$token}/editMessageText", [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode([
                'inline_keyboard' => [
                    [
                        ['text' => '🎫 View Ticket', 'url' => $loginUrl]
                    ]
                ]
            ])
        ]);

        if (!$response->successful()) {
            Log::error('Telegram: Failed to edit message after approval', [
                'status' => $response->status(),
                'body' => $response->body(),
                'chat_id' => $chatId,
                'message_id' => $messageId
            ]);
        }
    }

    private function answerCallbackQuery($token, $callbackId, $text = null, $showAlert = false)
    {
        $payload = ['callback_query_id' => $callbackId];
        if ($text) {
            $payload['text'] = $text;
            $payload['show_alert'] = $showAlert;
        }
        Http::timeout(15)->post("https://api.telegram.org/bot{$token}/answerCallbackQuery", $payload);
    }

    private function editMessageToAssigned($token, $chatId, $messageId, $ticket, $user = null)
    {
        $url = rtrim(config('app.url'), '/') . "/admin/tickets/{$ticket->id}";
        $agentName = $ticket->assignedAgent ? $ticket->assignedAgent->name : 'Someone else';

        $message = "🔔 *Help Desk Alert*\n\n";
        $message .= "Ticket: [#{$ticket->ticket_number}]({$url})\n";
        $message .= "Subject: {$ticket->subject}\n";
        $message .= "Status: *" . ucfirst($ticket->status) . "*\n";
        $message .= "Priority: *" . ucfirst($ticket->priority) . "*\n\n";
        $message .= "✅ _Picked up by {$agentName}_";

        $loginUrl = \App\Http\Controllers\Api\TelegramLoginController::generateLoginUrl($ticket->assignedAgent ?: $user, "/admin/tickets/{$ticket->id}");

        $response = Http::timeout(15)->post("https://api.telegram.org/bot{$token}/editMessageText", [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode([
                'inline_keyboard' => [
                    [
                        ['text' => '✅ Resolve', 'callback_data' => "resolve_ticket:{$ticket->id}"],
                        ['text' => '🎫 View Ticket', 'url' => $loginUrl]
                    ]
                ]
            ])
        ]);

        if (!$response->successful()) {
            Log::error('Telegram: Failed to edit message to assigned', [
                'status' => $response->status(),
                'body' => $response->body(),
                'chat_id' => $chatId,
                'message_id' => $messageId
            ]);
        }
    }

    private function editMessageToResolved($token, $chatId, $messageId, $ticket, $user = null)
    {
        $url = rtrim(config('app.url'), '/') . "/admin/tickets/{$ticket->id}";

        $message = "✅ *Ticket Resolved*\n\n";
        $message .= "Ticket: [#{$ticket->ticket_number}]({$url})\n";
        $message .= "Subject: {$ticket->subject}\n";
        $message .= "Status: *Resolved*\n\n";
        $message .= "_This ticket has been marked as resolved._";

        $loginUrl = $user ? \App\Http\Controllers\Api\TelegramLoginController::generateLoginUrl($user, "/admin/tickets/{$ticket->id}") : $url;

        $response = Http::timeout(15)->post("https://api.telegram.org/bot{$token}/editMessageText", [
            'chat_id' => $chatId,
            'message_id' => $messageId,
            'text' => $message,
            'parse_mode' => 'Markdown',
            'reply_markup' => json_encode([
                'inline_keyboard' => [
                    [
                        ['text' => '🎫 View Ticket', 'url' => $loginUrl]
                    ]
                ]
            ])
        ]);

        if (!$response->successful()) {
            Log::error('Telegram: Failed to edit message to resolved', [
                'status' => $response->status(),
                'body' => $response->body(),
                'chat_id' => $chatId,
                'message_id' => $messageId
            ]);
        }
    }
}