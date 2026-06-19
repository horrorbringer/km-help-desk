<?php

namespace App\Jobs;

use App\Models\Department;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class SendTelegramMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 4;

    public array $backoff = [30, 120, 300];

    public function __construct(
        public string $chatId,
        public string $text,
        public ?array $replyMarkup = null,
        public ?string $chatOwnerType = null,
        public ?int $chatOwnerId = null
    ) {}

    public function handle(): void
    {
        $token = Setting::get(
            'telegram_bot_token',
            config('services.telegram-bot-api.token')
        );

        if (! $token) {
            return;
        }

        $response = $this->send($token, $this->chatId);
        if ($response->successful()) {
            return;
        }

        $migratedChatId = $response->json('parameters.migrate_to_chat_id');
        if ($migratedChatId) {
            $this->updateChatOwner((string) $migratedChatId);
            $retryResponse = $this->send($token, (string) $migratedChatId);

            if ($retryResponse->successful()) {
                return;
            }

            $response = $retryResponse;
        }

        throw new \RuntimeException(
            'Telegram delivery failed: '.$response->body()
        );
    }

    protected function send(string $token, string $chatId): \Illuminate\Http\Client\Response
    {
        $payload = [
            'chat_id' => $chatId,
            'text' => $this->text,
            'parse_mode' => 'Markdown',
        ];

        if ($this->replyMarkup) {
            $payload['reply_markup'] = json_encode(
                $this->replyMarkup,
                JSON_THROW_ON_ERROR
            );
        }

        return Http::timeout(15)
            ->post("https://api.telegram.org/bot{$token}/sendMessage", $payload);
    }

    protected function updateChatOwner(string $chatId): void
    {
        if (! $this->chatOwnerId) {
            return;
        }

        $model = match ($this->chatOwnerType) {
            Department::class => Department::find($this->chatOwnerId),
            User::class => User::find($this->chatOwnerId),
            default => null,
        };

        $model?->update(['telegram_chat_id' => $chatId]);
    }
}
