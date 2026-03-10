import * as React from 'react';
import { IconCirclePlusFilled, IconInnerShadowTop, IconMail } from '@tabler/icons-react';
import { Link, usePage } from '@inertiajs/react';

import { NavMain } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { SharedData } from '@/types';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import {
    navigationConfig,
    quickCreateConfig,
    processNavigation,
    type NavItem,
} from '@/config/navigation';

/**
 * App Sidebar Component
 * 
 * Now uses config-driven navigation!
 * To add new modules, edit: /config/navigation.ts
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { can } = usePermissions();
    const page = usePage<SharedData>();
    const pageProps = page.props as any;
    const { appName, appLogo } = page.props;
    const displayName = appName || 'Acme Inc.';

    // Get settings
    const enableAdvancedOptions = React.useMemo(() => {
        const value = pageProps.settings?.enable_advanced_options;
        if (value === undefined || value === null) return true;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            if (['1', 'true', 'yes', 'on'].includes(lowerValue)) return true;
            if (['0', 'false', 'no', 'off', ''].includes(lowerValue)) return false;
        }
        if (typeof value === 'number') return value !== 0;
        return true;
    }, [pageProps.settings?.enable_advanced_options]);

    // Get disabled modules from settings (if any)
    const disabledModules = React.useMemo(() => {
        const modules = pageProps.settings?.disabled_modules;
        if (Array.isArray(modules)) return modules;
        if (typeof modules === 'string') return modules.split(',').map((m: string) => m.trim());
        return [];
    }, [pageProps.settings?.disabled_modules]);

    // Process navigation items with permissions
    const navItems = React.useMemo(() => {
        return processNavigation(navigationConfig, {
            can,
            enableAdvancedOptions,
            disabledModules,
        });
    }, [can, enableAdvancedOptions, disabledModules]);

    // Check if quick create button should be shown
    const showQuickCreate = React.useMemo(() => {
        return (
            quickCreateConfig.enabled &&
            (!quickCreateConfig.permission || can(quickCreateConfig.permission))
        );
    }, [can]);

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5"
                        >
                            <Link href="/">
                                {appLogo ? (
                                    <div className="flex aspect-square size-6 items-center justify-center overflow-hidden rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                                        <img src={appLogo} alt={displayName} className="size-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="flex aspect-square size-6 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
                                        <IconInnerShadowTop className="size-4" />
                                    </div>
                                )}
                                <span className="text-base font-semibold truncate ml-2">
                                    {displayName}
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Quick Create Button */}
                {showQuickCreate && (
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem className="flex items-center gap-2">
                                    <SidebarMenuButton
                                        tooltip={quickCreateConfig.title}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                                        asChild
                                    >
                                        <Link href={route(quickCreateConfig.routeName)}>
                                            <IconCirclePlusFilled />
                                            <span>{quickCreateConfig.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    <Button
                                        size="icon"
                                        className="size-8 group-data-[collapsible=icon]:opacity-0"
                                        variant="outline"
                                    >
                                        <IconMail />
                                        <span className="sr-only">Inbox</span>
                                    </Button>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}

                {/* Main Navigation */}
                <NavMain items={navItems} />

                {/* Secondary Navigation (if any) */}
                {/* <NavSecondary items={[]} className="mt-auto" /> */}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
