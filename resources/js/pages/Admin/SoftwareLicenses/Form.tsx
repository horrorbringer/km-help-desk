import { Head, Link, useForm } from '@inertiajs/react';

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

interface User { id: number; name: string }
interface License {
    id: number;
    product_name: string;
    vendor?: string | null;
    license_key?: string | null;
    total_seats: number;
    assigned_seats: number;
    expires_at: string;
    renewal_owner_id?: number | null;
    assigned_user_id?: number | null;
    assigned_device?: string | null;
    notes?: string | null;
    is_active: boolean;
}
interface Props { license?: License | null; users: User[] }

export default function SoftwareLicenseForm({ license, users }: Props) {
    const editing = Boolean(license);
    const form = useForm({
        product_name: license?.product_name ?? '', vendor: license?.vendor ?? '', license_key: license?.license_key ?? '',
        total_seats: String(license?.total_seats ?? 1), assigned_seats: String(license?.assigned_seats ?? 0),
        expires_at: license?.expires_at ?? '', renewal_owner_id: license?.renewal_owner_id?.toString() ?? '__none',
        assigned_user_id: license?.assigned_user_id?.toString() ?? '__none', assigned_device: license?.assigned_device ?? '',
        notes: license?.notes ?? '', is_active: license?.is_active ?? true,
    });
    const { data, setData, post, put, processing, errors } = form;
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        const transform = (values: typeof data) => ({ ...values, total_seats: Number(values.total_seats), assigned_seats: Number(values.assigned_seats), renewal_owner_id: values.renewal_owner_id === '__none' ? null : Number(values.renewal_owner_id), assigned_user_id: values.assigned_user_id === '__none' ? null : Number(values.assigned_user_id) });
        form.transform(transform);
        if (editing) put(route('admin.software-licenses.update', license!.id)); else post(route('admin.software-licenses.store'));
    };
    const fieldError = (field: keyof typeof errors) => errors[field] && <p className="text-xs text-destructive">{errors[field]}</p>;
    return <AppLayout><Head title={editing ? 'Edit software license' : 'Add software license'} /><div className="mx-auto max-w-3xl space-y-4"><div><h1 className="text-2xl font-semibold">{editing ? 'Edit software license' : 'Add software license'}</h1><p className="text-sm text-muted-foreground">License keys are encrypted at rest and are only shown on this form.</p></div><form onSubmit={submit}><Card><CardHeader><CardTitle>License details</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="product_name">Product</Label><Input id="product_name" value={data.product_name} onChange={e => setData('product_name', e.target.value)} />{fieldError('product_name')}</div><div className="space-y-2"><Label htmlFor="vendor">Vendor</Label><Input id="vendor" value={data.vendor} onChange={e => setData('vendor', e.target.value)} />{fieldError('vendor')}</div><div className="space-y-2 md:col-span-2"><Label htmlFor="license_key">License key</Label><Input id="license_key" value={data.license_key} onChange={e => setData('license_key', e.target.value)} placeholder={editing ? 'Leave empty to keep the current key' : 'Optional'} />{fieldError('license_key')}</div><div className="space-y-2"><Label htmlFor="total_seats">Total seats</Label><Input id="total_seats" type="number" min="1" value={data.total_seats} onChange={e => setData('total_seats', e.target.value)} />{fieldError('total_seats')}</div><div className="space-y-2"><Label htmlFor="assigned_seats">Assigned seats</Label><Input id="assigned_seats" type="number" min="0" value={data.assigned_seats} onChange={e => setData('assigned_seats', e.target.value)} />{fieldError('assigned_seats')}</div><div className="space-y-2"><Label htmlFor="expires_at">Expiry date</Label><Input id="expires_at" type="date" value={data.expires_at} onChange={e => setData('expires_at', e.target.value)} />{fieldError('expires_at')}</div><div className="space-y-2"><Label>Renewal owner</Label><Select value={data.renewal_owner_id} onValueChange={value => setData('renewal_owner_id', value)}><SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger><SelectContent><SelectItem value="__none">No owner</SelectItem>{users.map(user => <SelectItem value={String(user.id)} key={user.id}>{user.name}</SelectItem>)}</SelectContent></Select>{fieldError('renewal_owner_id')}</div><div className="space-y-2"><Label>Assigned user</Label><Select value={data.assigned_user_id} onValueChange={value => setData('assigned_user_id', value)}><SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent><SelectItem value="__none">Unassigned</SelectItem>{users.map(user => <SelectItem value={String(user.id)} key={user.id}>{user.name}</SelectItem>)}</SelectContent></Select>{fieldError('assigned_user_id')}</div><div className="space-y-2"><Label htmlFor="assigned_device">Assigned device</Label><Input id="assigned_device" value={data.assigned_device} onChange={e => setData('assigned_device', e.target.value)} placeholder="e.g. DESKTOP-014" />{fieldError('assigned_device')}</div><div className="space-y-2 md:col-span-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={data.notes} onChange={e => setData('notes', e.target.value)} />{fieldError('notes')}</div><div className="flex items-center gap-2"><Checkbox id="is_active" checked={data.is_active} onCheckedChange={value => setData('is_active', Boolean(value))} /><Label htmlFor="is_active">Active license</Label></div><div className="flex justify-end gap-2 md:col-span-2"><Button asChild variant="outline"><Link href={route('admin.software-licenses.index')}>Cancel</Link></Button><Button disabled={processing} type="submit">{editing ? 'Save changes' : 'Add license'}</Button></div></CardContent></Card></form></div></AppLayout>;
}
