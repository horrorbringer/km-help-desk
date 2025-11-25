import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.total}</div>
            <p className="text-xs text-muted-foreground">All tickets in period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.open}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.overview.resolved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.overview.resolution_rate}% resolution rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.avg_resolution_hours}h</div>
            <p className="text-xs text-muted-foreground">Average time to resolve</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Ticket Trends</CardTitle>
            <CardDescription>Daily ticket creation over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="tickets"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTickets)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Breakdown by ticket status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority & SLA Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Breakdown by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="priority" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>SLA Compliance</CardTitle>
            <CardDescription>Service level agreement performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Resolution rates by team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.team_performance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team data available</p>
              ) : (
                stats.team_performance.map((team) => (
                  <div key={team.team_id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{team.team_name}</span>
                      <span className="text-sm font-bold">{team.resolution_rate}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: `${team.resolution_rate}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
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
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Latest ticket activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recent_tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent tickets</p>
              ) : (
                stats.recent_tickets.slice(0, 5).map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={route('admin.tickets.show', ticket.id)}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.ticket_number}</p>
                        <p className="text-xs text-muted-foreground truncate">{ticket.subject}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', statusColorMap[ticket.status] ?? '')}
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

