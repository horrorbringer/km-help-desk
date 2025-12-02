import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Users, Ticket, CheckCircle, Clock } from 'lucide-react';

type DashboardStats = {
  overview: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
    cancelled: number;
    avg_resolution_hours: number;
    resolution_rate: number;
  };
  status_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  sla_compliance: {
    total_with_sla: number;
    response_breached: number;
    resolution_breached: number;
    response_compliance_rate: number;
    resolution_compliance_rate: number;
  };
  team_performance: Array<{
    team_id: number;
    team_name: string;
    total_tickets: number;
    resolved_tickets: number;
    resolution_rate: number;
  }>;
  category_distribution: Array<{
    category_id: number;
    category_name: string;
    count: number;
  }>;
  recent_tickets: Array<{
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    requester?: string;
    team?: string;
    category?: string;
    created_at: string;
  }>;
  agent_workload: Array<{
    id: number;
    name: string;
    open_tickets: number;
    total_tickets: number;
  }>;
  ticket_trends: Array<{
    date: string;
    count: number;
  }>;
};

type Dashboard01Props = {
  stats: DashboardStats;
  period: string;
  onPeriodChange: (period: string) => void;
};

const statusColorMap: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-amber-100 text-amber-800',
  pending: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-gray-200 text-gray-700',
};

const priorityColorMap: Record<string, string> = {
  low: 'bg-slate-200 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function Dashboard01({ stats, period, onPeriodChange }: Dashboard01Props) {
  // Prepare chart data
  const trendData = stats.ticket_trends.map((trend) => ({
    date: trend.date,
    tickets: trend.count,
  }));

  const statusData = Object.entries(stats.status_breakdown).map(([status, count]) => ({
    status: status.replace('_', ' '),
    count,
  }));

  const priorityData = Object.entries(stats.priority_breakdown).map(([priority, count]) => ({
    priority: priority.charAt(0).toUpperCase() + priority.slice(1),
    count,
  }));

  // Chart configurations using default shadcn colors
  const trendChartConfig = {
    tickets: {
      label: 'Tickets',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  const statusChartConfig = {
    count: {
      label: 'Count',
      color: 'var(--chart-2)',
    },
  } satisfies ChartConfig;

  const priorityChartConfig = {
    count: {
      label: 'Count',
      color: 'var(--chart-3)',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Help Desk Dashboard</h2>
          <p className="text-muted-foreground">Here's an overview of your help desk system.</p>
        </div>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All tickets in period</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.overview.open.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.overview.resolved.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.overview.resolution_rate.toFixed(1)}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.overview.avg_resolution_hours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">Average time to resolve</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl">Ticket Trends</CardTitle>
            <CardDescription>Daily ticket creation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[350px] w-full">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="fillTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-tickets)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-tickets)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        });
                      }}
                    />
                  }
                />
                <Area
                  type="natural"
                  dataKey="tickets"
                  stroke="var(--color-tickets)"
                  fill="url(#fillTickets)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">Status Distribution</CardTitle>
            <CardDescription>Breakdown by ticket status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[350px] w-full">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority & SLA Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">Priority Distribution</CardTitle>
            <CardDescription>Breakdown by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={priorityChartConfig} className="h-[300px] w-full">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  dataKey="priority"
                  type="category"
                  width={80}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl">SLA Compliance</CardTitle>
            <CardDescription>Service level agreement performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Response Compliance</span>
                <span className="text-sm font-bold">
                  {stats.sla_compliance.response_compliance_rate}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    stats.sla_compliance.response_compliance_rate >= 95
                      ? 'bg-emerald-500'
                      : stats.sla_compliance.response_compliance_rate >= 80
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                  style={{
                    width: `${stats.sla_compliance.response_compliance_rate}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.sla_compliance.response_breached} breaches out of{' '}
                {stats.sla_compliance.total_with_sla} tickets
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Resolution Compliance</span>
                <span className="text-sm font-bold">
                  {stats.sla_compliance.resolution_compliance_rate}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    stats.sla_compliance.resolution_compliance_rate >= 95
                      ? 'bg-emerald-500'
                      : stats.sla_compliance.resolution_compliance_rate >= 80
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  )}
                  style={{
                    width: `${stats.sla_compliance.resolution_compliance_rate}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.sla_compliance.resolution_breached} breaches out of{' '}
                {stats.sla_compliance.total_with_sla} tickets
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance & Recent Tickets */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Team Performance</CardTitle>
            <CardDescription>Resolution rates by team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {stats.team_performance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No team data available</p>
                </div>
              ) : (
                stats.team_performance.map((team) => (
                  <div key={team.team_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{team.team_name}</span>
                      <span className="text-sm font-bold text-primary">{team.resolution_rate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div
                        className={cn(
                          'h-2.5 rounded-full transition-all',
                          team.resolution_rate >= 90
                            ? 'bg-emerald-500'
                            : team.resolution_rate >= 70
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                        )}
                        style={{
                          width: `${team.resolution_rate}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {team.resolved_tickets} resolved / {team.total_tickets} total
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Tickets</CardTitle>
            <CardDescription>Latest ticket activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent_tickets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No recent tickets</p>
                </div>
              ) : (
                stats.recent_tickets.slice(0, 5).map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={route('admin.tickets.show', { ticket: ticket.id })}
                    className="block p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{ticket.ticket_number}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={cn('text-xs capitalize', statusColorMap[ticket.status] ?? '')}
                        >
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href={route('admin.tickets.index')}>View All Tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

