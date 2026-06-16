// ─── Breadcrumb route map ─────────────────────────────────────────────────────
// Drives the dynamic breadcrumb in the site header. Every admin & user route has
// an explicit trail so the header always reflects the real page hierarchy.
//
//   • Parent crumbs carry a `to` (clickable). `:param` placeholders inside `to`
//     are resolved from the matched URL params at runtime.
//   • The leaf crumb (current page) has no `to` and is rendered as plain text.
//   • A "Home" crumb (→ role dashboard) is prepended automatically by the header.
//
// Detail pages may replace the leaf label with a live entity name via
// `useDynamicBreadcrumb()` (see src/context/breadcrumb.tsx).

import { matchPath } from "react-router-dom"

export interface Crumb {
  label: string
  to?: string
}

interface RouteEntry {
  pattern: string
  trail: Crumb[]
}

// ── Admin ─────────────────────────────────────────────────────────────────────

const ADMIN: RouteEntry[] = [
  { pattern: "/admin", trail: [{ label: "Dashboard" }] },

  // User Management
  { pattern: "/admin/user-management/users", trail: [{ label: "User Management" }, { label: "Users" }] },
  { pattern: "/admin/user-management/users/create", trail: [{ label: "User Management" }, { label: "Users", to: "/admin/user-management/users" }, { label: "Create User" }] },
  { pattern: "/admin/user-management/users/edit/:id", trail: [{ label: "User Management" }, { label: "Users", to: "/admin/user-management/users" }, { label: "Edit User" }] },
  { pattern: "/admin/user-management/users/:id", trail: [{ label: "User Management" }, { label: "Users", to: "/admin/user-management/users" }, { label: "User Details" }] },
  { pattern: "/admin/user-management/departments", trail: [{ label: "User Management" }, { label: "Departments" }] },

  // Course Management
  { pattern: "/admin/course-management/live-courses", trail: [{ label: "Course Management" }, { label: "Live Courses" }] },
  { pattern: "/admin/course-management/live-courses/create", trail: [{ label: "Course Management" }, { label: "Live Courses", to: "/admin/course-management/live-courses" }, { label: "Create Course" }] },
  { pattern: "/admin/course-management/live-courses/edit/:id", trail: [{ label: "Course Management" }, { label: "Live Courses", to: "/admin/course-management/live-courses" }, { label: "Edit Course" }] },
  { pattern: "/admin/course-management/live-courses/:id", trail: [{ label: "Course Management" }, { label: "Live Courses", to: "/admin/course-management/live-courses" }, { label: "Course Details" }] },
  { pattern: "/admin/course-management/resend-links", trail: [{ label: "Course Management" }, { label: "Resend Links" }] },
  { pattern: "/admin/course-management/online-courses", trail: [{ label: "Course Management" }, { label: "Online Courses" }] },
  { pattern: "/admin/course-management/online-courses/assignments", trail: [{ label: "Course Management" }, { label: "Online Courses", to: "/admin/course-management/online-courses" }, { label: "Assignments" }] },
  { pattern: "/admin/course-management/online-courses/create", trail: [{ label: "Course Management" }, { label: "Online Courses", to: "/admin/course-management/online-courses" }, { label: "Create Course" }] },
  { pattern: "/admin/course-management/online-courses/edit/:id", trail: [{ label: "Course Management" }, { label: "Online Courses", to: "/admin/course-management/online-courses" }, { label: "Edit Course" }] },
  { pattern: "/admin/course-management/online-courses/:id", trail: [{ label: "Course Management" }, { label: "Online Courses", to: "/admin/course-management/online-courses" }, { label: "Course Details" }] },
  { pattern: "/admin/course-management/attendance", trail: [{ label: "Course Management" }, { label: "Attendance" }] },

  // Report Management
  { pattern: "/admin/report-management/live-courses", trail: [{ label: "Reports" }, { label: "Live Courses" }] },
  { pattern: "/admin/report-management/online-courses", trail: [{ label: "Reports" }, { label: "Online Courses" }] },
  { pattern: "/admin/report-management/kpis", trail: [{ label: "Reports" }, { label: "KPIs" }] },
  { pattern: "/admin/report-management/quiz", trail: [{ label: "Reports" }, { label: "Quiz Report" }] },
  { pattern: "/admin/report-management/refresh", trail: [{ label: "Reports" }, { label: "Refresh Operations" }] },

  // Evaluation Management
  { pattern: "/admin/evaluation-management/user-evaluation", trail: [{ label: "Evaluations" }, { label: "User Evaluation" }] },
  { pattern: "/admin/evaluation-management/configurations", trail: [{ label: "Evaluations" }, { label: "Configurations" }] },
  { pattern: "/admin/evaluation-management/notifications", trail: [{ label: "Evaluations" }, { label: "Notifications" }] },
  { pattern: "/admin/evaluation-management/history", trail: [{ label: "Evaluations" }, { label: "History" }] },

  // Audio Management
  { pattern: "/admin/audio-management/audio", trail: [{ label: "Audio" }, { label: "Audio Library" }] },
  { pattern: "/admin/audio-management/audio/create", trail: [{ label: "Audio" }, { label: "Audio Library", to: "/admin/audio-management/audio" }, { label: "Create Audio" }] },
  { pattern: "/admin/audio-management/audio/view/:id", trail: [{ label: "Audio" }, { label: "Audio Library", to: "/admin/audio-management/audio" }, { label: "Audio Details" }] },
  { pattern: "/admin/audio-management/audio/edit/:id", trail: [{ label: "Audio" }, { label: "Audio Library", to: "/admin/audio-management/audio" }, { label: "Edit Audio" }] },
  { pattern: "/admin/audio-management/assignments", trail: [{ label: "Audio" }, { label: "Assignments" }] },
  { pattern: "/admin/audio-management/categories", trail: [{ label: "Audio" }, { label: "Categories" }] },

  // Video Management
  { pattern: "/admin/video-management/video", trail: [{ label: "Video" }, { label: "Video Library" }] },
  { pattern: "/admin/video-management/video/create", trail: [{ label: "Video" }, { label: "Video Library", to: "/admin/video-management/video" }, { label: "Create Video" }] },
  { pattern: "/admin/video-management/video/:id", trail: [{ label: "Video" }, { label: "Video Library", to: "/admin/video-management/video" }, { label: "Video Details" }] },
  { pattern: "/admin/video-management/categories", trail: [{ label: "Video" }, { label: "Categories" }] },

  // Blog Management
  { pattern: "/admin/blog-management/blog", trail: [{ label: "Blog" }, { label: "Posts" }] },
  { pattern: "/admin/blog-management/blog/create", trail: [{ label: "Blog" }, { label: "Posts", to: "/admin/blog-management/blog" }, { label: "Create Post" }] },
  { pattern: "/admin/blog-management/blog/edit/:id", trail: [{ label: "Blog" }, { label: "Posts", to: "/admin/blog-management/blog" }, { label: "Edit Post" }] },
  { pattern: "/admin/blog-management/blog/:id", trail: [{ label: "Blog" }, { label: "Posts", to: "/admin/blog-management/blog" }, { label: "Post Details" }] },

  // Quiz Management
  { pattern: "/admin/quiz-management/list-quizzes", trail: [{ label: "Quiz Management" }, { label: "Quizzes" }] },
  { pattern: "/admin/quiz-management/quizzes/create", trail: [{ label: "Quiz Management" }, { label: "Quizzes", to: "/admin/quiz-management/list-quizzes" }, { label: "Create Quiz" }] },
  { pattern: "/admin/quiz-management/quizzes/:id/edit", trail: [{ label: "Quiz Management" }, { label: "Quizzes", to: "/admin/quiz-management/list-quizzes" }, { label: "Quiz Details", to: "/admin/quiz-management/quizzes/:id" }, { label: "Edit" }] },
  { pattern: "/admin/quiz-management/quizzes/:id/attempts/:attemptId", trail: [{ label: "Quiz Management" }, { label: "Quizzes", to: "/admin/quiz-management/list-quizzes" }, { label: "Quiz Details", to: "/admin/quiz-management/quizzes/:id" }, { label: "Attempt" }] },
  { pattern: "/admin/quiz-management/quizzes/:id", trail: [{ label: "Quiz Management" }, { label: "Quizzes", to: "/admin/quiz-management/list-quizzes" }, { label: "Quiz Details" }] },
  { pattern: "/admin/quiz-management/assignments", trail: [{ label: "Quiz Management" }, { label: "Assignments" }] },
  { pattern: "/admin/quiz-management/quiz-assignments", trail: [{ label: "Quiz Management" }, { label: "Assignments" }] },
  { pattern: "/admin/quiz-management/assignments/list", trail: [{ label: "Quiz Management" }, { label: "Assignments" }] },

  // Support
  { pattern: "/admin/feedback", trail: [{ label: "Feedback" }] },
  { pattern: "/admin/bug-reports", trail: [{ label: "Bug Reports" }] },
]

// ── User ────────────────────────────────────────────────────────────────────

const USER: RouteEntry[] = [
  { pattern: "/user", trail: [{ label: "Dashboard" }] },

  { pattern: "/user/courses", trail: [{ label: "My Courses" }] },
  { pattern: "/user/courses/:id", trail: [{ label: "My Courses", to: "/user/courses" }, { label: "Course Details" }] },

  { pattern: "/user/progress", trail: [{ label: "My Progress" }] },
  { pattern: "/user/schedule", trail: [{ label: "My Schedule" }] },

  { pattern: "/user/audio", trail: [{ label: "My Audio" }] },
  { pattern: "/user/audio/:id", trail: [{ label: "My Audio", to: "/user/audio" }, { label: "Audio Details" }] },

  { pattern: "/user/clocking", trail: [{ label: "My Attendance" }] },
  { pattern: "/user/evaluations", trail: [{ label: "My Evaluations" }] },
  { pattern: "/user/feedback", trail: [{ label: "My Feedback" }] },

  { pattern: "/user/blog", trail: [{ label: "Blog" }] },
  { pattern: "/user/blog/:slug", trail: [{ label: "Blog", to: "/user/blog" }, { label: "Article" }] },

  { pattern: "/user/quizzes", trail: [{ label: "My Quizzes" }] },
  { pattern: "/user/quizzes/:id/take/:attemptId", trail: [{ label: "My Quizzes", to: "/user/quizzes" }, { label: "Quiz Details", to: "/user/quizzes/:id" }, { label: "Take Quiz" }] },
  { pattern: "/user/quizzes/:id/result/:attemptId", trail: [{ label: "My Quizzes", to: "/user/quizzes" }, { label: "Quiz Details", to: "/user/quizzes/:id" }, { label: "Results" }] },
  { pattern: "/user/quizzes/:id", trail: [{ label: "My Quizzes", to: "/user/quizzes" }, { label: "Quiz Details" }] },

  { pattern: "/user/online-courses", trail: [{ label: "My Online Courses" }] },
  { pattern: "/user/online-courses/:courseId/content/:contentId", trail: [{ label: "My Online Courses", to: "/user/online-courses" }, { label: "Course Details", to: "/user/online-courses/:courseId" }, { label: "Content" }] },
  { pattern: "/user/online-courses/:id", trail: [{ label: "My Online Courses", to: "/user/online-courses" }, { label: "Course Details" }] },
]

const ROUTES: RouteEntry[] = [...ADMIN, ...USER]

function countParams(pattern: string): number {
  return (pattern.match(/:/g) ?? []).length
}

function substitute(to: string, params: Readonly<Record<string, string | undefined>>): string {
  return to.replace(/:([A-Za-z0-9_]+)/g, (_m, key: string) => params[key] ?? `:${key}`)
}

/**
 * Resolve the breadcrumb trail for a pathname. Returns the trail WITHOUT the
 * leading "Home" crumb (the header prepends it). When nothing matches, returns
 * a single "best-effort" leaf from the last path segment.
 */
export function getBreadcrumbs(pathname: string): Crumb[] {
  let best: { entry: RouteEntry; params: Readonly<Record<string, string | undefined>> } | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const entry of ROUTES) {
    const m = matchPath({ path: entry.pattern, end: true }, pathname)
    if (m) {
      const score = countParams(entry.pattern)
      if (score < bestScore) {
        best = { entry, params: m.params }
        bestScore = score
      }
    }
  }

  if (!best) {
    const seg = pathname.split("/").filter(Boolean).pop()
    if (!seg) return []
    const label = seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    return [{ label }]
  }

  return best.entry.trail.map((c) => ({
    label: c.label,
    to: c.to ? substitute(c.to, best!.params) : undefined,
  }))
}

/** The role-aware dashboard target used for the leading "Home" crumb. */
export function homeCrumb(pathname: string): Crumb {
  if (pathname.startsWith("/admin")) return { label: "Home", to: "/admin" }
  return { label: "Home", to: "/user" }
}
