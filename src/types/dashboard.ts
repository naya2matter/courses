// ── Admin ──────────────────────────────────────────────────────────────────

export interface AdminDashboardData {
  admin: {
    id: number
    name: string
  }
  stats: {
    total_courses: number
    total_users: number
    active_sessions: number
    completion_rate: number
  }
  recent_activity: Array<{
    id: number
    user: string
    avatar: string | null
    action: string
    target: string | null
    time: string
  }>
  recent_enrollments: Array<{
    user: string
    course: string
    date: string
  }>
  top_courses: Array<{
    title: string
    enrollments: number
    completion_rate: number
  }>
}

// ── User ───────────────────────────────────────────────────────────────────

export interface CourseItem {
  id: number
  title: string
  instructor: string
  progress: number
  status: string
  duration: string
  image: string | null
  continue_url: string
}

export interface UserDashboardData {
  user: {
    id: number
    name: string
    avatar: string | null
  }
  summary: {
    in_progress_count: number
    upcoming_count: number
    completed_count: number
  }
  courses: {
    offline: CourseItem[]
    online: CourseItem[]
  }
  recent_attendance: Array<{
    id: number
    date: string
    course: string
    status: string
  }>
}
