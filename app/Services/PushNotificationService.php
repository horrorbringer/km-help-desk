<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    public function isConfigured(): bool
    {
        return filled(config('webpush.vapid.subject'))
            && filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'));
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

    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        if (! $this->isConfigured()) {
            Log::warning('Push notification skipped because VAPID is not configured');

            return false;
        }

        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        if ($subscriptions->isEmpty()) {
            return true; // No subscriptions, consider success
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('webpush.vapid.subject'),
                'publicKey' => config('webpush.vapid.public_key'),
                'privateKey' => config('webpush.vapid.private_key'),
            ],
        ]);
        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ], JSON_THROW_ON_ERROR);

        foreach ($subscriptions as $storedSubscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $storedSubscription->endpoint,
                    'publicKey' => $storedSubscription->keys['p256dh'],
                    'authToken' => $storedSubscription->keys['auth'],
                    'contentEncoding' => 'aes128gcm',
                ]),
                $payload
            );
        }

        $failed = [];
        $successful = 0;
        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                $successful++;

                continue;
            }

            $endpoint = (string) $report->getRequest()->getUri();
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $endpoint)->delete();

                continue;
            }

            $failed[] = $report->getReason();
        }

        if ($failed !== []) {
            Log::warning('Push delivery failed for one or more subscriptions', [
                'user_id' => $userId,
                'successful_count' => $successful,
                'failed_reasons' => array_values(array_unique($failed)),
            ]);

            if ($successful === 0) {
                throw new \RuntimeException(
                    'Push delivery failed: '.implode('; ', array_unique($failed))
                );
            }
        }

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
