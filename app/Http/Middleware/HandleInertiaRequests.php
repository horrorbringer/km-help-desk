<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Get a boolean setting value, handling various formats
     */
    protected function getBooleanSetting(string $key, bool $default = true): bool
    {
        $value = \App\Models\Setting::get($key, $default);
        
        // Ensure we return a boolean
        if (is_bool($value)) {
            return $value;
        }
        
        // Handle string values
        if (is_string($value)) {
            $lowerValue = strtolower(trim($value));
            if (in_array($lowerValue, ['1', 'true', 'yes', 'on'])) {
                return true;
            }
            if (in_array($lowerValue, ['0', 'false', 'no', 'off', ''])) {
                return false;
            }
        }
        
        // Handle numeric values
        if (is_numeric($value)) {
            return (bool) $value;
        }
        
        // Default fallback
        return $default;
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'csrf_token' => csrf_token(), // Share CSRF token for file uploads
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar' => $request->user()->avatar ? asset('storage/' . $request->user()->avatar) : null,
                    'department_id' => $request->user()->department_id,
                    'roles' => $request->user()->getRoleNames(),
                    'permissions' => $request->user()->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'settings' => [
                'enable_advanced_options' => $this->getBooleanSetting('enable_advanced_options', true),
            ],
        ];
    }
}
