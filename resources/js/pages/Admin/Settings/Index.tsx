import React, { FormEvent } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PageProps } from '@/types';

interface Settings {
  general: {
    app_name: string;
    app_logo: string;
    timezone: string;
    language: string;
    date_format: string;
    time_format: string;
  };
  email: {
    mail_from_address: string;
    mail_from_name: string;
    mail_host: string;
    mail_port: string;
    mail_username: string;
    mail_password: string;
    mail_encryption: string;
    mail_enabled: boolean;
  };
  ticket: {
    ticket_number_prefix: string;
    ticket_number_format: string;
    default_ticket_priority: string;
    default_ticket_status: string;
    auto_assign_tickets: boolean;
    auto_close_resolved_days: number;
    require_category: boolean;
    require_project: boolean;
    enable_advanced_options: boolean;
    enable_sla_options: boolean;
    enable_custom_fields: boolean;
    enable_tags: boolean;
    enable_watchers: boolean;
  };
  notification: {
    notify_on_ticket_created: boolean;
    notify_on_ticket_assigned: boolean;
    notify_on_ticket_updated: boolean;
    notify_on_ticket_resolved: boolean;
    notify_requester: boolean;
    notify_agent: boolean;
    notify_watchers: boolean;
  };
  security: {
    password_min_length: number;
    password_require_uppercase: boolean;
    password_require_lowercase: boolean;
    password_require_numbers: boolean;
    password_require_symbols: boolean;
    session_timeout: number;
    two_factor_required: boolean;
    login_attempts_limit: number;
  };
}

interface SettingsIndexProps extends PageProps {
  settings: Settings;
}

export default function SettingsIndex() {
  const { settings, flash } = usePage<SettingsIndexProps>().props;
  const { errors } = usePage<PageProps>().props;

  const { data, setData, put, processing } = useForm({
    // General
    setting_app_name: settings?.general?.app_name ?? '',
    setting_app_logo: settings?.general?.app_logo ?? '',
    setting_timezone: settings?.general?.timezone ?? 'UTC',
    setting_language: settings?.general?.language ?? 'en',
    setting_date_format: settings?.general?.date_format ?? 'Y-m-d',
    setting_time_format: settings?.general?.time_format ?? 'H:i',
    // Email
    setting_mail_from_address: settings?.email?.mail_from_address ?? '',
    setting_mail_from_name: settings?.email?.mail_from_name ?? '',
    setting_mail_host: settings?.email?.mail_host ?? '',
    setting_mail_port: settings?.email?.mail_port ?? '587',
    setting_mail_username: settings?.email?.mail_username ?? '',
    setting_mail_password: settings?.email?.mail_password ?? '',
    setting_mail_encryption: settings?.email?.mail_encryption || 'tls',
    setting_mail_enabled: settings?.email?.mail_enabled ?? true,
    // Ticket
    setting_ticket_number_prefix: settings?.ticket?.ticket_number_prefix ?? 'TKT',
    setting_ticket_number_format: settings?.ticket?.ticket_number_format ?? '{prefix}-{year}-{number}',
    setting_default_ticket_priority: settings?.ticket?.default_ticket_priority ?? 'medium',
    setting_default_ticket_status: settings?.ticket?.default_ticket_status ?? 'open',
    setting_auto_assign_tickets: settings?.ticket?.auto_assign_tickets ?? false,
    setting_auto_close_resolved_days: settings?.ticket?.auto_close_resolved_days ?? 7,
    setting_require_category: settings?.ticket?.require_category ?? true,
    setting_require_project: settings?.ticket?.require_project ?? false,
    // Advanced Options
    setting_enable_advanced_options: settings?.ticket?.enable_advanced_options ?? true,
    setting_enable_sla_options: settings?.ticket?.enable_sla_options ?? true,
    setting_enable_custom_fields: settings?.ticket?.enable_custom_fields ?? true,
    setting_enable_tags: settings?.ticket?.enable_tags ?? true,
    setting_enable_watchers: settings?.ticket?.enable_watchers ?? true,
    // Notification
    setting_notify_on_ticket_created: settings?.notification?.notify_on_ticket_created ?? true,
    setting_notify_on_ticket_assigned: settings?.notification?.notify_on_ticket_assigned ?? true,
    setting_notify_on_ticket_updated: settings?.notification?.notify_on_ticket_updated ?? true,
    setting_notify_on_ticket_resolved: settings?.notification?.notify_on_ticket_resolved ?? true,
    setting_notify_requester: settings?.notification?.notify_requester ?? true,
    setting_notify_agent: settings?.notification?.notify_agent ?? true,
    setting_notify_watchers: settings?.notification?.notify_watchers ?? true,
    // Security
    setting_password_min_length: settings?.security?.password_min_length ?? 8,
    setting_password_require_uppercase: settings?.security?.password_require_uppercase ?? false,
    setting_password_require_lowercase: settings?.security?.password_require_lowercase ?? false,
    setting_password_require_numbers: settings?.security?.password_require_numbers ?? false,
    setting_password_require_symbols: settings?.security?.password_require_symbols ?? false,
    setting_session_timeout: settings?.security?.session_timeout ?? 120,
    setting_two_factor_required: settings?.security?.two_factor_required ?? false,
    setting_login_attempts_limit: settings?.security?.login_attempts_limit ?? 5,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    put(route('admin.settings.update'), {
      preserveScroll: true,
      onSuccess: () => {
        // Reload to refresh shared props (like settings in sidebar)
        // This is SPA-friendly - uses Inertia's AJAX, not a full page refresh
        router.reload({ only: [] });
      },
    });
  };

  return (
    <AppLayout>
      <Head title="Settings" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Configure system settings and preferences</p>
          </div>
        </div>

        {/* Flash Message */}
        {flash?.success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {flash.success}
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="ticket">Ticket</TabsTrigger>
              <TabsTrigger value="notification">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic system configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_app_name">Application Name</Label>
                      <Input
                        id="setting_app_name"
                        value={data.setting_app_name}
                        onChange={(e) => setData('setting_app_name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_app_logo">Logo URL</Label>
                      <Input
                        id="setting_app_logo"
                        value={data.setting_app_logo}
                        onChange={(e) => setData('setting_app_logo', e.target.value)}
                        placeholder="/logo.png"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_timezone">Timezone</Label>
                      <Select
                        value={data.setting_timezone}
                        onValueChange={(value) => setData('setting_timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Asia/Phnom_Penh">Asia/Phnom_Penh</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_language">Language</Label>
                      <Select
                        value={data.setting_language}
                        onValueChange={(value) => setData('setting_language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="km">ខ្មែរ (Khmer)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_date_format">Date Format</Label>
                      <Input
                        id="setting_date_format"
                        value={data.setting_date_format}
                        onChange={(e) => setData('setting_date_format', e.target.value)}
                        placeholder="Y-m-d"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_time_format">Time Format</Label>
                      <Input
                        id="setting_time_format"
                        value={data.setting_time_format}
                        onChange={(e) => setData('setting_time_format', e.target.value)}
                        placeholder="H:i"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration</CardTitle>
                  <CardDescription>SMTP settings for email notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setting_mail_enabled"
                      checked={data.setting_mail_enabled}
                      onCheckedChange={(checked) => setData('setting_mail_enabled', Boolean(checked))}
                    />
                    <Label htmlFor="setting_mail_enabled">Enable email notifications</Label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_from_address">From Address</Label>
                      <Input
                        id="setting_mail_from_address"
                        type="email"
                        value={data.setting_mail_from_address}
                        onChange={(e) => setData('setting_mail_from_address', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_from_name">From Name</Label>
                      <Input
                        id="setting_mail_from_name"
                        value={data.setting_mail_from_name}
                        onChange={(e) => setData('setting_mail_from_name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_host">SMTP Host</Label>
                      <Input
                        id="setting_mail_host"
                        value={data.setting_mail_host}
                        onChange={(e) => setData('setting_mail_host', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_port">SMTP Port</Label>
                      <Input
                        id="setting_mail_port"
                        type="number"
                        value={data.setting_mail_port}
                        onChange={(e) => setData('setting_mail_port', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_username">Username</Label>
                      <Input
                        id="setting_mail_username"
                        value={data.setting_mail_username}
                        onChange={(e) => setData('setting_mail_username', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_mail_password">Password</Label>
                      <Input
                        id="setting_mail_password"
                        type="password"
                        value={data.setting_mail_password}
                        onChange={(e) => setData('setting_mail_password', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setting_mail_encryption">Encryption</Label>
                    <Select
                      value={data.setting_mail_encryption === '' ? '__none' : (data.setting_mail_encryption || 'tls')}
                      onValueChange={(value) => setData('setting_mail_encryption', value === '__none' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="__none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ticket Settings */}
            <TabsContent value="ticket">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Settings</CardTitle>
                  <CardDescription>Default values and ticket behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_ticket_number_prefix">Ticket Number Prefix</Label>
                      <Input
                        id="setting_ticket_number_prefix"
                        value={data.setting_ticket_number_prefix}
                        onChange={(e) => setData('setting_ticket_number_prefix', e.target.value.toUpperCase())}
                        maxLength={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_ticket_number_format">Number Format</Label>
                      <Input
                        id="setting_ticket_number_format"
                        value={data.setting_ticket_number_format}
                        onChange={(e) => setData('setting_ticket_number_format', e.target.value)}
                        placeholder="{prefix}-{year}-{number}"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_default_ticket_priority">Default Priority</Label>
                      <Select
                        value={data.setting_default_ticket_priority}
                        onValueChange={(value) => setData('setting_default_ticket_priority', value)}
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_default_ticket_status">Default Status</Label>
                      <Select
                        value={data.setting_default_ticket_status}
                        onValueChange={(value) => setData('setting_default_ticket_status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setting_auto_close_resolved_days">Auto-close Resolved Tickets (Days)</Label>
                    <Input
                      id="setting_auto_close_resolved_days"
                      type="number"
                      min="0"
                      value={data.setting_auto_close_resolved_days}
                      onChange={(e) => setData('setting_auto_close_resolved_days', Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically close resolved tickets after this many days (0 = disabled)
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_auto_assign_tickets"
                        checked={data.setting_auto_assign_tickets}
                        onCheckedChange={(checked) => setData('setting_auto_assign_tickets', Boolean(checked))}
                      />
                      <Label htmlFor="setting_auto_assign_tickets">Auto-assign tickets to default team</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_require_category"
                        checked={data.setting_require_category}
                        onCheckedChange={(checked) => setData('setting_require_category', Boolean(checked))}
                      />
                      <Label htmlFor="setting_require_category">Require category when creating tickets</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_require_project"
                        checked={data.setting_require_project}
                        onCheckedChange={(checked) => setData('setting_require_project', Boolean(checked))}
                      />
                      <Label htmlFor="setting_require_project">Require project when creating tickets</Label>
                    </div>
                  </div>

                  {/* Advanced Options Settings */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Advanced Options</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Control which advanced options are available in the ticket creation form
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="setting_enable_advanced_options"
                          checked={data.setting_enable_advanced_options}
                          onCheckedChange={(checked) => setData('setting_enable_advanced_options', Boolean(checked))}
                        />
                        <Label htmlFor="setting_enable_advanced_options" className="font-medium">
                          Enable Advanced Options Section
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">
                        When disabled, the entire Advanced Options section will be hidden from the ticket form
                      </p>
                      
                      {data.setting_enable_advanced_options && (
                        <div className="ml-6 space-y-3 mt-4 border-l-2 pl-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="setting_enable_sla_options"
                              checked={data.setting_enable_sla_options}
                              onCheckedChange={(checked) => setData('setting_enable_sla_options', Boolean(checked))}
                            />
                            <Label htmlFor="setting_enable_sla_options">Enable SLA & Timelines</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="setting_enable_custom_fields"
                              checked={data.setting_enable_custom_fields}
                              onCheckedChange={(checked) => setData('setting_enable_custom_fields', Boolean(checked))}
                            />
                            <Label htmlFor="setting_enable_custom_fields">Enable Custom Fields</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="setting_enable_tags"
                              checked={data.setting_enable_tags}
                              onCheckedChange={(checked) => setData('setting_enable_tags', Boolean(checked))}
                            />
                            <Label htmlFor="setting_enable_tags">Enable Tags</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="setting_enable_watchers"
                              checked={data.setting_enable_watchers}
                              onCheckedChange={(checked) => setData('setting_enable_watchers', Boolean(checked))}
                            />
                            <Label htmlFor="setting_enable_watchers">Enable Watchers</Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent value="notification">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure when and who receives notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Event Notifications</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_on_ticket_created"
                        checked={data.setting_notify_on_ticket_created}
                        onCheckedChange={(checked) => setData('setting_notify_on_ticket_created', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_on_ticket_created">Notify when ticket is created</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_on_ticket_assigned"
                        checked={data.setting_notify_on_ticket_assigned}
                        onCheckedChange={(checked) => setData('setting_notify_on_ticket_assigned', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_on_ticket_assigned">Notify when ticket is assigned</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_on_ticket_updated"
                        checked={data.setting_notify_on_ticket_updated}
                        onCheckedChange={(checked) => setData('setting_notify_on_ticket_updated', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_on_ticket_updated">Notify when ticket is updated</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_on_ticket_resolved"
                        checked={data.setting_notify_on_ticket_resolved}
                        onCheckedChange={(checked) => setData('setting_notify_on_ticket_resolved', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_on_ticket_resolved">Notify when ticket is resolved</Label>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-sm font-medium">Recipient Settings</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_requester"
                        checked={data.setting_notify_requester}
                        onCheckedChange={(checked) => setData('setting_notify_requester', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_requester">Notify ticket requester</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_agent"
                        checked={data.setting_notify_agent}
                        onCheckedChange={(checked) => setData('setting_notify_agent', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_agent">Notify assigned agent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_notify_watchers"
                        checked={data.setting_notify_watchers}
                        onCheckedChange={(checked) => setData('setting_notify_watchers', Boolean(checked))}
                      />
                      <Label htmlFor="setting_notify_watchers">Notify ticket watchers</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Password policies and security configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="setting_password_min_length">Minimum Password Length</Label>
                    <Input
                      id="setting_password_min_length"
                      type="number"
                      min="4"
                      max="32"
                      value={data.setting_password_min_length}
                      onChange={(e) => setData('setting_password_min_length', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Password Requirements</h3>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_password_require_uppercase"
                        checked={data.setting_password_require_uppercase}
                        onCheckedChange={(checked) => setData('setting_password_require_uppercase', Boolean(checked))}
                      />
                      <Label htmlFor="setting_password_require_uppercase">Require uppercase letters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_password_require_lowercase"
                        checked={data.setting_password_require_lowercase}
                        onCheckedChange={(checked) => setData('setting_password_require_lowercase', Boolean(checked))}
                      />
                      <Label htmlFor="setting_password_require_lowercase">Require lowercase letters</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_password_require_numbers"
                        checked={data.setting_password_require_numbers}
                        onCheckedChange={(checked) => setData('setting_password_require_numbers', Boolean(checked))}
                      />
                      <Label htmlFor="setting_password_require_numbers">Require numbers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="setting_password_require_symbols"
                        checked={data.setting_password_require_symbols}
                        onCheckedChange={(checked) => setData('setting_password_require_symbols', Boolean(checked))}
                      />
                      <Label htmlFor="setting_password_require_symbols">Require special characters</Label>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="setting_session_timeout">Session Timeout (minutes)</Label>
                      <Input
                        id="setting_session_timeout"
                        type="number"
                        min="5"
                        value={data.setting_session_timeout}
                        onChange={(e) => setData('setting_session_timeout', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setting_login_attempts_limit">Login Attempts Limit</Label>
                      <Input
                        id="setting_login_attempts_limit"
                        type="number"
                        min="3"
                        max="10"
                        value={data.setting_login_attempts_limit}
                        onChange={(e) => setData('setting_login_attempts_limit', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="setting_two_factor_required"
                      checked={data.setting_two_factor_required}
                      onCheckedChange={(checked) => setData('setting_two_factor_required', Boolean(checked))}
                    />
                    <Label htmlFor="setting_two_factor_required">Require two-factor authentication</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={processing}>
              {processing ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

