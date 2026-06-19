<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use App\Services\PushNotificationService;
use App\Support\NotificationType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    public function __construct(
        private PushNotificationService $pushService
    ) {}

    /**
     * Subscribe to push notifications
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $success = $this->pushService->subscribe(
            Auth::id(),
            $request->all()
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Subscribed to push notifications' : 'Failed to subscribe',
        ]);
    }

    /**
     * Unsubscribe from push notifications
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|url',
        ]);

        $success = $this->pushService->unsubscribe(
            Auth::id(),
            $request->endpoint
        );

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Unsubscribed from push notifications' : 'Failed to unsubscribe',
        ]);
    }

    /**
     * Get VAPID public key for push notifications
     */
    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('webpush.vapid.public_key', ''),
        ]);
    }

    /**
     * Create a test notification for the current user.
     */
    public function test(NotificationService $notificationService): JsonResponse
    {
        $notification = $notificationService->create(
            Auth::id(),
            NotificationType::TICKET_UPDATED,
            'Test Notification',
            'Your notification settings are working.',
            data: ['source' => 'settings_test']
        );

        return response()->json([
            'success' => true,
            'notification_id' => $notification->id,
            'push_configured' => $this->pushService->isConfigured(),
            'message' => $this->pushService->isConfigured()
                ? 'Test notification sent. If push is enabled, it should appear shortly.'
                : 'Test in-app notification created. Browser push is not configured on the server.',
        ]);
    }
}
