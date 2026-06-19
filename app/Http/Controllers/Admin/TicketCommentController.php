<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TicketCommentController extends Controller
{
    /**
     * Store a new comment for a ticket
     */
    public function store(Request $request, Ticket $ticket): RedirectResponse
    {
        $this->authorize('view', $ticket);
        abort_unless(Auth::user()->can('tickets.comment'), 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['sometimes', 'boolean'],
            'parent_id' => ['nullable', 'integer', 'exists:ticket_comments,id'],
        ]);

        // Only agents can create internal comments
        $isInternal = $validated['is_internal'] ?? false;
        if ($isInternal && ! $this->canUseInternalComments()) {
            $isInternal = false;
        }

        // If replying to a comment, inherit internal status from parent
        $parentComment = null;
        if (! empty($validated['parent_id'])) {
            $parentComment = TicketComment::find($validated['parent_id']);
            if ($parentComment && $parentComment->ticket_id !== $ticket->id) {
                abort(400, 'Parent comment does not belong to this ticket.');
            }
            // Replies inherit internal status from parent
            if ($parentComment) {
                $isInternal = $parentComment->is_internal;
            }
        }

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'user_id' => Auth::id(),
            'body' => $validated['body'],
            'is_internal' => $isInternal,
            'type' => 'comment',
        ]);

        // Trigger automation rules for comment event in background
        dispatch(function () use ($ticket, $comment) {
            try {
                $notificationService = app(\App\Services\NotificationService::class);
                $commenter = $comment->user;

                if ($commenter) {
                    $notificationService->notifyCommentAdded($ticket, $comment, $commenter);
                }

                $automationService = app(\App\Services\AutomationService::class);
                $automationService->onCommentAdded($ticket, $comment);
            } catch (\Exception $e) {
                Log::error('Background comment automation failed', [
                    'ticket_id' => $ticket->id,
                    'comment_id' => $comment->id,
                    'error' => $e->getMessage(),
                ]);
            }
        })->afterResponse();

        return redirect()
            ->back()
            ->with('success', 'Comment added successfully.');
    }

    /**
     * Update an existing comment
     */
    public function update(Request $request, Ticket $ticket, TicketComment $comment): RedirectResponse
    {
        $this->authorize('view', $ticket);
        abort_unless($comment->ticket_id === $ticket->id, 404);
        abort_unless(
            Auth::user()->can('tickets.comment') || Auth::user()->can('tickets.manage-comments'),
            403
        );

        // Only the comment author or users with edit permission can update
        if ($comment->user_id !== Auth::id() && ! Auth::user()->can('tickets.manage-comments')) {
            abort(403, 'You can only edit your own comments.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        // Only agents can make comments internal
        $isInternal = $validated['is_internal'] ?? $comment->is_internal;
        if ($isInternal && ! $this->canUseInternalComments()) {
            $isInternal = false;
        }

        $comment->update([
            'body' => $validated['body'],
            'is_internal' => $isInternal,
        ]);

        return redirect()
            ->back()
            ->with('success', 'Comment updated successfully.');
    }

    /**
     * Delete a comment
     */
    public function destroy(Ticket $ticket, TicketComment $comment): RedirectResponse
    {
        $this->authorize('view', $ticket);
        abort_unless($comment->ticket_id === $ticket->id, 404);
        abort_unless(
            Auth::user()->can('tickets.comment') || Auth::user()->can('tickets.manage-comments'),
            403
        );

        // Only the comment author or users with edit permission can delete
        if ($comment->user_id !== Auth::id() && ! Auth::user()->can('tickets.manage-comments')) {
            abort(403, 'You can only delete your own comments.');
        }

        $comment->delete();

        return redirect()
            ->back()
            ->with('success', 'Comment deleted successfully.');
    }

    private function canUseInternalComments(): bool
    {
        return Auth::user()->can('tickets.manage-comments');
    }
}
