<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private string $serverKey;

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key', '');
    }

    /**
     * Subscribe a user to push notifications
     */
    public function subscribe(int $userId, array $subscriptionData): bool
    {
        try {
            PushSubscription::updateOrCreate(
                [
                    'user_id' => $userId,
                    'endpoint' => $subscriptionData['endpoint'],
                ],
                [
                    'keys' => [
                        'p256dh' => $subscriptionData['keys']['p256dh'],
                        'auth' => $subscriptionData['keys']['auth'],
                    ],
                    'user_agent' => request()->userAgent(),
                ]
            );

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to subscribe to push notifications', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Unsubscribe a user from push notifications
     */
    public function unsubscribe(int $userId, string $endpoint): bool
    {
        try {
            PushSubscription::where('user_id', $userId)
                ->where('endpoint', $endpoint)
                ->delete();

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to unsubscribe from push notifications', [
                'user_id' => $userId,
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send push notification to user (placeholder implementation)
     * In a real implementation, you would integrate with FCM, Web Push API, etc.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            return true; // No subscriptions, consider success
        }

        // For now, just log the notification
        // In production, integrate with FCM, Web Push API, or similar service
        Log::info('Push notification would be sent', [
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'subscription_count' => $subscriptions->count(),
        ]);

        return true;
    }

    /**
     * Send push notification from a HelpDeskNotification
     */
    public function sendFromNotification(\App\Models\HelpDeskNotification $notification): bool
    {
        return $this->sendToUser(
            $notification->user_id,
            $notification->title,
            $notification->message,
            [
                'notification_id' => $notification->id,
                'type' => $notification->type,
                'ticket_id' => $notification->ticket_id,
            ]
        );
    }
}
