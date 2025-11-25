<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    protected $casts = [
        'value' => 'string',
    ];

    /**
     * Get a setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'integer' => (int) $setting->value,
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    /**
     * Set a setting value by key
     */
    public static function set(string $key, $value, string $type = 'string', string $group = 'general', ?string $description = null): void
    {
        $setting = static::firstOrNew(['key' => $key]);
        
        $setting->value = match ($type) {
            'json' => json_encode($value),
            'boolean' => $value ? '1' : '0',
            default => (string) $value,
        };
        
        $setting->type = $type;
        $setting->group = $group;
        $setting->description = $description;
        $setting->save();
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->mapWithKeys(fn ($setting) => [$setting->key => $setting->value])
            ->toArray();
    }
}

