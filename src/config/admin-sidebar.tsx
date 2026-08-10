import * as React from "react"
import {
  UsersIcon,
  BookOpenIcon,
  BarChart2Icon,
  ClipboardListIcon,
  HeadphonesIcon,
  VideoIcon,
  NewspaperIcon,
  MessageSquareIcon,
  BugIcon,
  FileTextIcon,
} from "lucide-react"

export type SidebarSubItem = {
  title: string
  url: string
}

export type SidebarNavItem = {
  title: string
  url: string
  icon: React.ReactNode
  items?: SidebarSubItem[]
}

export type SidebarNavGroup = {
  items: SidebarNavItem[]
}

export type AdminSidebarConfig = {
  groups: SidebarNavGroup[]
}

export const adminSidebarConfig: AdminSidebarConfig = {
  groups: [
    {
      items: [
        {
          title: "User Management",
          url: "/admin/user-management",
          icon: <UsersIcon />,
          items: [
            { title: "Users", url: "/admin/user-management/users" },
            { title: "Department Management", url: "/admin/user-management/departments" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Course Management",
          url: "/admin/course-management",
          icon: <BookOpenIcon />,
          items: [
            { title: "Live Courses", url: "/admin/course-management/live-courses" },
            { title: "Online Courses", url: "/admin/course-management/online-courses" },
            { title: "Attendance", url: "/admin/course-management/attendance" },
            { title: "Resend Login Links", url: "/admin/course-management/resend-links" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Quiz Management",
          url: "/admin/quiz-management",
          icon: <FileTextIcon />,
          items: [
            { title: "Quizzes", url: "/admin/quiz-management/list-quizzes" },
            { title: "Quiz Assignments", url: "/admin/quiz-management/assignments" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Report Management",
          url: "/admin/report-management",
          icon: <BarChart2Icon />,
          items: [
            { title: "KPIs", url: "/admin/report-management/kpis" },
            { title: "Online Courses", url: "/admin/report-management/online-courses" },
            { title: "Live Courses", url: "/admin/report-management/live-courses" },
            { title: "Quiz", url: "/admin/report-management/quiz" },
            { title: "Refresh Operations", url: "/admin/report-management/refresh" },
            { title: "Attention Score Settings", url: "/admin/report-management/attention-score" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Evaluation Management",
          url: "/admin/evaluation-management",
          icon: <ClipboardListIcon />,
          items: [
            { title: "User Evaluation", url: "/admin/evaluation-management/user-evaluation" },
            { title: "Evaluation Configurations", url: "/admin/evaluation-management/configurations" },
            { title: "Evaluation Notifications", url: "/admin/evaluation-management/notifications" },
            { title: "Evaluation History", url: "/admin/evaluation-management/history" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Audio Management",
          url: "/admin/audio-management",
          icon: <HeadphonesIcon />,
          items: [
            { title: "Audio Management", url: "/admin/audio-management/audio" },
            { title: "Audio Assignments", url: "/admin/audio-management/assignments" },
            { title: "Audio Categories", url: "/admin/audio-management/categories" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Video Management",
          url: "/admin/video-management",
          icon: <VideoIcon />,
          items: [
            { title: "Video Management", url: "/admin/video-management/video" },
            { title: "Video Categories", url: "/admin/video-management/categories" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Blog Management",
          url: "/admin/blog-management",
          icon: <NewspaperIcon />,
          items: [
            { title: "Blog Management", url: "/admin/blog-management/blog" },
          ],
        },
      ],
    },
    {
      items: [
        {
          title: "Feedback",
          url: "/admin/feedback",
          icon: <MessageSquareIcon />,
        },
        {
          title: "Bug Reports",
          url: "/admin/bug-reports",
          icon: <BugIcon />,
        },
      ],
    },
  ],
}
