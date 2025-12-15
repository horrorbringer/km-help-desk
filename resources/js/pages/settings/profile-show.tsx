import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Edit, Mail, Phone, Building2, UserCheck, UserX, Calendar, Hash } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import type { PageProps } from '@/types';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  employee_id?: string | null;
  department?: { id: number; name: string } | null;
  roles?: Array<{ id: number; name: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileShowProps extends PageProps {
  user: User;
}

export default function ProfileShow({ user }: ProfileShowProps) {
  return (
    <AppLayout>
      <Head title="My Profile" />

      <SettingsLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} size="lg" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={edit()}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {/* User Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Basic user details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</label>
                      <p className="text-base font-medium mt-1">{user.name}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                      <p className="text-base mt-1 break-all">{user.email}</p>
                    </div>
                  </div>
                  
                  {user.employee_id && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Hash className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee ID</label>
                          <p className="text-base font-mono mt-1">{user.employee_id}</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {user.phone && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</label>
                          <p className="text-base mt-1">{user.phone}</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {user.is_active ? (
                        <UserCheck className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <UserX className="h-4 w-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                      <div className="mt-1">
                        <Badge
                          variant={user.is_active ? 'default' : 'secondary'}
                          className={cn(
                            user.is_active 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                          )}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Department and role assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                      <p className="text-base mt-1">
                        {user.department ? (
                          <Badge variant="outline" className="mt-1">
                            {user.department.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No department assigned</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Roles</label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No roles assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Account creation and update information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created At</label>
                    <p className="text-base mt-1">{new Date(user.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</label>
                    <p className="text-base mt-1">{new Date(user.updated_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
