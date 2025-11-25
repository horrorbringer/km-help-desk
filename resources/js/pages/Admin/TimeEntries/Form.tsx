import React, { FormEvent, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PageProps } from '@/types';

interface TimeEntryFormProps {
  timeEntry?: {
    id: number;
    ticket_id: number;
    user_id: number;
    date: string;
    start_time?: string;
    end_time?: string;
    duration_minutes: number;
    description?: string;
    activity_type?: string;
    is_billable: boolean;
    hourly_rate?: number;
    amount?: number;
    is_approved: boolean;
  };
  ticket?: {
    id: number;
    ticket_number: string;
    subject: string;
  } | null;
  activityTypes: string[];
}

export default function TimeEntryForm({ timeEntry, ticket, activityTypes }: TimeEntryFormProps) {
  const isEdit = !!timeEntry;
  const { errors } = usePage<PageProps>().props;
  const [timeEntryMethod, setTimeEntryMethod] = useState<'duration' | 'times'>(
    timeEntry?.start_time && timeEntry?.end_time ? 'times' : 'duration'
  );

  const { data, setData, post, put, processing } = useForm({
    ticket_id: timeEntry?.ticket_id ?? ticket?.id ?? '',
    user_id: timeEntry?.user_id ?? '',
    date: timeEntry?.date ?? new Date().toISOString().split('T')[0],
    start_time: timeEntry?.start_time ?? '',
    end_time: timeEntry?.end_time ?? '',
    duration_minutes: timeEntry?.duration_minutes ?? 0,
    description: timeEntry?.description ?? '',
    activity_type: timeEntry?.activity_type ?? '',
    is_billable: timeEntry?.is_billable ?? true,
    hourly_rate: timeEntry?.hourly_rate ?? '',
    is_approved: timeEntry?.is_approved ?? false,
  });

  const calculateDuration = () => {
    if (data.start_time && data.end_time) {
      const start = new Date(`${data.date}T${data.start_time}`);
      let end = new Date(`${data.date}T${data.end_time}`);
      
      // Handle overnight entries
      if (end < start) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      setData('duration_minutes', diffMinutes);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Calculate duration if using times method
    if (timeEntryMethod === 'times' && data.start_time && data.end_time) {
      calculateDuration();
    }

    // Clear start/end times if using duration method
    if (timeEntryMethod === 'duration') {
      setData('start_time', '');
      setData('end_time', '');
    }

    if (isEdit && timeEntry) {
      put(route('admin.time-entries.update', timeEntry.id));
    } else {
      post(route('admin.time-entries.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Time Entry' : 'New Time Entry'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Time Entry' : 'New Time Entry'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the time entry.'
                : 'Log time spent on a ticket for billing and reporting.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.time-entries.index')}>← Back</Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Time Entry Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the time entry details below.'
                    : 'Fill in the information to log time spent on a ticket.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Ticket */}
                {ticket ? (
                  <div className="space-y-2">
                    <Label>Ticket</Label>
                    <div className="p-3 border rounded-lg bg-muted">
                      <p className="font-medium">{ticket.ticket_number}</p>
                      <p className="text-sm text-muted-foreground">{ticket.subject}</p>
                    </div>
                    <input type="hidden" value={ticket.id} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="ticket_id">Ticket *</Label>
                    <Input
                      id="ticket_id"
                      type="text"
                      placeholder="Enter ticket number or ID"
                      value={data.ticket_id}
                      onChange={(e) => setData('ticket_id', e.target.value)}
                      required
                    />
                    {errors.ticket_id && (
                      <p className="text-xs text-red-500">{errors.ticket_id}</p>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={data.date}
                    onChange={(e) => setData('date', e.target.value)}
                    required
                  />
                  {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
                </div>

                {/* Time Entry Method */}
                {!isEdit && (
                  <div className="space-y-2">
                    <Label>Time Entry Method</Label>
                    <Select
                      value={timeEntryMethod}
                      onValueChange={(value: 'duration' | 'times') => setTimeEntryMethod(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duration">Enter Duration</SelectItem>
                        <SelectItem value="times">Enter Start/End Times</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Duration or Start/End Times */}
                {timeEntryMethod === 'duration' ? (
                  <div className="space-y-2">
                    <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      min="1"
                      value={data.duration_minutes}
                      onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 0)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {data.duration_minutes > 0 &&
                        `Approximately ${Math.floor(data.duration_minutes / 60)}h ${data.duration_minutes % 60}m`}
                    </p>
                    {errors.duration_minutes && (
                      <p className="text-xs text-red-500">{errors.duration_minutes}</p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={data.start_time}
                        onChange={(e) => {
                          setData('start_time', e.target.value);
                          if (data.end_time) {
                            calculateDuration();
                          }
                        }}
                      />
                      {errors.start_time && (
                        <p className="text-xs text-red-500">{errors.start_time}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={data.end_time}
                        onChange={(e) => {
                          setData('end_time', e.target.value);
                          if (data.start_time) {
                            calculateDuration();
                          }
                        }}
                      />
                      {errors.end_time && (
                        <p className="text-xs text-red-500">{errors.end_time}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Type */}
                <div className="space-y-2">
                  <Label htmlFor="activity_type">Activity Type</Label>
                  <Select
                    value={data.activity_type || '__none'}
                    onValueChange={(value) => setData('activity_type', value === '__none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">None</SelectItem>
                      {activityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.activity_type && (
                    <p className="text-xs text-red-500">{errors.activity_type}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="What work was performed..."
                    rows={4}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                  )}
                </div>

                {/* Billable */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_billable"
                    checked={data.is_billable}
                    onCheckedChange={(checked) => setData('is_billable', Boolean(checked))}
                  />
                  <Label htmlFor="is_billable" className="text-sm font-normal cursor-pointer">
                    This time entry is billable
                  </Label>
                </div>

                {/* Hourly Rate */}
                {data.is_billable && (
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={data.hourly_rate}
                      onChange={(e) => setData('hourly_rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {data.hourly_rate &&
                        data.duration_minutes > 0 &&
                        `Amount: $${((data.duration_minutes / 60) * data.hourly_rate).toFixed(2)}`}
                    </p>
                    {errors.hourly_rate && (
                      <p className="text-xs text-red-500">{errors.hourly_rate}</p>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.time-entries.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Entry' : 'Create Entry'}
                </Button>
              </CardFooter>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle>Time Tracking Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Duration Method</p>
                  <p className="text-muted-foreground">
                    Enter the total time spent in minutes. Useful for quick logging.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Start/End Times</p>
                  <p className="text-muted-foreground">
                    Enter specific start and end times. Duration is calculated automatically.
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Billable Time</p>
                  <p className="text-muted-foreground">
                    Mark time as billable to include it in billing calculations. Set an hourly rate
                    to calculate the amount automatically.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

