import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    appName?: string;
    appLogo?: string;
    appIcon?: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
    telegramToken?: string | null;
    telegramBotUrl?: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    telegram_chat_id?: string | null;
    telegram_username?: string | null;
    [key: string]: unknown;
}

// Generic page props type for Inertia pages
export type PageProps<T = Record<string, unknown>> = SharedData & {
    errors: Record<string, string>;
} & T;

// Global declarations for Ziggy and permissions
declare global {
    /**
     * Ziggy route helper
     */
    function route(name?: string, params?: any, absolute?: boolean, config?: any): any;
    
    /**
     * Laravel permission helper (provided by HandleInertiaRequests middleware)
     */
    function can(permission: string): boolean;
}

export {};
