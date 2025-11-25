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
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
  event_type: string;
  subject: string;
  body_html?: string | null;
  body_text?: string | null;
  variables?: string[] | null;
  is_active: boolean;
}

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  eventTypes: string[];
  defaultVariables: Record<string, string>;
}

export default function EmailTemplateForm({
  template,
  eventTypes,
  defaultVariables,
}: EmailTemplateFormProps) {
  const isEdit = !!template;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, post, put, processing } = useForm({
    name: template?.name ?? '',
    slug: template?.slug ?? '',
    event_type: template?.event_type ?? eventTypes[0] ?? '',
    subject: template?.subject ?? '',
    body_html: template?.body_html ?? '',
    body_text: template?.body_text ?? '',
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (isEdit && template) {
      put(route('admin.email-templates.update', template.id));
    } else {
      post(route('admin.email-templates.store'));
    }
  };

  return (
    <AppLayout>
      <Head title={isEdit ? 'Edit Email Template' : 'New Email Template'} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? 'Edit Email Template' : 'New Email Template'}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update the email template.'
                : 'Create a new email template for ticket notifications.'}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={route('admin.email-templates.index')}>← Back</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <Card className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>
                  {isEdit
                    ? 'Update the email template details below.'
                    : 'Fill in the information to create a new email template.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Ticket Created Notification"
                    required
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type *</Label>
                  <Select
                    value={data.event_type}
                    onValueChange={(value) => setData('event_type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.event_type && (
                    <p className="text-xs text-red-500">{errors.event_type}</p>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={data.subject}
                    onChange={(e) => setData('subject', e.target.value)}
                    placeholder="e.g. Ticket #{{ticket_number}} has been created"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables like {'{{ticket_number}}'}, {'{{subject}}'}, etc.
                  </p>
                  {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
                </div>

                {/* HTML Body */}
                <div className="space-y-2">
                  <Label htmlFor="body_html">HTML Body</Label>
                  <Textarea
                    id="body_html"
                    value={data.body_html}
                    onChange={(e) => setData('body_html', e.target.value)}
                    placeholder="HTML email content..."
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    HTML formatted email body. Use variables like {'{{ticket_number}}'}.
                  </p>
                  {errors.body_html && (
                    <p className="text-xs text-red-500">{errors.body_html}</p>
                  )}
                </div>

                {/* Text Body */}
                <div className="space-y-2">
                  <Label htmlFor="body_text">Plain Text Body</Label>
                  <Textarea
                    id="body_text"
                    value={data.body_text}
                    onChange={(e) => setData('body_text', e.target.value)}
                    placeholder="Plain text email content..."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text version (fallback if HTML is not available).
                  </p>
                  {errors.body_text && (
                    <p className="text-xs text-red-500">{errors.body_text}</p>
                  )}
                </div>

                {/* Active Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', Boolean(checked))}
                  />
                  <Label htmlFor="is_active" className="text-sm font-normal cursor-pointer">
                    Template is active
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  Inactive templates won't be used for sending emails
                </p>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={route('admin.email-templates.index')}>Cancel</Link>
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? 'Saving...' : isEdit ? 'Update Template' : 'Create Template'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Available Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>Use these variables in your templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(defaultVariables).map(([key, description]) => (
                  <div key={key} className="p-2 rounded border text-sm">
                    <code className="text-xs font-mono text-primary">{'{{' + key + '}}'}</code>
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

