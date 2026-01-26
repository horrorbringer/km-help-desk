import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface SystemMetrics {
    system: {
        load_average: number[];
        memory: { used_mb: number; limit: string };
        disk: {
            total_gb: number;
            used_gb: number;
            free_gb: number;
            used_percent: number;
        };
        uptime: string;
    };
    database: { active_connections: number; status: string };
    application: {
        tickets: { total: number; open: number; resolved_today: number };
        users: { total: number; active: number };
    };
    queues: { pending_jobs: number; failed_jobs: number; status: string };
}

export default function Index() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch('/admin/system-monitor');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            setMetrics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <AppLayout>
                <div>Loading...</div>
            </AppLayout>
        );
    if (error)
        return (
            <AppLayout>
                <div>Error: {error}</div>
            </AppLayout>
        );
    if (!metrics)
        return (
            <AppLayout>
                <div>No data</div>
            </AppLayout>
        );

    return (
        <AppLayout>
            <Head title="System Monitor" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">System Monitor</h1>
                    <p className="text-muted-foreground">
                        Real-time system health and metrics
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* System Metrics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>System Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                Load Average:{' '}
                                {metrics.system.load_average.join(', ')}
                            </div>
                            <div>
                                Memory Used: {metrics.system.memory.used_mb} MB
                            </div>
                            <div>
                                Disk Used: {metrics.system.disk.used_percent}% (
                                {metrics.system.disk.used_gb} GB /{' '}
                                {metrics.system.disk.total_gb} GB)
                            </div>
                            <div>Uptime: {metrics.system.uptime}</div>
                        </CardContent>
                    </Card>

                    {/* Database */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Database</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                Active Connections:{' '}
                                {metrics.database.active_connections}
                            </div>
                            <Badge
                                variant={
                                    metrics.database.status === 'healthy'
                                        ? 'default'
                                        : 'destructive'
                                }
                            >
                                {metrics.database.status}
                            </Badge>
                        </CardContent>
                    </Card>

                    {/* Application */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Application</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                Total Tickets:{' '}
                                {metrics.application.tickets.total}
                            </div>
                            <div>
                                Open Tickets: {metrics.application.tickets.open}
                            </div>
                            <div>
                                Resolved Today:{' '}
                                {metrics.application.tickets.resolved_today}
                            </div>
                            <div>
                                Total Users: {metrics.application.users.total}
                            </div>
                            <div>
                                Active Users: {metrics.application.users.active}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Queues */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Queues</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                Pending Jobs: {metrics.queues.pending_jobs}
                            </div>
                            <div>Failed Jobs: {metrics.queues.failed_jobs}</div>
                            <Badge
                                variant={
                                    metrics.queues.status === 'operational'
                                        ? 'default'
                                        : 'destructive'
                                }
                            >
                                {metrics.queues.status}
                            </Badge>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
