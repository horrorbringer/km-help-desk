<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HelpDeskNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['type', 'is_read']);

        $notifications = HelpDeskNotification::query()
            ->where('user_id', Auth::id())
            ->with(['ticket:id,ticket_number,subject', 'relatedUser:id,name'])
            ->when(isset($filters['type']), function ($query) use ($filters) {
                $query->where('type', $filters['type']);
            })
            ->when(isset($filters['is_read']), function ($query) use ($filters) {
                $query->where('is_read', $filters['is_read'] === '1');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'ticket' => $notification->ticket ? [
                    'id' => $notification->ticket->id,
                    'ticket_number' => $notification->ticket->ticket_number,
                    'subject' => $notification->ticket->subject,
                ] : null,
                'related_user' => $notification->relatedUser ? [
                    'id' => $notification->relatedUser->id,
                    'name' => $notification->relatedUser->name,
                ] : null,
                'is_read' => $notification->is_read,
                'read_at' => $notification->read_at?->toDateTimeString(),
                'created_at' => $notification->created_at->toDateTimeString(),
            ]);

        $unreadCount = HelpDeskNotification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $notifications,
            'filters' => $filters,
            'unreadCount' => $unreadCount,
            'types' => HelpDeskNotification::TYPES,
        ]);
    }

    public function markAsRead(HelpDeskNotification $notification): JsonResponse
    {
        if ($notification->user_id !== Auth::id()) {
            return response()->json(['error' => 'You do not have permission to mark this notification as read. You can only manage your own notifications.'], 403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead(): JsonResponse
    {
        HelpDeskNotification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json(['success' => true]);
    }

    public function unreadCount(): JsonResponse
    {
        $count = HelpDeskNotification::where('user_id', Auth::id())
            ->where('is_read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    public function recent(): JsonResponse
    {
        $notifications = HelpDeskNotification::where('user_id', Auth::id())
            ->with(['ticket:id,ticket_number,subject'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn ($notification) => [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'ticket' => $notification->ticket ? [
                    'id' => $notification->ticket->id,
                    'ticket_number' => $notification->ticket->ticket_number,
                ] : null,
                'is_read' => $notification->is_read,
                'created_at' => $notification->created_at->toDateTimeString(),
            ]);

        return response()->json($notifications);
    }
}

