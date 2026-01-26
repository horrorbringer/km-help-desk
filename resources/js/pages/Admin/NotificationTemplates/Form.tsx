import { Head, Link, router, usePage } from '@inertiajs/react';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface NotificationTemplate {
    id?: number;
    name: string;
    type: string;
    subject_template: string;
    message_template: string;
    variables: string[] | null;
    is_active: boolean;
}

interface NotificationTemplatesFormProps extends PageProps {
    template: NotificationTemplate | null;
    types: string[];
}

export default function NotificationTemplatesForm() {
    const { template, types } = usePage<NotificationTemplatesFormProps>().props;

    const [formData, setFormData] = useState({
        name: template?.name || '',
        type: template?.type || '',
        subject_template: template?.subject_template || '',
        message_template: template?.message_template || '',
        variables: template?.variables || [],
        is_active: template?.is_active ?? true,
    });

    const [newVariable, setNewVariable] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleAddVariable = () => {
        if (
            newVariable.trim() &&
            !formData.variables.includes(newVariable.trim())
        ) {
            setFormData((prev) => ({
                ...prev,
                variables: [...prev.variables, newVariable.trim()],
            }));
            setNewVariable('');
        }
    };

    const handleRemoveVariable = (variable: string) => {
        setFormData((prev) => ({
            ...prev,
            variables: prev.variables.filter((v) => v !== variable),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            variables:
                formData.variables.length > 0 ? formData.variables : null,
        };

        if (template) {
            router.put(
                route('admin.notification-templates.update', template.id),
                submitData,
                {
                    onError: (errors) => setErrors(errors),
                },
            );
        } else {
            router.post(
                route('admin.notification-templates.store'),
                submitData,
                {
                    onError: (errors) => setErrors(errors),
                },
            );
        }
    };

    const availableVariables = [
        'ticket_number',
        'subject',
        'requester_name',
        'assigned_agent_name',
        'updated_by_name',
        'resolved_by_name',
        'closed_by_name',
        'team_name',
        'breach_type',
    ];

    return (
        <AppLayout>
            <Head
                title={
                    template
                        ? 'Edit Notification Template'
                        : 'Create Notification Template'
                }
            />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link
                            href={route('admin.notification-templates.index')}
                        >
                            <IconArrowLeft className="mr-2 h-4 w-4" />
                            Back to Templates
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {template ? 'Edit Template' : 'Create Template'}
                        </h1>
                        <p className="text-muted-foreground">
                            {template
                                ? 'Update the notification template'
                                : 'Create a new notification template'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., Default Ticket Created"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type">Notification Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) =>
                                        handleInputChange('type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select notification type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, (l) =>
                                                        l.toUpperCase(),
                                                    )}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <p className="text-sm text-destructive">
                                        {errors.type}
                                    </p>
                                )}
                            </div>

                            {/* Subject Template */}
                            <div className="space-y-2">
                                <Label htmlFor="subject_template">
                                    Subject Template
                                </Label>
                                <Input
                                    id="subject_template"
                                    value={formData.subject_template}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'subject_template',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., New Ticket: {{ticket_number}} - {{subject}}"
                                />
                                {errors.subject_template && (
                                    <p className="text-sm text-destructive">
                                        {errors.subject_template}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Use {'{{variable}}'} syntax for dynamic
                                    content
                                </p>
                            </div>

                            {/* Message Template */}
                            <div className="space-y-2">
                                <Label htmlFor="message_template">
                                    Message Template
                                </Label>
                                <Textarea
                                    id="message_template"
                                    value={formData.message_template}
                                    onChange={(e) =>
                                        handleInputChange(
                                            'message_template',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="e.g., A new ticket has been created: {{ticket_number}} - {{subject}}"
                                    rows={4}
                                />
                                {errors.message_template && (
                                    <p className="text-sm text-destructive">
                                        {errors.message_template}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Use {'{{variable}}'} syntax for dynamic
                                    content
                                </p>
                            </div>

                            {/* Variables */}
                            <div className="space-y-2">
                                <Label>Available Variables</Label>
                                <div className="flex flex-wrap gap-2">
                                    {availableVariables.map((variable) => (
                                        <Badge
                                            key={variable}
                                            variant={
                                                formData.variables.includes(
                                                    variable,
                                                )
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="cursor-pointer"
                                            onClick={() => {
                                                if (
                                                    formData.variables.includes(
                                                        variable,
                                                    )
                                                ) {
                                                    handleRemoveVariable(
                                                        variable,
                                                    );
                                                } else {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        variables: [
                                                            ...prev.variables,
                                                            variable,
                                                        ],
                                                    }));
                                                }
                                            }}
                                        >
                                            {variable}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add custom variable"
                                        value={newVariable}
                                        onChange={(e) =>
                                            setNewVariable(e.target.value)
                                        }
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddVariable();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddVariable}
                                        variant="outline"
                                    >
                                        Add
                                    </Button>
                                </div>
                                {formData.variables.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.variables.map((variable) => (
                                            <Badge
                                                key={variable}
                                                variant="secondary"
                                            >
                                                {variable}
                                                <button
                                                    type="button"
                                                    className="ml-1 text-xs hover:text-destructive"
                                                    onClick={() =>
                                                        handleRemoveVariable(
                                                            variable,
                                                        )
                                                    }
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Is Active */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked: boolean) =>
                                        handleInputChange('is_active', checked)
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link
                                href={route(
                                    'admin.notification-templates.index',
                                )}
                            >
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit">
                            <IconCheck className="mr-2 h-4 w-4" />
                            {template ? 'Update Template' : 'Create Template'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
