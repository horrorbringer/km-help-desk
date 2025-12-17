import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
  Ticket,
  Users,
  Folder,
  BarChart3,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/types';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface ReportsIndexProps extends PageProps {
  reportTypes: ReportType[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ticket: Ticket,
  users: Users,
  folder: Folder,
  report: BarChart3,
  'file-description': FileText,
  clock: Clock,
};

const colorMap: Record<string, string> = {
  ticket: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  users: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  folder: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
  report: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  'file-description': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
  clock: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
};

export default function ReportsIndex() {
  const { reportTypes } = usePage<ReportsIndexProps>().props;

  return (
    <AppLayout>
      <Head title="Reports & Analytics" />

      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Comprehensive insights and performance metrics for your help desk
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const IconComponent = iconMap[report.icon] || BarChart3;
            const colorClass = colorMap[report.icon] || colorMap.report;

            return (
              <Card
                key={report.id}
                className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "p-3 rounded-xl border-2 transition-transform duration-300 group-hover:scale-110",
                      colorClass
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {report.name}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {report.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="relative">
                  <Button
                    asChild
                    className="w-full group/btn"
                    variant="outline"
                  >
                    <Link href={route(`admin.reports.${report.id}`)}>
                      <span>View Report</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats Section */}
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reportTypes.length}</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Report Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">6</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">100%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

