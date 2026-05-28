// ── Shared pagination shapes (mirrors Laravel ResourceCollection envelope) ──

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
  links: Array<{ url: string | null; label: string; active: boolean }>
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

// ── Validation error (Laravel 422) ──────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}

// ── Learning session types ──────────────────────────────────────────────────

export interface LearningSessionEvent {
  type: string
  at: number
  from?: number
  to?: number
  pct?: number
}

export interface PdfProgressPayload {
  content_id: number
  course_online_id: number
  current_page: number
  pages_viewed: number
  total_pages: number
}

export interface PdfProgressResponse {
  completion_percentage: number
  is_completed: boolean
}

export interface SessionMetrics {
  active_playback_time: number
  playback_position: number
  completion_percentage: number
  skip_count: number
  seek_count: number
  replay_count: number
  pause_count: number
  speed_changes: number
}

export interface SessionStartPayload {
  course_online_id: number
  content_id: number
  content_type: "video" | "pdf"
}

export interface SessionStartResponse {
  data: {
    session_id: number
    resume_position: number
    is_completed: boolean
  }
}

export interface SessionProgressPayload extends SessionMetrics {}

export interface SessionEndPayload extends SessionMetrics {
  wall_clock_time: number
  fullscreen_count?: number
  events_log?: LearningSessionEvent[]
}

export interface SessionEndResponse {
  data: {
    session_id: number
    attention_score: number
    content_completed: boolean
    course_progress_percentage: number
  }
}

// ── Progress sub-shapes ──────────────────────────────────────────────────────

/** Per-content-item progress returned inside the module tree. */
export interface UserContentProgress {
  playback_position: number
  completion_percentage: number
  is_completed: boolean
}

/** Course-level progress summary. */
export interface UserCourseProgress {
  progress_percentage: number
  status: "not_started" | "in_progress" | "completed"
  completed_content_items: number
  total_content_items: number
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
}

// ── Content item inside a module (detail view) ──────────────────────────────

export interface UserCourseContent {
  id: number
  title: string
  content_type: "video" | "pdf"
  duration_seconds: number
  order_number: number
  is_required: boolean
  is_unlocked: boolean
  progress: UserContentProgress | null
}

// ── Module inside the course detail ─────────────────────────────────────────

export interface UserCourseModule {
  id: number
  title: string
  description: string | null
  order_number: number
  has_quiz: boolean
  is_required: boolean
  is_unlocked: boolean
  is_completed: boolean
  quiz_status: string | null
  content: UserCourseContent[]
}

// ── Course list item (GET /user/online-courses/getAll) ──────────────────────

export interface UserOnlineCourse {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  total_modules: number
  total_content_items: number
  progress_percentage: number
  status: "not_started" | "in_progress" | "completed"
  completed_content_items: number
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  assigned_at: string | null
}

// ── Course detail (GET /user/online-courses/getById/{id}) ───────────────────

export interface UserOnlineCourseDetail {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  has_certificate: boolean
  progress: UserCourseProgress
  modules: UserCourseModule[]
}

// ── Media / content open response (GET /{courseId}/content/{contentId}) ─────

export interface ContentNavItem {
  id: number
  title: string
  content_type: "video" | "pdf"
}

export interface UserCourseMediaResponse {
  content_id: number
  content_type: "video" | "pdf"
  title: string
  duration_seconds: number
  media_url: string
  pdf_total_pages: number | null
  progress: UserContentProgress
  next_content: ContentNavItem | null
  prev_content: ContentNavItem | null
}

// ── Resume progress response (GET /progress/{contentId}/resume) ─────────────

export interface ResumeProgressResponse {
  playback_position: number
  completion_percentage: number
  is_completed: boolean
  last_accessed_at: string | null
}

// ── Query filters for the list endpoint ─────────────────────────────────────

export interface UserOnlineCourseFilters {
  status?: "not_started" | "in_progress" | "completed"
  search?: string
  per_page?: number
  page?: number
}

// ── API response wrappers ────────────────────────────────────────────────────

export interface UserOnlineCourseListResponse {
  data: UserOnlineCourse[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface UserOnlineCourseDetailResponse {
  data: UserOnlineCourseDetail
}

export interface UserCourseMediaApiResponse {
  data: UserCourseMediaResponse
}
