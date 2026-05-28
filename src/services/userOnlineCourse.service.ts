/**
 * userOnlineCourse.service.ts
 *
 * User-facing Online Courses API layer.
 *
 * Endpoints:
 *   GET /user/online-courses/getAll
 *   GET /user/online-courses/getById/{id}
 *   GET /user/online-courses/{courseId}/content/{contentId}
 *   GET /user/online-courses/progress/{contentId}/resume
 *
 * Access rules:
 *   - All endpoints require a valid Bearer token.
 *   - 403 means the course/content is not assigned to the user or the module is locked.
 *   - media_url returned by openCourseContent is signed and expires after 4 hours.
 *     Pass it directly to a video player or PDF viewer — no auth header is needed.
 */

import { apiClient } from "@/lib/api"
import type { ApiError } from "@/lib/api"
import type {
  SessionEndPayload,
  SessionEndResponse,
  PdfProgressPayload,
  PdfProgressResponse,
  SessionProgressPayload,
  SessionStartPayload,
  SessionStartResponse,
  ResumeProgressResponse,
  UserCourseMediaApiResponse,
  UserCourseMediaResponse,
  UserOnlineCourseDetail,
  UserOnlineCourseDetailResponse,
  UserOnlineCourseFilters,
  UserOnlineCourseListResponse,
} from "@/types/user-online-course"

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeResumeProgress(
  data: ResumeProgressResponse,
): ResumeProgressResponse {
  return {
    ...data,
    playback_position: toNumber(data.playback_position),
    completion_percentage: toNumber(data.completion_percentage),
  }
}

function normalizeCourseListResponse(
  response: UserOnlineCourseListResponse,
): UserOnlineCourseListResponse {
  return {
    ...response,
    data: response.data.map((course) => ({
      ...course,
      progress_percentage: toNumber(course.progress_percentage),
    })),
  }
}

function normalizeCourseDetail(
  course: UserOnlineCourseDetail,
): UserOnlineCourseDetail {
  return {
    ...course,
    progress: course.progress
      ? {
          ...course.progress,
          progress_percentage: toNumber(course.progress.progress_percentage),
        }
      : course.progress,
    modules: course.modules.map((module) => ({
      ...module,
      content: module.content.map((content) => ({
        ...content,
        duration_seconds: toNumber(content.duration_seconds),
        progress: content.progress
          ? {
              ...content.progress,
              playback_position: toNumber(content.progress.playback_position),
              completion_percentage: toNumber(content.progress.completion_percentage),
            }
          : content.progress,
      })),
    })),
  }
}

function normalizeMediaResponse(
  media: UserCourseMediaResponse,
): UserCourseMediaResponse {
  return {
    ...media,
    duration_seconds: toNumber(media.duration_seconds),
    pdf_total_pages: media.pdf_total_pages == null ? null : toNumber(media.pdf_total_pages),
    progress: {
      ...media.progress,
      playback_position: toNumber(media.progress.playback_position),
      completion_percentage: toNumber(media.progress.completion_percentage),
    },
  }
}

function normalizeSessionEndResponse(
  data: SessionEndResponse["data"],
): SessionEndResponse["data"] {
  return {
    ...data,
    attention_score: toNumber(data.attention_score),
    course_progress_percentage: toNumber(data.course_progress_percentage),
  }
}

function normalizePdfProgressResponse(
  data: PdfProgressResponse,
): PdfProgressResponse {
  return {
    ...data,
    completion_percentage: toNumber(data.completion_percentage),
  }
}

// ── Error helpers ─────────────────────────────────────────────────────────────

/**
 * Returns true if the error is a canceled / aborted fetch request.
 * Callers should silently ignore these — they result from navigating away.
 */
function isCanceledError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true
  if (err instanceof Error && err.name === "AbortError") return true
  return false
}

/**
 * Normalises any thrown value into a plain `Error`.
 * Re-throws canceled requests as-is so callers can still ignore them.
 */
function handleServiceError(err: unknown): never {
  if (isCanceledError(err)) throw err

  const apiErr = err as ApiError

  switch (apiErr?.status) {
    case 401:
      throw Object.assign(new Error("Unauthenticated. Please log in again."), {
        status: 401,
        data: apiErr.data,
      })
    case 403:
      throw Object.assign(
        new Error(
          "Access denied. This course or content is not assigned to you, or the module is locked.",
        ),
        { status: 403, data: apiErr.data },
      )
    case 404:
      throw Object.assign(new Error("The requested resource was not found."), {
        status: 404,
        data: apiErr.data,
      })
    case 422:
      throw Object.assign(
        new Error(apiErr.data?.message ?? "Validation failed."),
        { status: 422, data: apiErr.data },
      )
    default:
      if (!navigator.onLine) {
        throw Object.assign(new Error("No internet connection."), {
          status: 0,
          data: null,
        })
      }
      throw Object.assign(
        new Error(
          apiErr?.message ?? "An unexpected error occurred. Please try again.",
        ),
        { status: apiErr?.status ?? 0, data: apiErr?.data ?? null },
      )
  }
}

// ── Query-string builder ──────────────────────────────────────────────────────

function buildQuery(filters: UserOnlineCourseFilters): string {
  const params = new URLSearchParams()
  if (filters.status) params.set("status", filters.status)
  if (filters.search) params.set("search", filters.search)
  if (filters.per_page !== undefined)
    params.set("per_page", String(filters.per_page))
  if (filters.page !== undefined) params.set("page", String(filters.page))
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ── Service ───────────────────────────────────────────────────────────────────

export const userOnlineCourseService = {
  /**
   * GET /user/online-courses/getAll
   *
   * Returns all courses assigned to the authenticated user.
   * Supports optional filtering by status, search text, and pagination.
   */
  async getMyOnlineCourses(
    filters: UserOnlineCourseFilters = {},
  ): Promise<UserOnlineCourseListResponse> {
    try {
      const qs = buildQuery(filters)
      const response = await apiClient.get<UserOnlineCourseListResponse>(
        `/user/online-courses/getAll${qs}`,
      )
      return normalizeCourseListResponse(response)
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * GET /user/online-courses/getById/{id}
   *
   * Returns the full course detail including the module tree with per-content
   * progress and unlock state.
   *
   * Throws 403 if the user is not assigned to this course.
   */
  async getMyOnlineCourseById(id: number): Promise<UserOnlineCourseDetail> {
    try {
      const res = await apiClient.get<UserOnlineCourseDetailResponse>(
        `/user/online-courses/getById/${id}`,
      )
      return normalizeCourseDetail(res.data)
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * GET /user/online-courses/{courseId}/content/{contentId}
   *
   * Returns a time-limited signed `media_url` (valid 4 hours) for the video or
   * PDF file, along with per-content progress and prev/next navigation.
   *
   * The `media_url` can be passed directly to a video player or PDF viewer — no
   * Authorization header is needed on the media URL itself.
   *
   * Throws 403 if the course is not assigned or the module is locked.
   */
  async openCourseContent(
    courseId: number,
    contentId: number,
  ): Promise<UserCourseMediaResponse> {
    try {
      const res = await apiClient.get<UserCourseMediaApiResponse>(
        `/user/online-courses/${courseId}/content/${contentId}`,
      )
      return normalizeMediaResponse(res.data)
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * GET /user/online-courses/progress/{contentId}/resume
   *
   * Lightweight endpoint — returns the user's last playback position for a
   * content item before opening the player.
   *
   * `playback_position` for video: seconds from start.
   * `playback_position` for PDF: last page number viewed.
   */
  async getContentResumePosition(
    contentId: number,
  ): Promise<ResumeProgressResponse> {
    try {
      const response = await apiClient.get<ResumeProgressResponse>(
        `/user/online-courses/progress/${contentId}/resume`,
      )
      return normalizeResumeProgress(response)
    } catch (err) {
      return handleServiceError(err)
    }
  },

  async updatePdfProgress(
    payload: PdfProgressPayload,
  ): Promise<PdfProgressResponse> {
    try {
      const response = await apiClient.post<PdfProgressResponse>(
        "/user/online-courses/progress/pdf",
        payload,
      )
      return normalizePdfProgressResponse(response)
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * POST /user/online-courses/sessions/start
   *
   * Creates or resumes a learning session for a content item.
   */
  async startLearningSession(
    payload: SessionStartPayload,
  ): Promise<SessionStartResponse["data"]> {
    try {
      const res = await apiClient.post<SessionStartResponse>(
        "/user/online-courses/sessions/start",
        payload,
      )
      return res.data
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * POST /user/online-courses/sessions/{sessionId}/progress
   *
   * Sends lightweight in-session metrics. Does not mark completion.
   */
  async sendSessionProgress(
    sessionId: number,
    payload: SessionProgressPayload,
  ): Promise<{ ok: boolean }> {
    try {
      return await apiClient.post<{ ok: boolean }>(
        `/user/online-courses/sessions/${sessionId}/progress`,
        payload,
      )
    } catch (err) {
      return handleServiceError(err)
    }
  },

  /**
   * POST /user/online-courses/sessions/{sessionId}/end
   *
   * Finalizes the session and triggers completion/progress calculations.
   */
  async endLearningSession(
    sessionId: number,
    payload: SessionEndPayload,
  ): Promise<SessionEndResponse["data"]> {
    try {
      const res = await apiClient.post<SessionEndResponse>(
        `/user/online-courses/sessions/${sessionId}/end`,
        payload,
      )
      return normalizeSessionEndResponse(res.data)
    } catch (err) {
      return handleServiceError(err)
    }
  },
}

// ── Named re-exports for convenience ─────────────────────────────────────────

export const {
  getMyOnlineCourses,
  getMyOnlineCourseById,
  openCourseContent,
  getContentResumePosition,
  updatePdfProgress,
  startLearningSession,
  sendSessionProgress,
  endLearningSession,
} = userOnlineCourseService

// ── Type re-exports ───────────────────────────────────────────────────────────

export type {
  SessionEndPayload,
  SessionEndResponse,
  PdfProgressPayload,
  PdfProgressResponse,
  SessionProgressPayload,
  SessionStartPayload,
  SessionStartResponse,
  SessionMetrics,
  LearningSessionEvent,
  ApiValidationError,
  ResumeProgressResponse,
  UserCourseMediaResponse,
  UserOnlineCourse,
  UserOnlineCourseDetail,
  UserOnlineCourseFilters,
  UserOnlineCourseListResponse,
} from "@/types/user-online-course"
