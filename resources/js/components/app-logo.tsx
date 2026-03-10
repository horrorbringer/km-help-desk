import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { appName, appLogo } = usePage<SharedData>().props;
    const displayName = appName || 'Laravel Starter Kit';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                {appLogo ? (
                    <img src={appLogo} alt={displayName} className="size-full object-cover" />
                ) : (
                    <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                )}
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {displayName}
                </span>
            </div>
        </>
    );
}
