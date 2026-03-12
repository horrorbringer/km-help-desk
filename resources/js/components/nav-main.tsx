import { IconChevronRight } from '@tabler/icons-react';
import { Link, usePage } from '@inertiajs/react';
import * as React from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/navigation';

interface NavMainProps {
  items: NavItem[];
}

/**
 * NavMain Component
 * 
 * Renders navigation items from the processed config.
 * All permission filtering is already handled by processNavigation().
 */
export function NavMain({ items }: NavMainProps) {
  const { url: currentUrl } = usePage();

  // Check if a URL is currently active
  const isActive = React.useCallback(
    (url?: string) => {
      if (!url || url === '#') return false;
      
      // Exact match
      if (currentUrl === url) return true;
      
      // If it's the root path or trailing slash variations
      if (currentUrl === url + '/' || currentUrl + '/' === url) return true;
      
      // For nested routes, ensure we're matching a full path segment
      // e.g., if url is "/admin/users", we want to match "/admin/users/1/edit" 
      // but NOT "/admin/user-roles"
      return currentUrl.startsWith(url + '/');
    },
    [currentUrl]
  );

  // Check if any child is active (for parent highlight)
  const hasActiveChild = React.useCallback(
    (item: NavItem): boolean => {
      if (!item.items) return false;
      return item.items.some(
        (child) => isActive(child.url) || hasActiveChild(child)
      );
    },
    [isActive]
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            // Has children - render as collapsible
            if (item.items && item.items.length > 0) {
              const isParentActive = hasActiveChild(item);

              return (
                <Collapsible
                  key={item.id}
                  asChild
                  defaultOpen={isParentActive}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        className={cn(
                          isParentActive &&
                          'bg-accent text-accent-foreground'
                        )}
                      >
                        {item.icon && <item.icon />}
                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem
                            key={subItem.id}
                          >
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive(
                                subItem.url
                              )}
                            >
                              <Link
                                href={
                                  subItem.url ||
                                  '#'
                                }
                              >
                                {subItem.icon && (
                                  <subItem.icon />
                                )}
                                <span>
                                  {
                                    subItem.title
                                  }
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                            {subItem.badge !==
                              undefined && (
                                <SidebarMenuBadge>
                                  {subItem.badge}
                                </SidebarMenuBadge>
                              )}
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            // No children - render as single item
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={isActive(item.url)}
                >
                  <Link href={item.url || '#'}>
                    {item.icon && <item.icon />}
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.badge !== undefined && (
                  <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
