<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'body' => $validated['body'],
            'is_internal' => $isInternal,
            'type' => 'comment',
        ]);

        return redirect()
            ->back()
            ->with('success', 'Comment added successfully.');
    }
}

