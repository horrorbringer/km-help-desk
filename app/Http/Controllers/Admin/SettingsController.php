<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        // Settings should be accessible to admins and managers
        // For now, we'll allow any authenticated user, but you can add permission check:
        // abort_unless(auth()->user()->can('settings.view'), 403);
        
        $groups = [
            'general' => $this->getGeneralSettings(),
            'email' => $this->getEmailSettings(),
            'ticket' => $this->getTicketSettings(),
            'notification' => $this->getNotificationSettings(),
            'security' => $this->getSecuritySettings(),
        ];

        return Inertia::render('Admin/Settings/Index', [
            'settings' => $groups,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            if (str_starts_with($key, 'setting_')) {
                $settingKey = str_replace('setting_', '', $key);
                $setting = Setting::where('key', $settingKey)->first();

                if ($setting) {
                    // Preserve the type, but normalize the value based on type
                    $normalizedValue = $this->normalizeValue($value, $setting->type);
                    $setting->value = $normalizedValue;
                    // Ensure type is preserved (in case it was changed)
                    if (!$setting->type) {
                        $setting->type = $this->detectType($value);
                    }
                    $setting->save();
                } else {
                    // Create new setting if it doesn't exist
                    $detectedType = $this->detectType($value);
                    Setting::create([
                        'key' => $settingKey,
                        'value' => $this->normalizeValue($value, $detectedType),
                        'type' => $detectedType,
                        'group' => $this->detectGroup($settingKey),
                    ]);
                }
            }
        }

        return redirect()
            ->route('admin.settings.index')
            ->with('success', 'Settings updated successfully.');
    }

    protected function normalizeValue($value, string $type): string
    {
        if ($type === 'boolean') {
            // Normalize boolean values to '1' or '0'
            if (is_bool($value)) {
                return $value ? '1' : '0';
            }
            if (is_string($value)) {
                $lowerValue = strtolower(trim($value));
                if (in_array($lowerValue, ['1', 'true', 'yes', 'on'])) {
                    return '1';
                }
                if (in_array($lowerValue, ['0', 'false', 'no', 'off', ''])) {
                    return '0';
                }
            }
            if (is_numeric($value)) {
                return $value != 0 ? '1' : '0';
            }
            return '0'; // Default to false
        }
        
        if ($type === 'integer') {
            return (string) (int) $value;
        }
        
        if ($type === 'json') {
            return is_string($value) ? $value : json_encode($value);
        }
        
        return (string) ($value ?? '');
    }

    protected function getGeneralSettings(): array
    {
        return [
            'app_name' => Setting::get('app_name', 'Help Desk System'),
            'app_logo' => Setting::get('app_logo', ''),
            'timezone' => Setting::get('timezone', config('app.timezone')),
            'language' => Setting::get('language', 'en'),
            'date_format' => Setting::get('date_format', 'Y-m-d'),
            'time_format' => Setting::get('time_format', 'H:i'),
        ];
    }

    protected function getEmailSettings(): array
    {
        return [
            'mail_from_address' => Setting::get('mail_from_address', config('mail.from.address') ?? ''),
            'mail_from_name' => Setting::get('mail_from_name', config('mail.from.name') ?? ''),
            'mail_host' => Setting::get('mail_host', config('mail.mailers.smtp.host') ?? ''),
            'mail_port' => Setting::get('mail_port', config('mail.mailers.smtp.port') ?? '587'),
            'mail_username' => Setting::get('mail_username', config('mail.mailers.smtp.username') ?? ''),
            'mail_password' => Setting::get('mail_password', ''),
            'mail_encryption' => Setting::get('mail_encryption', config('mail.mailers.smtp.encryption') ?? 'tls'),
            'mail_enabled' => Setting::get('mail_enabled', true),
        ];
    }

    protected function getTicketSettings(): array
    {
        return [
            'ticket_number_prefix' => Setting::get('ticket_number_prefix', 'TKT'),
            'ticket_number_format' => Setting::get('ticket_number_format', '{prefix}-{year}-{number}'),
            'default_ticket_priority' => Setting::get('default_ticket_priority', 'medium'),
            'default_ticket_status' => Setting::get('default_ticket_status', 'open'),
            'auto_assign_tickets' => Setting::get('auto_assign_tickets', false),
            'auto_close_resolved_days' => Setting::get('auto_close_resolved_days', 7),
            'require_category' => Setting::get('require_category', true),
            'require_project' => Setting::get('require_project', false),
            // Advanced Options settings
            'enable_advanced_options' => Setting::get('enable_advanced_options', true),
            'enable_sla_options' => Setting::get('enable_sla_options', true),
            'enable_custom_fields' => Setting::get('enable_custom_fields', true),
            'enable_tags' => Setting::get('enable_tags', true),
            'enable_watchers' => Setting::get('enable_watchers', true),
        ];
    }

    protected function getNotificationSettings(): array
    {
        return [
            'notify_on_ticket_created' => Setting::get('notify_on_ticket_created', true),
            'notify_on_ticket_assigned' => Setting::get('notify_on_ticket_assigned', true),
            'notify_on_ticket_updated' => Setting::get('notify_on_ticket_updated', true),
            'notify_on_ticket_resolved' => Setting::get('notify_on_ticket_resolved', true),
            'notify_requester' => Setting::get('notify_requester', true),
            'notify_agent' => Setting::get('notify_agent', true),
            'notify_watchers' => Setting::get('notify_watchers', true),
        ];
    }

    protected function getSecuritySettings(): array
    {
        return [
            'password_min_length' => Setting::get('password_min_length', 8),
            'password_require_uppercase' => Setting::get('password_require_uppercase', false),
            'password_require_lowercase' => Setting::get('password_require_lowercase', false),
            'password_require_numbers' => Setting::get('password_require_numbers', false),
            'password_require_symbols' => Setting::get('password_require_symbols', false),
            'session_timeout' => Setting::get('session_timeout', 120),
            'two_factor_required' => Setting::get('two_factor_required', false),
            'login_attempts_limit' => Setting::get('login_attempts_limit', 5),
        ];
    }

    protected function detectType($value): string
    {
        if (is_bool($value) || in_array($value, ['0', '1', 'true', 'false'])) {
            return 'boolean';
        }
        if (is_numeric($value)) {
            return 'integer';
        }
        if (is_array($value) || is_object($value)) {
            return 'json';
        }
        return 'string';
    }

    protected function detectGroup(string $key): string
    {
        if (str_starts_with($key, 'mail_') || str_starts_with($key, 'email_')) {
            return 'email';
        }
        if (str_starts_with($key, 'ticket_')) {
            return 'ticket';
        }
        if (str_starts_with($key, 'notify_')) {
            return 'notification';
        }
        if (str_starts_with($key, 'password_') || str_starts_with($key, 'session_') || str_starts_with($key, 'login_') || str_starts_with($key, 'two_factor_')) {
            return 'security';
        }
        return 'general';
    }
}

