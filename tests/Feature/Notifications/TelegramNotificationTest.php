<?php

use App\Jobs\SendTelegramMessageJob;
use App\Models\Department;
use Illuminate\Support\Facades\Http;

test('telegram delivery retries migrated chats and persists the new chat id', function () {
    config()->set('services.telegram-bot-api.token', 'test-token');
    $department = Department::create([
        'name' => 'Telegram Notification Department',
        'code' => 'TELEGRAM-NOTIFY',
        'is_support_team' => true,
        'telegram_chat_id' => '-100-old',
    ]);
    Http::fakeSequence()
        ->push([
            'ok' => false,
            'parameters' => ['migrate_to_chat_id' => '-100-new'],
        ], 400)
        ->push(['ok' => true], 200);

    $job = new SendTelegramMessageJob(
        '-100-old',
        'Test notification',
        null,
        Department::class,
        $department->id
    );
    $job->handle();

    expect($department->fresh()->telegram_chat_id)->toBe('-100-new');
    Http::assertSentCount(2);
});
