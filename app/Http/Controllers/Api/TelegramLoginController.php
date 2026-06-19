<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuthLandingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelegramLoginController extends Controller
{
    /**
     * Authenticate user via a secure one-time token and redirect to ticket
     */
    public function login(Request $request, $token)
    {
        $userId = Cache::get('tg_login_' . $token);

        if (!$userId) {
            Log::warning('Telegram auto-login: Token invalid or expired', ['token' => $token]);
            return redirect()->route('login')->with('error', 'Login session expired or invalid.');
        }

        $user = User::find($userId);

        if (!$user || !$user->is_active) {
            Log::error('Telegram auto-login: User not found or inactive', ['user_id' => $userId]);
            return redirect()->route('login')->with('error', 'User account not found or inactive.');
        }

        Log::info('Telegram auto-login: User authenticated successfully', [
            'user_id' => $user->id,
            'name' => $user->name,
            'redirect' => $request->query('redirect')
        ]);

        // Log the user in
        Auth::login($user, true); // true for "Remember me"

        // Consume the token (delete it)
        Cache::forget('tg_login_' . $token);

        $landingService = app(AuthLandingService::class);
        $redirectUrl = $request->query('redirect', $landingService->resolveFor($user));

        if (
            is_string($redirectUrl)
            && str_contains($redirectUrl, '/admin/dashboard')
            && ! $user->can('dashboard.view')
        ) {
            $redirectUrl = $landingService->resolveFor($user);
        }

        return redirect($redirectUrl);
    }

    /**
     * Generate a secure auto-login URL for a specific user
     */
    public static function generateLoginUrl(User $user, $redirectPath = null)
    {
        $token = Str::random(40);

        // Store for 15 minutes
        Cache::put('tg_login_' . $token, $user->id, now()->addMinutes(15));

        $url = route('telegram.login', ['token' => $token]);

        if ($redirectPath) {
            $url .= '?redirect=' . urlencode($redirectPath);
        }

        return $url;
    }
}
