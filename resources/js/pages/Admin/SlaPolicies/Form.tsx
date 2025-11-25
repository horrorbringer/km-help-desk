import React, { FormEvent } from 'react';
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

interface SlaPolicy {
  id: number;
  name: string;
  description?: string | null;
  priority: string;
  response_time: number;
  resolution_time: number;
  is_active: boolean;
}

interface SlaPolicyFormProps {
  policy?: SlaPolicy;
}

export default function SlaPolicyForm({ policy }: SlaPolicyFormProps) {
  const isEdit = !!policy;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    name: policy?.name ?? '',
    description: policy?.description ?? '',
    priority: policy?.priority ?? 'medium',
    response_time: policy?.response_time ?? 60,
    resolution_time: policy?.resolution_time ?? 480,
    is_active: policy?.is_active ?? true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && policy) {
      put(route('admin.sla-policies.update', policy.id));
    } else {
      post(route('admin.sla-policies.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit SLA Policy' : 'New SLA Policy'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit SLA Policy' : 'New SLA Policy'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the SLA policy details.'
                : 'Create a new Service Level Agreement policy.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.sla-policies.index')}>← Back</Link>
          </Button>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>SLA Policy Information</CardTitle>
              <CardDescription>
                {isEdit
                  ? 'Update the SLA policy details below.'
                  : 'Fill in the information to create a new SLA policy.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Policy Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  placeholder="e.g. Standard Support SLA, Critical Issue SLA"
                  required
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  placeholder="Describe when this SLA policy should be applied..."
                  rows={3}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level *</Label>
                <Select
                  value={data.priority}
                  onValueChange={(value) => setData('priority', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This policy will apply to tickets with this priority level
                </p>
                {errors.priority && <p className="text-xs text-red-500">{errors.priority}</p>}
              </div>

              {/* Time Settings */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="response_time">First Response Time (minutes) *</Label>
                  <Input
                    id="response_time"
                    type="number"
                    min="1"
                    value={data.response_time}
                    onChange={(e) => setData('response_time', Number(e.target.value))}
                    placeholder="60"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to provide first response to the ticket
                  </p>
                  {errors.response_time && (
                    <p className="text-xs text-red-500">{errors.response_time}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution_time">Resolution Time (minutes) *</Label>
                  <Input
                    id="resolution_time"
                    type="number"
                    min="1"
                    value={data.resolution_time}
                    onChange={(e) => setData('resolution_time', Number(e.target.value))}
                    placeholder="480"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum time to resolve the ticket completely
                  </p>
                  {errors.resolution_time && (
                    <p className="text-xs text-red-500">{errors.resolution_time}</p>
                  )}
                </div>
              </div>

              {/* Time Examples */}
              <div className="rounded-md border bg-muted/50 p-3 text-sm">
                <p className="font-medium mb-2">Time Examples:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>15 minutes = 15</li>
                  <li>1 hour = 60</li>
                  <li>4 hours = 240</li>
                  <li>1 day (8 hours) = 480</li>
                  <li>2 days (16 hours) = 960</li>
                </ul>
              </div>

              {/* Active Status */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={data.is_active}
                  onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                />
                <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                  Policy is active
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Inactive policies won't be applied to new tickets
              </p>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href={route('admin.sla-policies.index')}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Saving...' : isEdit ? 'Update Policy' : 'Create Policy'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

