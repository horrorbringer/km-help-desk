import * as React from "react"
import {
  IconBell,
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconMail,
  IconReport,
  IconSearch,
  IconSettings,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { usePermissions } from "@/hooks/use-permissions"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url?: string
  icon?: React.ComponentType<{ className?: string }>
  items?: NavItem[]
  permission?: string
  permissions?: string[]
}

const getNavMain = (can: (permission: string) => boolean) => [
  {
    title: "Dashboard",
    url: route("dashboard"),
    icon: IconDashboard,
  },
  {
    title: "Tickets",
    url: route("admin.tickets.index"),
    icon: IconTicket,
    permission: "tickets.view",
  },
  {
    title: "Ticket Templates",
    url: route("admin.ticket-templates.index"),
    icon: IconFileWord,
    permission: "ticket-templates.view",
  },
  {
    title: "Management",
    icon: IconUsers,
    items: [
      {
        title: "Users",
        url: route("admin.users.index"),
        icon: IconUsers,
        permission: "users.view",
      },
      {
        title: "Roles & Permissions",
        url: route("admin.roles.index"),
        icon: IconUsers,
        permission: "roles.view",
      },
      {
        title: "Departments",
        url: route("admin.departments.index"),
        icon: IconFolder,
        permission: "departments.view",
      },
      {
        title: "Projects",
        url: route("admin.projects.index"),
        icon: IconFolder,
        permission: "projects.view",
      },
    ],
  },
  {
    title: "Configuration",
    icon: IconSettings,
    items: [
      {
        title: "Categories",
        url: route("admin.categories.index"),
        icon: IconFileDescription,
        permission: "categories.view",
      },
      {
        title: "Tags",
        url: route("admin.tags.index"),
        icon: IconSearch,
        permission: "tags.view",
      },
      {
        title: "SLA Policies",
        url: route("admin.sla-policies.index"),
        icon: IconReport,
        permission: "sla-policies.view",
      },
      {
        title: "Canned Responses",
        url: route("admin.canned-responses.index"),
        icon: IconMail,
        permission: "canned-responses.view",
      },
      {
        title: "Email Templates",
        url: route("admin.email-templates.index"),
        icon: IconMail,
        permission: "email-templates.view",
      },
      {
        title: "Automation Rules",
        url: route("admin.automation-rules.index"),
        icon: IconSettings,
        permission: "automation-rules.view",
      },
      {
        title: "Escalation Rules",
        url: route("admin.escalation-rules.index"),
        icon: IconReport,
        permission: "escalation-rules.view",
      },
      {
        title: "Custom Fields",
        url: route("admin.custom-fields.index"),
        icon: IconFileDescription,
        permission: "custom-fields.view",
      },
    ],
  },
  {
    title: "Content",
    icon: IconHelp,
    items: [
      {
        title: "Knowledge Base",
        url: route("admin.knowledge-base.index"),
        icon: IconHelp,
        permission: "knowledge-base.view",
      },
    ],
  },
  {
    title: "Analytics",
    icon: IconChartBar,
    items: [
      {
        title: "Reports",
        url: route("admin.reports.index"),
        icon: IconReport,
        permission: "reports.view",
      },
      {
        title: "Time Entries",
        url: route("admin.time-entries.index"),
        icon: IconChartBar,
        permission: "time-entries.view",
      },
      {
        title: "Notifications",
        url: route("admin.notifications.index"),
        icon: IconBell,
        // Notifications are accessible to all authenticated users
      },
    ],
  },
].filter((item) => {
  // Filter items based on permissions
  if (item.permission && !can(item.permission)) {
    return false;
  }
  
  // Filter nested items
  if (item.items) {
    item.items = item.items.filter((subItem) => {
      if (subItem.permission && !can(subItem.permission)) {
        return false;
      }
      return true;
    });
    
    // Hide parent if no children remain
    if (item.items.length === 0) {
      return false;
    }
  }
  
  return true;
}) as NavItem[];

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: route("admin.settings.index"),
      icon: IconSettings,
    },
    // {
    //   title: "Get Help",
    //   url: "#",
    //   icon: IconHelp,
    // },
    // {
    //   title: "Search",
    //   url: "#",
    //   icon: IconSearch,
    // },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { can } = usePermissions();
  
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getNavMain(can)} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
