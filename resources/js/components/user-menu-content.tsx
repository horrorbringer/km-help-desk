import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings, User as UserIcon, Shield } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const { can } = usePermissions();

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        cleanup();
        router.post(logout(), {}, {
            onFinish: () => {
                router.flushAll();
            },
        });
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full"
                        href={edit()}
                        as="button"
                        prefetch
                        onClick={cleanup}
                    >
                        <UserIcon className="mr-2 h-4 w-4" />
                        Profile Settings
                    </Link>
                </DropdownMenuItem>
                {/* System Settings - Show for admins/managers */}
                {(can('settings.view') || can('users.view') || can('tickets.assign')) && (
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full"
                            href={route('admin.settings.index')}
                            as="button"
                            prefetch
                            onClick={cleanup}
                        >
                            <Shield className="mr-2 h-4 w-4" />
                            System Settings
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    type="button"
                    className="block w-full text-left"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </button>
            </DropdownMenuItem>
        </>
    );
}
