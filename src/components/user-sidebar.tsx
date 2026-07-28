import * as React from "react"
import { Link } from "react-router-dom"
import faviconUrl from "@/assets/favicon.svg"
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  ClockIcon,
  MessageSquareIcon,
  HeadphonesIcon,
  BookOpenCheckIcon,
  ClipboardListIcon,
  NewspaperIcon,
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
    title: "My Online Courses",
    url: "/user/online-courses",
    icon: <BookOpenIcon />,
  },
  {
    title: "My Attendance",
    url: "/user/clocking",
    icon: <ClockIcon />,
  },
  {
    title: "My Quiz",
    url: "/user/quizzes",
    icon: <BookOpenCheckIcon />,
  },
  {
    title: "My Audio",
    url: "/user/audio",
    icon: <HeadphonesIcon />,
  },
  {
    title: "My Evaluations",
    url: "/user/evaluations",
    icon: <ClipboardListIcon />,
  },
  {
    title: "Blog",
    url: "/user/blog",
    icon: <NewspaperIcon />,
  },
]

const navSecondary = [
  { title: "My Feedback", url: "/user/feedback", icon: <MessageSquareIcon /> },
]

export function UserSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-3">
          <Link
            to="/user"
            className="group flex w-full flex-col items-center justify-center gap-2 no-underline"
            aria-label="Home"
          >
            <div className="flex items-center justify-center rounded-md">
              <img
                src={faviconUrl}
                alt="The Development Zone"
                className="size-16 rounded-md object-contain transition-all group-data-[collapsible=icon]:size-8"
              />
            </div>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <span className="whitespace-nowrap text-base font-semibold text-white">
                My Learning
              </span>
            </div>
          </Link>
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
