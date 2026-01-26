<?php

namespace App\Http\Controllers;

use App\Services\PushNotificationService;
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
}
