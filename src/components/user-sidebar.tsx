import * as React from "react"
import faviconUrl from "@/assets/favicon.svg"
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  TrendingUpIcon,
  CalendarIcon,
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
import { useAuth } from "@/context/auth"

const navLearning = [
  {
    title: "My Dashboard",
    url: "/user",
    icon: <LayoutDashboardIcon />,
    isActive: true,
  },
  {
    title: "My Courses",
    url: "/user/courses",
    icon: <BookOpenIcon />,
  },
  {
    title: "My Progress",
    url: "/user/progress",
    icon: <TrendingUpIcon />,
  },
  {
    title: "Schedule",
    url: "/user/schedule",
    icon: <CalendarIcon />,
  },
]

const navSecondary = [
  { title: "Get Help", url: "#", icon: <CircleHelpIcon /> },
  { title: "Feedback", url: "#", icon: <MessageSquareIcon /> },
]

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-3">
          <a
            href="/user"
            className="group flex w-full flex-col items-center justify-center gap-2 no-underline"
            aria-label="Home"
          >
            <div className="flex items-center justify-center rounded-md">
              <img
                src={faviconUrl}
                alt="The Development Zone"
                className="size-12 rounded-md object-contain transition-all group-data-[collapsible=icon]:size-8"
              />
            </div>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <span className="whitespace-nowrap text-base font-semibold text-white">
                My Learning
              </span>
            </div>
          </a>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navLearning} label="Learning" />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? "Learner",
            email: user?.email ?? "",
            avatar: user?.avatar ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
