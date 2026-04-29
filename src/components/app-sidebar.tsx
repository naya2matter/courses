import * as React from "react"
import faviconUrl from "@/assets/favicon.svg"
import {
  LayoutDashboardIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingCartIcon,
  PackageIcon,
  Settings2Icon,
  BookOpenIcon,
  CircleHelpIcon,
  MessageSquareIcon,
  
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  
} from "@/components/ui/sidebar"

/* --- Navigation data ---------------------------------------------------- */

const data = {
  user: {
    name: "Admin User",
    email: "admin@courses.dev",
    avatar: "",
  },

  navPlatform: [
    {
      title: "Dashboard",
      url: "#",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "#",
      icon: <ChartBarIcon />,
      items: [
        { title: "Overview",  url: "#" },
        { title: "Reports",   url: "#" },
        { title: "Real-time", url: "#" },
      ],
    },
    {
      title: "Users",
      url: "#",
      icon: <UsersIcon />,
      items: [
        { title: "All Users",   url: "#" },
        { title: "Roles",       url: "#" },
        { title: "Permissions", url: "#" },
      ],
    },
  ],

  navManagement: [
    {
      title: "Orders",
      url: "#",
      icon: <ShoppingCartIcon />,
      items: [
        { title: "All Orders", url: "#" },
        { title: "Pending",    url: "#" },
        { title: "Fulfilled",  url: "#" },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: <PackageIcon />,
    },
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
  ],

  navSecondary: [
    { title: "Documentation", url: "#", icon: <BookOpenIcon /> },
    { title: "Get Help",      url: "#", icon: <CircleHelpIcon /> },
    { title: "Feedback",      url: "#", icon: <MessageSquareIcon /> },
  ],
}

/* --- Component ----------------------------------------------------------- */

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-3">
          <a
            href="/"
            className="group w-full text-white flex flex-col items-center justify-center gap-2 no-underline hover:no-underline focus:outline-none focus:ring-0"
            aria-label="Home"
          >
            <div className="flex items-center justify-center rounded-md">
              <img
                src={faviconUrl}
                alt="The Development Zone"
                className="size-12 group-data-[collapsible=icon]:size-8 transition-all rounded-md object-contain"
              />
            </div>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-base whitespace-nowrap">The Development Zone</span>
            </div>
          </a>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navPlatform}   label="Platform"   />
        <NavMain items={data.navManagement} label="Management" />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
