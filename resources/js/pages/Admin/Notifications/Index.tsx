import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PageProps } from '@/types';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  ticket?: { id: number; ticket_number: string; subject: string } | null;
  related_user?: { id: number; name: string } | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

interface NotificationsIndexProps extends PageProps {
  notifications: {
    data: Notification[];
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    type?: string;
    is_read?: string;
  };
  unreadCount: number;
  types: string[];
}

const typeColorMap: Record<string, string> = {
  ticket_created: 'bg-blue-100 text-blue-800',
  ticket_assigned: 'bg-indigo-100 text-indigo-800',
  ticket_updated: 'bg-amber-100 text-amber-800',
  ticket_resolved: 'bg-emerald-100 text-emerald-800',
  ticket_closed: 'bg-slate-200 text-slate-800',
  ticket_commented: 'bg-purple-100 text-purple-800',
  ticket_mentioned: 'bg-pink-100 text-pink-800',
  sla_breached: 'bg-red-100 text-red-800',
  sla_warning: 'bg-orange-100 text-orange-800',
};

export default function NotificationsIndex() {
  const { notifications, filters, unreadCount, types } = usePage<NotificationsIndexProps>().props;

  const handleFilter = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '' || value === '__all') {
      delete newFilters[key as keyof typeof filters];
    } else {
      newFilters[key as keyof typeof filters] = value;
    }
    router.get(route('admin.notifications.index'), newFilters, {
      preserveState: true,
      replace: true,
    });
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await axios.post(route('admin.notifications.read', notificationId));
      router.reload({ only: ['notifications', 'unreadCount'] });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(route('admin.notifications.read-all'));
      router.reload({ only: ['notifications', 'unreadCount'] });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <AppLayout>
      <Head title="Notifications" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with ticket activities and system alerts
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline">
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              value={(filters.type as string) ?? '__all'}
              onValueChange={(value) => handleFilter('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={(filters.is_read as string) ?? '__all'}
              onValueChange={(value) => handleFilter('is_read', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All notifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">All notifications</SelectItem>
                <SelectItem value="0">Unread only</SelectItem>
                <SelectItem value="1">Read only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Notifications ({notifications.total})
                {unreadCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {notifications.data.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No notifications found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Notification</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.data.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={notification.is_read ? '' : 'bg-muted/30 font-medium'}
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={notification.is_read ? 'text-muted-foreground' : ''}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${typeColorMap[notification.type] ?? ''}`}
                        >
                          {notification.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {notification.ticket ? (
                          <Link
                            href={route('admin.tickets.show', notification.ticket.id)}
                            className="text-sm text-primary hover:underline"
                          >
                            {notification.ticket.ticket_number}
                          </Link>
                        ) : notification.related_user ? (
                          <span className="text-sm">{notification.related_user.name}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as Read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {notifications.links.length > 3 && (
              <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
                {notifications.links.map((link) => (
                  <Button
                    key={link.label}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url)}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

