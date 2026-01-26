<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SystemMonitorController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'system' => $this->getSystemMetrics(),
            'database' => $this->getDatabaseMetrics(),
            'application' => $this->getApplicationMetrics(),
            'queues' => $this->getQueueMetrics(),
        ]);
    }

    private function getSystemMetrics(): array
    {
        $load = sys_getloadavg();
        $memory = $this->getMemoryUsage();
        $disk = $this->getDiskUsage();

        return [
            'load_average' => $load,
            'memory' => $memory,
            'disk' => $disk,
            'uptime' => $this->getUptime(),
        ];
    }

    private function getMemoryUsage(): array
    {
        $memory_limit = ini_get('memory_limit');
        $memory_used = memory_get_peak_usage(true);
        $memory_used_mb = round($memory_used / 1024 / 1024, 2);

        return [
            'used_mb' => $memory_used_mb,
            'limit' => $memory_limit,
        ];
    }

    private function getDiskUsage(): array
    {
        $disk_total = disk_total_space('/');
        $disk_free = disk_free_space('/');
        $disk_used = $disk_total - $disk_free;

        return [
            'total_gb' => round($disk_total / 1024 / 1024 / 1024, 2),
            'used_gb' => round($disk_used / 1024 / 1024 / 1024, 2),
            'free_gb' => round($disk_free / 1024 / 1024 / 1024, 2),
            'used_percent' => round(($disk_used / $disk_total) * 100, 2),
        ];
    }

    private function getUptime(): string
    {
        $uptime = @file_get_contents('/proc/uptime');
        if ($uptime) {
            $seconds = (int) explode(' ', $uptime)[0];
            $days = floor($seconds / 86400);
            $hours = floor(($seconds % 86400) / 3600);
            $minutes = floor(($seconds % 3600) / 60);

            return "{$days}d {$hours}h {$minutes}m";
        }

        return 'N/A';
    }

    private function getDatabaseMetrics(): array
    {
        try {
            $connections = DB::select('SHOW PROCESSLIST');
            $active_connections = count($connections);

            return [
                'active_connections' => $active_connections,
                'status' => 'healthy',
            ];
        } catch (\Exception $e) {
            return [
                'active_connections' => 0,
                'status' => 'error: '.$e->getMessage(),
            ];
        }
    }

    private function getApplicationMetrics(): array
    {
        $total_tickets = Cache::remember('monitor_total_tickets', 300, fn () => Ticket::count());
        $open_tickets = Cache::remember('monitor_open_tickets', 300, fn () => Ticket::where('status', '!=', 'closed')->count());
        $resolved_today = Cache::remember('monitor_resolved_today', 300, fn () => Ticket::whereDate('resolved_at', today())->count());
        $total_users = Cache::remember('monitor_total_users', 300, fn () => User::count());
        $active_users = Cache::remember('monitor_active_users', 300, fn () => User::where('is_active', true)->count());

        return [
            'tickets' => [
                'total' => $total_tickets,
                'open' => $open_tickets,
                'resolved_today' => $resolved_today,
            ],
            'users' => [
                'total' => $total_users,
                'active' => $active_users,
            ],
        ];
    }

    private function getQueueMetrics(): array
    {
        // Assuming database queues; adjust if using Redis
        try {
            $failed_jobs = DB::table('failed_jobs')->count();
            $pending_jobs = DB::table('jobs')->count();

            return [
                'pending_jobs' => $pending_jobs,
                'failed_jobs' => $failed_jobs,
                'status' => 'operational',
            ];
        } catch (\Exception $e) {
            return [
                'pending_jobs' => 0,
                'failed_jobs' => 0,
                'status' => 'error: '.$e->getMessage(),
            ];
        }
    }
}
