<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class TelegramIntegrationController extends Controller
{
    /**
     * Generate a temporary token for linking a Telegram account.
     */
    public function generateToken(Request $request)
    {
        $user = Auth::user();

        // Generate a random token
        $token = 'link-' . Str::random(16);

        // Store in cache for 15 minutes, mapping token to user ID
        Cache::put('telegram_token_' . $token, $user->id, now()->addMinutes(15));

        // The bot username should be configured in services.php / .env
        $botUsername = config('services.telegram-bot-api.name', 'KimmixHelpDeskBot');
        $botUrl = "https://t.me/{$botUsername}";

        return back()->with([
            'telegramToken' => $token,
            'telegramBotUrl' => $botUrl,
            'success' => 'Token generated successfully. Please click the button to connect.',
        ]);
    }

    /**
     * Disconnect the user's Telegram account.
     */
    public function disconnect(Request $request)
    {
        $user = Auth::user();

        $user->update([
            'telegram_chat_id' => null,
            'telegram_username' => null,
        ]);

        return back()->with('success', 'Telegram account disconnected successfully.');
    }
}