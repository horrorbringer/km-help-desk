import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

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

interface HistoricalPoint {
    time: string;
    load1: number;
    load5: number;
    load15: number;
    memory: number;
    connections: number;
}

export default function Index() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [history, setHistory] = useState<HistoricalPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const response = await fetch(route('admin.system-monitor.data'));

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // If we got HTML (likely login page due to session expiry), reload
                if (contentType && contentType.includes('text/html')) {
                    window.location.reload();
                    return;
                }
                throw new Error('Invalid response format: Expected JSON');
            }

            if (!response.ok) throw new Error('Failed to fetch metrics');

            const data: SystemMetrics = await response.json();
            setMetrics(data);

            // Update history
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            setHistory((prev) => {
                const newPoint: HistoricalPoint = {
                    time: timeStr,
                    load1: data.system.load_average[0],
                    load5: data.system.load_average[1],
                    load15: data.system.load_average[2],
                    memory: data.system.memory.used_mb,
                    connections: data.database.active_connections,
                };
                const newHistory = [...prev, newPoint];
                // Keep last 20 points
                return newHistory.slice(-20);
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <AppLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="text-muted-foreground">
                        Loading metrics...
                    </div>
                </div>
            </AppLayout>
        );
    if (error)
        return (
            <AppLayout>
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                    Error: {error}
                </div>
            </AppLayout>
        );
    if (!metrics)
        return (
            <AppLayout>
                <div>No data</div>
            </AppLayout>
        );

    const diskData = [
        { name: 'Used', value: metrics.system.disk.used_gb },
        { name: 'Free', value: metrics.system.disk.free_gb },
    ];
    const COLORS = ['#ef4444', '#22c55e']; // red-500, green-500

    return (
        <AppLayout>
            <Head title="System Monitor" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">System Monitor</h1>
                        <p className="text-muted-foreground">
                            Real-time system health and metrics
                        </p>
                    </div>
                    <Badge variant="outline" className="text-sm">
                        Uptime: {metrics.system.uptime}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Load Average Chart */}
                    <Card className="col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Load Average (1m, 5m, 15m)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="load1"
                                        stroke="#8884d8"
                                        name="1 min"
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="load5"
                                        stroke="#82ca9d"
                                        name="5 min"
                                        isAnimationActive={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="load15"
                                        stroke="#ffc658"
                                        name="15 min"
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Disk Usage */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Disk Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-[200px] items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={diskData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {diskData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Total: {metrics.system.disk.total_gb} GB | Used:{' '}
                                {metrics.system.disk.used_gb} GB (
                                {metrics.system.disk.used_percent}%)
                            </div>
                        </CardContent>
                    </Card>

                    {/* Memory & DB Connections History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Memory Usage (MB)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="memory"
                                        stroke="#8884d8"
                                        name="Used MB"
                                        isAnimationActive={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Current: {metrics.system.memory.used_mb} MB
                                (Limit: {metrics.system.memory.limit})
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Database */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Database Status
                            </CardTitle>
                            <Badge
                                variant={
                                    metrics.database.status === 'healthy'
                                        ? 'default'
                                        : 'destructive'
                                }
                            >
                                {metrics.database.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.database.active_connections}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active Connections
                            </p>
                        </CardContent>
                    </Card>

                    {/* Queues */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Queue Status
                            </CardTitle>
                            <Badge
                                variant={
                                    metrics.queues.status === 'operational'
                                        ? 'default'
                                        : 'destructive'
                                }
                            >
                                {metrics.queues.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.queues.pending_jobs}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pending Jobs ({metrics.queues.failed_jobs}{' '}
                                failed)
                            </p>
                        </CardContent>
                    </Card>

                    {/* Application Tickets */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Open Tickets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {metrics.application.tickets.open}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {metrics.application.tickets.resolved_today}{' '}
                                resolved today
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
