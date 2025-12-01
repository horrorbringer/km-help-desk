import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { useInitials } from '@/hooks/use-initials';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    user,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    user?: {
        name: string;
        email: string;
        avatar: string | null;
    };
}) {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Use user prop if available, otherwise fall back to auth.user
    const currentUser = user || auth.user;
    const avatarUrl = avatarPreview || currentUser.avatar || null;

    const form = useForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        avatar: null as File | null,
        remove_avatar: false,
    });
    
    const { data, setData, processing, recentlySuccessful, errors, reset } = form;

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveAvatar = () => {
        setData('avatar', null);
        setData('remove_avatar', true);
        setAvatarPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your profile information and avatar"
                    />

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.patch(route('profile.update'), {
                                preserveScroll: true,
                                forceFormData: true,
                                onSuccess: () => {
                                    reset('avatar');
                                    setAvatarPreview(null);
                                },
                            });
                        }}
                        className="space-y-6"
                    >
                        {(() => {
                            const isProcessing = processing;
                            const isRecentlySuccessful = recentlySuccessful;
                            const allErrors = errors;

                            return (
                                <>
                                    {/* Avatar Upload Section */}
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-center gap-4">
                                            <Avatar className="h-24 w-24">
                                                <AvatarImage src={avatarUrl || undefined} alt={currentUser.name} />
                                                <AvatarFallback className="text-lg">
                                                    {getInitials(currentUser.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Camera className="h-4 w-4 mr-2" />
                                                    {avatarUrl ? 'Change' : 'Upload'} Photo
                                                </Button>
                                                
                                                {avatarUrl && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleRemoveAvatar}
                                                    >
                                                        <X className="h-4 w-4 mr-2" />
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                            
                                            <p className="text-xs text-muted-foreground text-center max-w-xs">
                                                JPG, PNG or GIF. Max size 2MB
                                            </p>
                                        </div>
                                    </div>

                                    {allErrors.avatar && (
                                        <InputError message={allErrors.avatar} />
                                    )}

                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>

                                        <Input
                                            id="name"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={allErrors.name}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email address</Label>

                                        <Input
                                            id="email"
                                            type="email"
                                            className="mt-1 block w-full"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />

                                        <InputError
                                            className="mt-2"
                                            message={allErrors.email}
                                        />
                                    </div>

                                    {mustVerifyEmail &&
                                        auth.user.email_verified_at === null && (
                                            <div>
                                                <p className="-mt-4 text-sm text-muted-foreground">
                                                    Your email address is
                                                    unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                    >
                                                        Click here to resend the
                                                        verification email.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-medium text-green-600">
                                                        A new verification link has
                                                        been sent to your email
                                                        address.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                    <div className="flex items-center gap-4">
                                        <Button
                                            type="submit"
                                            disabled={isProcessing}
                                            data-test="update-profile-button"
                                        >
                                            {isProcessing ? 'Saving...' : 'Save'}
                                        </Button>

                                        <Transition
                                            show={isRecentlySuccessful}
                                            enter="transition ease-in-out"
                                            enterFrom="opacity-0"
                                            leave="transition ease-in-out"
                                            leaveTo="opacity-0"
                                        >
                                            <p className="text-sm text-neutral-600">
                                                Saved
                                            </p>
                                        </Transition>
                                    </div>
                                </>
                            );
                        })()}
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
