<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthLandingService
{
    public function resolveFor(?User $user): string
    {
        if ($user?->can('dashboard.view')) {
            return route('dashboard', absolute: false);
        }

        if ($user?->can('tickets.view')) {
            return route('admin.tickets.index', absolute: false);
        }

        return route('admin.bookings.index', absolute: false);
    }

    public function resolveFromRequest(Request $request): string
    {
        $user = $request->user();
        $intended = $request->session()->pull('url.intended');

        if (is_string($intended) && $user && $this->isSafeIntendedUrl($intended, $user)) {
            return $intended;
        }

        return $this->resolveFor($user);
    }

    public function isSafeIntendedUrl(string $url, User $user): bool
    {
        $path = Str::of(parse_url($url, PHP_URL_PATH) ?? '')
            ->trim('/')
            ->toString();

        if ($path === trim(parse_url(route('dashboard'), PHP_URL_PATH) ?? '', '/')) {
            return $user->can('dashboard.view');
        }

        return true;
    }
}
