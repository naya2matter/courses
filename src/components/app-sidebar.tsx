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
import { useAuth } from "@/context/auth"

/* --- Navigation data ---------------------------------------------------- */

const data = {
  navPlatform: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Analytics",
      url: "/admin/analytics",
      icon: <ChartBarIcon />,
      items: [
        { title: "Overview",  url: "/admin/analytics" },
        { title: "Reports",   url: "/admin/analytics" },
        { title: "Real-time", url: "/admin/analytics" },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: <UsersIcon />,
      items: [
        { title: "All Users",   url: "/admin/users" },
        { title: "Roles",       url: "/admin/users" },
        { title: "Permissions", url: "/admin/users" },
      ],
    },
  ],

  navManagement: [
    {
      title: "Courses",
      url: "/admin/courses",
      icon: <BookOpenIcon />,
    },
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
    { title: "Settings", url: "/admin/settings", icon: <Settings2Icon /> },
  ],
}

/* --- Component ----------------------------------------------------------- */

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
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
        <NavUser user={{
          name: user?.name ?? "Admin User",
          email: user?.email ?? "admin@courses.dev",
          avatar: user?.avatar ?? "",
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}
