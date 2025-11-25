import { Head, router } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Dashboard01 } from '@/components/dashboard-01';

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

type Props = {
  stats: DashboardStats;
  period: string;
};

export default function Dashboard({ stats, period }: Props) {
  const handlePeriodChange = (value: string) => {
    router.get(route('dashboard'), { period: value }, { preserveState: true, replace: true });
  };

  return (
    <AppLayout>
      <Head title="Dashboard" />
      <Dashboard01 stats={stats} period={period} onPeriodChange={handlePeriodChange} />
    </AppLayout>
  );
}

