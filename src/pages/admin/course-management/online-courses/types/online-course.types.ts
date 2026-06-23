// ─── Online Course Types ───────────────────────────────────────────────────────
// Central TypeScript shapes for the Admin Online Courses feature.

// ── Enum-like literals ────────────────────────────────────────────────────────

export type OnlineCourseStatus = "draft" | "published" | "archived"
export type OnlineCourseLevel = "beginner" | "intermediate" | "advanced"

// ── Embedded references ───────────────────────────────────────────────────────

export interface UserRef {
  id: number
  name: string
}

export interface VideoRef {
  id: number
  name: string
  transcode_status: string
}

export interface PdfRef {
  file_path: string
  pdf_page_count: number | null
}

// ── Module content ────────────────────────────────────────────────────────────

export interface OnlineCourseContent {
  id: number
  module_id: number
  content_type: "video" | "pdf"
  title: string
  description: string | null
  order_number: number
  duration: number | null
  thumbnail_path: string | null
  is_required: boolean
  is_active: boolean
  attachment_path: string | null
  attachment_name: string | null
  attachment_extension: string | null
  video: VideoRef | null
  pdf: PdfRef | null
  created_at: string
  updated_at: string
}

// ── Module ────────────────────────────────────────────────────────────────────

export interface OnlineCourseModule {
  id: number
  course_online_id: number
  name: string
  description: string | null
  order_number: number
  estimated_duration: number | null
  has_quiz: boolean
  quiz_required: boolean
  contents: OnlineCourseContent[]
  quiz: unknown | null
  created_at: string
  updated_at: string
}

// ── Primary resource (list item) ──────────────────────────────────────────────

export interface OnlineCourse {
  id: number
  name: string
  description: string | null
  image_path: string | null
  level: OnlineCourseLevel | string | null
  estimated_duration: number | null
  status: OnlineCourseStatus
  is_active: boolean
  deadline: string | null
  enrollments_count?: number | null
  modules_count?: number | null
  creator: UserRef | null
  created_at: string
  updated_at: string
}

// ── Detail (full tree from getById) ──────────────────────────────────────────

export interface OnlineCourseDetail extends OnlineCourse {
  modules: OnlineCourseModule[]
}

// ── Summary cards from API ────────────────────────────────────────────────────

export interface OnlineCourseSummaryCard {
  key: string
  title: string
  value: number
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

// ── List response envelope ────────────────────────────────────────────────────

export interface OnlineCourseListResponse {
  data: OnlineCourse[]
  links: PaginationLinks
  meta: PaginationMeta
  cards: OnlineCourseSummaryCard[]
}

// ── Detail response envelope ──────────────────────────────────────────────────

export interface OnlineCourseDetailResponse {
  data: OnlineCourseDetail
}

// ── Filter params ─────────────────────────────────────────────────────────────

export interface OnlineCourseFilters {
  page?: number
  per_page?: number
  search?: string
  status?: OnlineCourseStatus
}

// ── Reorder modules ───────────────────────────────────────────────────────────

export interface ReorderModuleItem {
  module_id: number
  order_number: number
}

export interface ReorderModulesPayload {
  order: ReorderModuleItem[]
}

// ── Enrollment types ──────────────────────────────────────────────────────────

export type EnrollmentStatus = 'not_started' | 'in_progress' | 'completed'

export interface CourseEnrollment {
  user_id: number
  user_name: string
  user_email: string
  department: string | null
  assigned_at: string
  assigned_by: string | null
  status: EnrollmentStatus
  progress_percentage: number
  completed_content_items: number
  total_content_items: number
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
}

export interface EnrollmentFilters {
  search?: string
  status?: EnrollmentStatus | ''
  department_id?: number | null
  page?: number
  per_page?: number
}

export interface EnrollmentMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface EnrollmentListResponse {
  data: CourseEnrollment[]
  meta: EnrollmentMeta
  cards: OnlineCourseSummaryCard[]
}
