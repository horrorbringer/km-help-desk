<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;

/**
 * Logging Helper for Performance-Optimized Logging
 * 
 * Provides methods to conditionally log based on environment and log level
 * to reduce performance impact in production.
 */
class LogHelper
{
    /**
     * Check if logging should occur for given level
     * 
     * @param string $level Log level (debug, info, warning, error, critical)
     * @return bool
     */
    public static function shouldLog(string $level = 'info'): bool
    {
        $env = app()->environment();
        $logLevel = config('logging.channels.single.level', 'debug');
        
        // Map levels to priority (higher number = more important)
        $levels = [
            'debug' => 0,
            'info' => 1,
            'warning' => 2,
            'error' => 3,
            'critical' => 4,
        ];
        
        $requestedLevel = $levels[$level] ?? 1;
        $configuredLevel = $levels[$logLevel] ?? 1;
        
        // Only log if requested level is >= configured level
        return $requestedLevel >= $configuredLevel;
    }

    /**
     * Log only in development/staging environments
     * 
     * @param string $level
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function logDev(string $level, string $message, array $context = []): void
    {
        if (app()->environment(['local', 'staging'])) {
            Log::{$level}($message, $context);
        }
    }

    /**
     * Log debug messages only in development
     * 
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function debug(string $message, array $context = []): void
    {
        if (self::shouldLog('debug')) {
            Log::debug($message, $context);
        }
    }

    /**
     * Log info messages (respects LOG_LEVEL setting)
     * 
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function info(string $message, array $context = []): void
    {
        if (self::shouldLog('info')) {
            Log::info($message, $context);
        }
    }

    /**
     * Log warning messages
     * 
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function warning(string $message, array $context = []): void
    {
        if (self::shouldLog('warning')) {
            Log::warning($message, $context);
        }
    }

    /**
     * Log error messages (always logged)
     * 
     * @param string $message
     * @param array $context
     * @param bool $includeTrace Include full trace only in development
     * @return void
     */
    public static function error(string $message, array $context = [], bool $includeTrace = false): void
    {
        // Always log errors
        if ($includeTrace && app()->environment('local')) {
            // Only include trace in local environment
            if (isset($context['exception']) && $context['exception'] instanceof \Exception) {
                $context['trace'] = $context['exception']->getTraceAsString();
            }
        }
        
        Log::error($message, $context);
    }

    /**
     * Log critical messages (always logged)
     * 
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function critical(string $message, array $context = []): void
    {
        Log::critical($message, $context);
    }

    /**
     * Log workflow events (can be disabled in production)
     * 
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function workflow(string $message, array $context = []): void
    {
        // Only log workflow events if LOG_LEVEL allows info or lower
        if (self::shouldLog('info')) {
            Log::info("[WORKFLOW] {$message}", $context);
        }
    }

    /**
     * Log performance metrics (only in development/staging)
     * 
     * @param string $operation
     * @param float $durationMs
     * @param array $context
     * @return void
     */
    public static function performance(string $operation, float $durationMs, array $context = []): void
    {
        if (app()->environment(['local', 'staging'])) {
            Log::info("[PERF] {$operation} took {$durationMs}ms", $context);
        }
    }
}

