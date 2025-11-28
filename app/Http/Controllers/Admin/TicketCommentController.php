<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use App\Services\NotificationService;
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
        // Check if user has permission to view tickets (minimum requirement)
        abort_unless(Auth::user()->can('tickets.view'), 403);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        // Only agents can create internal comments
        $isInternal = $validated['is_internal'] ?? false;
        if ($isInternal && !Auth::user()->can('tickets.edit')) {
            $isInternal = false;
        }

        // If replying to a comment, inherit internal status from parent
        $parentComment = null;
        if (!empty($validated['parent_id'])) {
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

        // Send notifications for new comment
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->notifyCommentAdded($ticket, $comment, Auth::user());
        } catch (\Exception $e) {
            Log::warning('Notification service failed on comment creation', [
                'comment_id' => $comment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return redirect()
            ->back()
            ->with('success', 'Comment added successfully.');
    }

    /**
     * Update an existing comment
     */
    public function update(Request $request, Ticket $ticket, TicketComment $comment): RedirectResponse
    {
        // Check if user has permission to view tickets
        abort_unless(Auth::user()->can('tickets.view'), 403);

        // Only the comment author or users with edit permission can update
        if ($comment->user_id !== Auth::id() && !Auth::user()->can('tickets.edit')) {
            abort(403, 'You can only edit your own comments.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
            'is_internal' => ['sometimes', 'boolean'],
        ]);

        // Only agents can make comments internal
        $isInternal = $validated['is_internal'] ?? $comment->is_internal;
        if ($isInternal && !Auth::user()->can('tickets.edit')) {
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
        // Check if user has permission to view tickets
        abort_unless(Auth::user()->can('tickets.view'), 403);

        // Only the comment author or users with edit permission can delete
        if ($comment->user_id !== Auth::id() && !Auth::user()->can('tickets.edit')) {
            abort(403, 'You can only delete your own comments.');
        }

        $comment->delete();

        return redirect()
            ->back()
            ->with('success', 'Comment deleted successfully.');
    }
}

