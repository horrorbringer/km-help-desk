import React from 'react';
import { Link, usePage } from '@inertiajs/react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PageProps } from '@/types';

type ProjectStatus = 'planned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

interface Project {
    id: number;
    title: string;
    client_name?: string | null;
    location?: string | null;
    status: ProjectStatus;
    start_date?: string | null;
    end_date?: string | null;
}

interface ProjectsIndexProps extends PageProps {
    projects: {
        data: Project[];
        total: number;
        from: number | null;
        to: number | null;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: {
        q?: string;
    };
}

const statusColor = (status: ProjectStatus) => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-800';
        case 'in_progress':
            return 'bg-amber-100 text-amber-800';
        case 'planned':
            return 'bg-sky-100 text-sky-800';
        case 'on_hold':
            return 'bg-slate-100 text-slate-700';
        case 'cancelled':
            return 'bg-rose-100 text-rose-800';
        default:
            return 'bg-slate-100 text-slate-700';
    }
};

export default function ProjectsIndex() {
    const { projects, filters, flash } = usePage<ProjectsIndexProps>().props;

    return (
        <div className="min-h-screen bg-slate-100/80 py-8">
            <div className="mx-auto max-w-6xl px-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
                        <p className="text-sm text-slate-500">
                            Manage construction projects displayed on your KIM MEX website.
                        </p>
                    </div>

                    <Button asChild size="sm">
                        <Link href={route('admin.projects.create')}>
                            + New Project
                        </Link>
                    </Button>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}

                {/* Search */}
                <Card className="border-slate-200 p-3">
                    <form method="GET" className="flex gap-2">
                        <Input
                            name="q"
                            defaultValue={filters.q ?? ''}
                            placeholder="Search by title, client, or location..."
                        />
                        <Button type="submit" variant="outline" size="sm">
                            Search
                        </Button>
                    </form>
                </Card>

                {/* Table */}
                <Card className="overflow-hidden border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Client</th>
                                <th className="px-4 py-3 text-left">Location</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Start</th>
                                <th className="px-4 py-3 text-left">End</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {projects.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-8 text-center text-slate-400"
                                    >
                                        No projects found.
                                    </td>
                                </tr>
                            ) : (
                                projects.data.map((p) => (
                                    <tr key={p.id} className="border-t border-slate-100">
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {p.title}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {p.client_name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {p.location ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge className={statusColor(p.status)}>
                                                {p.status.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {p.start_date ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {p.end_date ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="xs"
                                                className="text-xs"
                                            >
                                                <Link href={route('admin.projects.edit', p.id)}>
                                                    Edit
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
