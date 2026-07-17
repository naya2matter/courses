import * as React from "react"
import faviconUrl from "@/assets/favicon.svg"
import { LayoutDashboardIcon } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth"
import { adminSidebarConfig } from "@/config/admin-sidebar"

/* --- Dashboard nav item (always first) ---------------------------------- */

const dashboardItem = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: <LayoutDashboardIcon />,
  },
]

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
                className="size-16 group-data-[collapsible=icon]:size-8 transition-all rounded-md object-contain"
              />
            </div>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-base whitespace-nowrap">The Development Zone</span>
            </div>
          </a>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={dashboardItem} />
        {adminSidebarConfig.groups.map((group, index) => (
          <NavMain key={index} items={group.items} />
        ))}
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
