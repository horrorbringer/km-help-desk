<?php

namespace App\Jobs;

use App\Models\HelpDeskNotification;
use App\Services\PushNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 120, 300];

    public function __construct(public int $notificationId) {}

    public function handle(PushNotificationService $pushService): void
    {
        $notification = HelpDeskNotification::find($this->notificationId);

        if (! $notification) {
            return;
        }

        $pushService->sendFromNotification($notification);
    }
}
