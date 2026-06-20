import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useModulePermissions } from '@/hooks/use-module-permissions';
import AppLayout from '@/layouts/app-layout';
import type { PageProps } from '@/types';

interface License {
    id: number;
    product_name: string;
    vendor?: string | null;
    total_seats: number;
    assigned_seats: number;
    available_seats: number;
    expires_at: string;
    days_until_expiry: number;
    renewal_owner?: { id: number; name: string } | null;
    assigned_user?: { id: number; name: string } | null;
    assigned_device?: string | null;
    is_active: boolean;
}

interface Props {
    licenses: { data: License[]; total: number };
    filters: { q?: string; status?: string };
}

function expiryBadge(license: License) {
    if (license.days_until_expiry < 0) {
        return <Badge variant="destructive">Expired</Badge>;
    }

    if (license.days_until_expiry <= 30) {
        return <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">{license.days_until_expiry}d remaining</Badge>;
    }

    return <Badge variant="secondary">{license.days_until_expiry}d remaining</Badge>;
}

export default function SoftwareLicensesIndex() {
    const { licenses, filters } = usePage<PageProps<Props>>().props;
    const { canCreate, canEdit, canDelete } = useModulePermissions('software-licenses');
    const [query, setQuery] = useState(filters.q ?? '');

    const filter = (status: string) => {
        router.get(route('admin.software-licenses.index'), {
            ...(query ? { q: query } : {}),
            ...(status === '__all' ? {} : { status }),
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout>
            <Head title="Software Licenses" />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Software licenses</h1>
                        <p className="text-sm text-muted-foreground">Track expiry, ownership, and available seats.</p>
                    </div>
                    {canCreate && <Button asChild><Link href={route('admin.software-licenses.create')}><Plus /> Add license</Link></Button>}
                </div>

                <Card>
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
                        <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && filter(filters.status ?? '__all')} placeholder="Search product, vendor, or device" />
                        <Select value={filters.status ?? '__all'} onValueChange={filter}>
                            <SelectTrigger className="sm:w-48"><SelectValue placeholder="All licenses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all">All licenses</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="expiring">Expiring in 30 days</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                                    <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Seats</th><th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Renewal owner</th><th className="px-4 py-3">Assigned to</th><th className="px-4 py-3 text-right">Actions</th></tr>
                                </thead>
                                <tbody>
                                    {licenses.data.map((license) => <tr key={license.id} className="border-b last:border-0">
                                        <td className="px-4 py-3"><div className="font-medium">{license.product_name}</div><div className="text-xs text-muted-foreground">{license.vendor || 'No vendor recorded'}</div></td>
                                        <td className="px-4 py-3">{license.assigned_seats}/{license.total_seats}<div className="text-xs text-muted-foreground">{license.available_seats} available</div></td>
                                        <td className="px-4 py-3"><div>{license.expires_at}</div>{expiryBadge(license)}</td>
                                        <td className="px-4 py-3">{license.renewal_owner?.name ?? 'Unassigned'}</td>
                                        <td className="px-4 py-3"><div>{license.assigned_user?.name ?? 'Unassigned'}</div><div className="text-xs text-muted-foreground">{license.assigned_device}</div></td>
                                        <td className="px-4 py-3"><div className="flex justify-end gap-1">{canEdit && <Button asChild size="icon" variant="ghost"><Link href={route('admin.software-licenses.edit', license.id)} aria-label="Edit license"><Pencil /></Link></Button>}{canDelete && <Button size="icon" variant="ghost" onClick={() => confirm(`Remove ${license.product_name}?`) && router.delete(route('admin.software-licenses.destroy', license.id))} aria-label="Remove license"><Trash2 className="text-destructive" /></Button>}</div></td>
                                    </tr>)}
                                    {licenses.data.length === 0 && <tr><td className="px-4 py-12 text-center text-muted-foreground" colSpan={6}>No software licenses match these filters.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
