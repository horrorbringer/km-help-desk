<?php

namespace App\Services;

use App\Jobs\SendTelegramMessageJob;
use App\Models\Setting;

class TelegramNotificationService
{
    public function isConfigured(): bool
    {
        return filled(Setting::get(
            'telegram_bot_token',
            config('services.telegram-bot-api.token')
        ));
    }

    public function queue(
        string $chatId,
        string $text,
        ?array $replyMarkup = null,
        ?string $chatOwnerType = null,
        ?int $chatOwnerId = null
    ): void {
        if (! $this->isConfigured()) {
            return;
        }

        SendTelegramMessageJob::dispatch(
            $chatId,
            $text,
            $replyMarkup,
            $chatOwnerType,
            $chatOwnerId
        );
    }
}
