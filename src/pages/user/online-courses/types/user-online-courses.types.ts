// ─── User Online Course Types ─────────────────────────────────────────────────
// Mirrors the responses documented in the user-online-course API testing guide.

export type LearningStatus = "not_started" | "in_progress" | "completed"
export type ContentType = "video" | "pdf"

// ── List: GET /user/online-courses/getAll ─────────────────────────────────────

export interface OnlineCourseCard {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  total_modules: number
  total_content_items: number
  progress_percentage: number
  status: LearningStatus
  completed_content_items: number
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  assigned_at: string | null
}

export interface OnlineCourseListMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface OnlineCourseListResponse {
  data: OnlineCourseCard[]
  meta: OnlineCourseListMeta
  links?: unknown
}

// ── Detail: GET /user/online-courses/getById/{id} ─────────────────────────────

export interface ContentProgress {
  playback_position: number       // seconds (video) or page number (pdf)
  completion_percentage: number   // 0–100
  is_completed: boolean
}

export interface ModuleContent {
  id: number
  title: string
  content_type: ContentType
  duration_seconds: number
  order_number: number
  is_required: boolean
  is_unlocked: boolean
  progress: ContentProgress | null
}

export interface CourseModule {
  id: number
  title: string
  description: string | null
  order_number: number
  has_quiz: boolean
  quiz_id: number | null
  is_required: boolean
  is_unlocked: boolean
  is_completed: boolean
  quiz_status: string | null
  content: ModuleContent[]
}

export interface CourseProgressSummary {
  progress_percentage: number
  status: LearningStatus
  completed_content_items: number
  total_content_items: number
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
}

export interface OnlineCourseDetail {
  id: number
  title: string
  description: string | null
  thumbnail_url: string | null
  has_certificate: boolean
  progress: CourseProgressSummary
  modules: CourseModule[]
}

export interface OnlineCourseDetailResponse {
  data: OnlineCourseDetail
}

// ── Open content: GET /{courseId}/content/{contentId} ─────────────────────────

export interface ContentNavRef {
  id: number
  title: string
  content_type: ContentType
}

export interface VideoQuality {
  id: number
  quality: string      // "360p" | "720p" | "1080p"
  file_size: number    // bytes
  stream_url: string   // signed URL, valid 4 hours
}

export interface ContentViewerData {
  content_id: number
  content_type: ContentType
  title: string
  duration_seconds: number
  media_url: string               // signed URL — no auth header required
  qualities?: VideoQuality[]      // empty/absent = no quality variants
  subtitle_url?: string | null    // VTT public URL; null = no subtitle file
  pdf_total_pages: number | null
  attachment_path: string | null  // direct storage URL, no auth needed
  attachment_name: string | null
  progress: ContentProgress
  next_content: ContentNavRef | null
  prev_content: ContentNavRef | null
}

export interface ContentViewerResponse {
  data: ContentViewerData
}

// ── Resume: GET /progress/{contentId}/resume (flat, no wrapper) ───────────────

export interface ResumeResponse {
  playback_position: number
  completion_percentage: number
  is_completed: boolean
  last_accessed_at: string | null
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export interface SessionStartBody {
  course_online_id: number
  content_id: number
  content_type: ContentType
}

export interface SessionStartData {
  session_id: number
  resume_position: number
  is_completed: boolean
}

export interface SessionStartResponse {
  data: SessionStartData
}

export interface SessionProgressBody {
  active_playback_time: number    // cumulative active play seconds this session
  playback_position: number       // current seek position (s for video)
  completion_percentage: number   // 0–100, only ever increases server-side
  skip_count?: number
  seek_count?: number
  replay_count?: number
  pause_count?: number
  speed_changes?: number
}

export interface SessionEventLogEntry {
  type: string                    // "milestone" | "seek" | ...
  at: number                      // seconds into the session
  pct?: number
  from?: number
  to?: number
}

export interface SessionEndBody extends SessionProgressBody {
  wall_clock_time: number         // real elapsed seconds since session start
  fullscreen_count?: number
  events_log?: SessionEventLogEntry[]
}

export interface SessionEndData {
  session_id: number
  attention_score: number         // 0–100
  content_completed: boolean
  course_progress_percentage: number
}

export interface SessionEndResponse {
  data: SessionEndData
}

// ── PDF progress: POST /progress/pdf (flat, no wrapper) ───────────────────────

export interface PdfProgressBody {
  content_id: number
  course_online_id: number
  pages_viewed: number            // cumulative unique pages seen (never decreases)
  total_pages: number
  current_page: number            // resume position
}

export interface PdfProgressResponse {
  completion_percentage: number
  is_completed: boolean
}
