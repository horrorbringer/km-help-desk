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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const getNavMain = () => [
  {
    title: "Dashboard",
    url: route("dashboard"),
    icon: IconDashboard,
  },
  {
    title: "Tickets",
    url: route("admin.tickets.index"),
    icon: IconTicket,
  },
  {
    title: "Ticket Templates",
    url: route("admin.ticket-templates.index"),
    icon: IconFileWord,
  },
  {
    title: "Management",
    icon: IconUsers,
    items: [
      {
        title: "Users",
        url: route("admin.users.index"),
        icon: IconUsers,
      },
      {
        title: "Departments",
        url: route("admin.departments.index"),
        icon: IconFolder,
      },
      {
        title: "Projects",
        url: route("admin.projects.index"),
        icon: IconFolder,
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
      },
      {
        title: "Tags",
        url: route("admin.tags.index"),
        icon: IconSearch,
      },
      {
        title: "SLA Policies",
        url: route("admin.sla-policies.index"),
        icon: IconReport,
      },
      {
        title: "Canned Responses",
        url: route("admin.canned-responses.index"),
        icon: IconMail,
      },
      {
        title: "Email Templates",
        url: route("admin.email-templates.index"),
        icon: IconMail,
      },
      {
        title: "Automation Rules",
        url: route("admin.automation-rules.index"),
        icon: IconSettings,
      },
      {
        title: "Custom Fields",
        url: route("admin.custom-fields.index"),
        icon: IconFileDescription,
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
      },
      {
        title: "Time Entries",
        url: route("admin.time-entries.index"),
        icon: IconChartBar,
      },
      {
        title: "Notifications",
        url: route("admin.notifications.index"),
        icon: IconBell,
      },
    ],
  },
];

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
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
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
        <NavMain items={getNavMain()} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
