// ─── User Online Course Service ───────────────────────────────────────────────
// All HTTP calls for the user-facing online-course learning feature.
// Uses the shared apiClient (Bearer token attached automatically) for JSON
// endpoints. Media files are served via short-lived SIGNED URLs that need NO
// auth header — they can be used directly in <video> / react-pdf.
//
// Endpoints covered:
//   1. GET  /user/online-courses/getAll                       → assigned courses
//   2. GET  /user/online-courses/getById/{id}                 → module tree
//   3. GET  /user/online-courses/{courseId}/content/{id}      → signed media url
//   4. GET  /user/online-courses/progress/{contentId}/resume  → resume position
//   5. POST /user/online-courses/sessions/start               → open a session
//   6. POST /user/online-courses/sessions/{id}/progress       → progress ping
//   7. POST /user/online-courses/sessions/{id}/end            → finalize + score
//   8. POST /user/online-courses/progress/pdf                 → pdf page progress

import { apiClient } from "@/lib/api"
import type {
  OnlineCourseListResponse,
  OnlineCourseDetailResponse,
  ContentViewerResponse,
  ResumeResponse,
  SessionStartBody,
  SessionStartResponse,
  SessionProgressBody,
  SessionEndBody,
  SessionEndResponse,
  PdfProgressBody,
  PdfProgressResponse,
  LearningStatus,
} from "../types/user-online-courses.types"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

// ── 1. List assigned courses ──────────────────────────────────────────────────

export interface OnlineCourseListParams {
  status?: LearningStatus
  search?: string
  per_page?: number
  page?: number
}

export async function getAssignedOnlineCourses(
  params?: OnlineCourseListParams,
): Promise<OnlineCourseListResponse> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.search?.trim()) query.set("search", params.search.trim())
  if (params?.per_page != null) query.set("per_page", String(params.per_page))
  if (params?.page != null) query.set("page", String(params.page))

  const qs = query.toString()
  return apiClient.get<OnlineCourseListResponse>(
    `/user/online-courses/getAll${qs ? `?${qs}` : ""}`,
  )
}

// ── 2. Course detail with module tree ─────────────────────────────────────────

export async function getOnlineCourseById(id: number): Promise<OnlineCourseDetailResponse> {
  return apiClient.get<OnlineCourseDetailResponse>(`/user/online-courses/getById/${id}`)
}

// ── 3. Open a content item (signed media URL) ─────────────────────────────────

export async function openContent(
  courseId: number,
  contentId: number,
): Promise<ContentViewerResponse> {
  return apiClient.get<ContentViewerResponse>(
    `/user/online-courses/${courseId}/content/${contentId}`,
  )
}

// ── 4. Lightweight resume position ────────────────────────────────────────────

export async function getResumePosition(contentId: number): Promise<ResumeResponse> {
  return apiClient.get<ResumeResponse>(
    `/user/online-courses/progress/${contentId}/resume`,
  )
}

// ── 5. Start a learning session (video) ───────────────────────────────────────

export async function startSession(body: SessionStartBody): Promise<SessionStartResponse> {
  return apiClient.post<SessionStartResponse>(
    `/user/online-courses/sessions/start`,
    body,
  )
}

// ── 6. Send a progress ping ───────────────────────────────────────────────────

export async function sendSessionProgress(
  sessionId: number,
  body: SessionProgressBody,
): Promise<{ ok: boolean }> {
  return apiClient.post<{ ok: boolean }>(
    `/user/online-courses/sessions/${sessionId}/progress`,
    body,
  )
}

// ── 7. End a session (calculates attention score) ─────────────────────────────

export async function endSession(
  sessionId: number,
  body: SessionEndBody,
): Promise<SessionEndResponse> {
  return apiClient.post<SessionEndResponse>(
    `/user/online-courses/sessions/${sessionId}/end`,
    body,
  )
}

/**
 * Fire-and-forget session end for page-unload (tab close / navigation away).
 *
 * navigator.sendBeacon cannot attach an Authorization header, so we use
 * fetch({ keepalive: true }) which DOES carry headers and survives unload.
 * Best-effort only — errors are swallowed.
 */
export function endSessionBeacon(sessionId: number, body: SessionEndBody): void {
  const token = apiClient.getToken()
  try {
    void fetch(`${API_BASE}/user/online-courses/sessions/${sessionId}/end`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
  } catch {
    // ignore — unload context, nothing we can do
  }
}

// ── 8a. Download content attachment ──────────────────────────────────────────

export async function downloadAttachment(courseId: number, contentId: number): Promise<Blob> {
  return apiClient.getBlob(`/user/online-courses/${courseId}/content/${contentId}/attachment`)
}

// ── 8. Update PDF reading progress ────────────────────────────────────────────

export async function updatePdfProgress(body: PdfProgressBody): Promise<PdfProgressResponse> {
  return apiClient.post<PdfProgressResponse>(`/user/online-courses/progress/pdf`, body)
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a raw second count → "M:SS" or "H:MM:SS". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

/** Build a full thumbnail URL from a (possibly relative) storage path. */
export function getThumbnailUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  const origin = API_BASE.replace(/\/api$/, "")
  return `${origin}/storage/${path}`
}
