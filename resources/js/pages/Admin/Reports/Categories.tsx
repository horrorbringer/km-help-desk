import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface Category {
  id: number;
  name: string;
  slug: string;
  total_tickets: number;
  resolved_tickets: number;
}

interface CategoriesReportProps extends PageProps {
  categories: Category[];
  filters: {
    date_from?: string;
    date_to?: string;
  };
}

export default function CategoriesReport() {
  const { categories, filters } = usePage<CategoriesReportProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.reports.categories'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  return (
    <AppLayout>
      <Head title="Category Analysis Report" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Category Analysis</h1>
            <p className="text-muted-foreground">Ticket distribution by category</p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.reports.index')}>← Back to Reports</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              placeholder="From Date"
              value={filters.date_from ?? ''}
              onChange={(e) => handleFilter('date_from', e.target.value)}
            />
            <Input
              type="date"
              placeholder="To Date"
              value={filters.date_to ?? ''}
              onChange={(e) => handleFilter('date_to', e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Category Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No categories found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Total Tickets</th>
                      <th className="px-4 py-3 text-left">Resolved</th>
                      <th className="px-4 py-3 text-left">Resolution Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const resolutionRate =
                        category.total_tickets > 0
                          ? ((category.resolved_tickets / category.total_tickets) * 100).toFixed(1)
                          : '0.0';
                      return (
                        <tr key={category.id} className="border-t hover:bg-muted/50 transition">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-muted-foreground">{category.slug}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{category.total_tickets}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {category.resolved_tickets}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium">{resolutionRate}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

