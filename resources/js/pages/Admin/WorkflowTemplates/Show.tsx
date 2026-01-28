import { Head, Link } from '@inertiajs/react';
import { Network } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import WorkflowGraphEditor from '@/components/workflow/WorkflowGraphEditor';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface WorkflowTemplate {
    id: number;
    name: string;
    description?: string | null;
    category?: { id: number; name: string } | null;
    department?: { id: number; name: string } | null;
    workflow_steps: any[];
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

interface WorkflowTemplateShowProps extends PageProps {
    template: WorkflowTemplate;
    formOptions: any;
}

export default function WorkflowTemplateShow({
    template,
    formOptions,
}: WorkflowTemplateShowProps) {
    return (
        <AppLayout>
            <Head title={`Workflow Template: ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {template.name}
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Workflow Template Details
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline">
                            <Link
                                href={route('admin.workflow-templates.index')}
                            >
                                ← Back to List
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link
                                href={route(
                                    'admin.workflow-templates.edit',
                                    template.id,
                                )}
                            >
                                Edit Template
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Details Column */}
                    <div className="space-y-6 lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Template Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Status
                                    </h3>
                                    <div className="mt-1">
                                        <Badge
                                            variant={
                                                template.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {template.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Description
                                    </h3>
                                    <p className="mt-1 text-sm">
                                        {template.description ||
                                            'No description provided.'}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Category
                                    </h3>
                                    <p className="mt-1 text-sm">
                                        {template.category?.name ||
                                            'All Categories'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Department
                                    </h3>
                                    <p className="mt-1 text-sm">
                                        {template.department?.name ||
                                            'All Departments'}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground">
                                        Priority
                                    </h3>
                                    <p className="mt-1 text-sm">
                                        {template.priority}
                                    </p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground">
                                            Created
                                        </h3>
                                        <p className="mt-1 text-xs">
                                            {template.created_at}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground">
                                            Last Updated
                                        </h3>
                                        <p className="mt-1 text-xs">
                                            {template.updated_at}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Graph Column */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Network className="h-5 w-5" />
                                    <CardTitle>
                                        Workflow Visualization
                                    </CardTitle>
                                </div>
                                <CardDescription>
                                    Visual representation of the approval
                                    process.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <WorkflowGraphEditor
                                    steps={template.workflow_steps}
                                    onChange={() => {}}
                                    formOptions={formOptions}
                                    readOnly={true}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
