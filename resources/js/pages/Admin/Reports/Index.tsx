import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

const iconMap: Record<string, string> = {
  ticket: '🎫',
  users: '👥',
  folder: '📁',
  report: '📊',
  'file-description': '📄',
};

export default function ReportsIndex() {
  const { reportTypes } = usePage<ReportsIndexProps>().props;

  return (
    <AppLayout>
      <Head title="Reports & Analytics" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Generate detailed reports and analyze help desk performance
            </p>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{iconMap[report.icon] || '📊'}</span>
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={route(`admin.reports.${report.id}`)}>View Report</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

