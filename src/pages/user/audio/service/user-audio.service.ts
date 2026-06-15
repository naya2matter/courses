// ─── User Audio Service ───────────────────────────────────────────────────────
// All HTTP calls for the user-facing audio feature.
// Uses the shared apiClient (Bearer token is attached automatically).
//
// Endpoints covered:
//   1. GET  /user/audio/getAll                    → list assigned audios + cards
//   2. GET  /user/audio/getById/{id}              → single audio + progress
//   3. GET  /user/audio/stream/{id}               → binary audio file (blob)
//   4. POST /user/audio/progress/update/{audioId} → save listened-time chunks

import { apiClient } from "@/lib/api"
import type {
  UserAudioListResponse,
  UserAudioPlayerResponse,
  UpdateProgressBody,
  UpdateProgressResponse,
} from "../types/user-audio.types"

// Derive the raw API base URL (without the /api suffix) for storage assets
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

// ── Utility: format seconds → "M:SS" or "H:MM:SS" ────────────────────────────

/**
 * Converts a raw second count into a human-readable duration string.
 * Returns "0:00" for null / invalid values.
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "0:00"

  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  if (h > 0) {
    // Hours present → H:MM:SS
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  // Minutes only → M:SS
  return `${m}:${String(s).padStart(2, "0")}`
}

// ── Utility: build thumbnail URL ──────────────────────────────────────────────

/**
 * Constructs the full URL for a thumbnail stored on the server's public disk.
 * Returns null when thumbnail_path is absent.
 */
export function getThumbnailUrl(thumbnailPath: string | null | undefined): string | null {
  if (!thumbnailPath) return null
  // The backend already returns a full URL via Storage::disk('public')->url(),
  // so return it directly. Only build a URL when given a relative path.
  if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
    return thumbnailPath
  }
  const origin = API_BASE.replace(/\/api$/, "")
  return `${origin}/storage/${thumbnailPath}`
}

// ── 1. List audios assigned to the authenticated user ─────────────────────────

/** Optional query params for the list endpoint */
export interface UserAudioListParams {
  page?: number
  per_page?: number
  search?: string
  audio_category_id?: number
}

/**
 * GET /user/audio/getAll
 * Returns a paginated list of audios assigned to the current user,
 * plus stats cards (assigned/completed/in-progress/remaining counts).
 */
export async function getUserAudioList(
  params?: UserAudioListParams,
): Promise<UserAudioListResponse> {
  const query = new URLSearchParams()

  if (params?.page != null) query.set("page", String(params.page))
  if (params?.per_page != null) query.set("per_page", String(params.per_page))
  if (params?.search?.trim()) query.set("search", params.search.trim())
  if (params?.audio_category_id != null) {
    query.set("audio_category_id", String(params.audio_category_id))
  }

  const qs = query.toString()
  return apiClient.get<UserAudioListResponse>(`/user/audio/getAll${qs ? `?${qs}` : ""}`)
}

// ── 2. Get a single assigned audio with user progress ─────────────────────────

/**
 * GET /user/audio/getById/{id}
 * Returns the audio metadata + the user's full progress record for that audio.
 * Throws ApiError with status 404 if the audio is not assigned to this user.
 */
export async function getUserAudioById(id: number): Promise<UserAudioPlayerResponse> {
  return apiClient.get<UserAudioPlayerResponse>(`/user/audio/getById/${id}`)
}

// ── 3. Stream assigned audio file ─────────────────────────────────────────────

/**
 * GET /user/audio/stream/{id}
 * Fetches the binary audio file with the Bearer token in the header
 * (the native <audio> element cannot send Authorization headers, so we
 * download the file as a Blob and create an object URL for the player).
 *
 * ⚠️  The caller MUST revoke the returned URL via URL.revokeObjectURL()
 *     when the component unmounts to avoid memory leaks.
 */
export async function getAudioStreamBlobUrl(id: number): Promise<string> {
  const token = apiClient.getToken()

  const response = await fetch(`${API_BASE}/user/audio/stream/${id}`, {
    headers: {
      // Attach the auth token — the native audio element cannot do this
      Authorization: token ? `Bearer ${token}` : "",
      Accept: "audio/*,*/*",
    },
  })

  if (!response.ok) {
    // Try to read a JSON error message from the body
    const payload = await response.json().catch(() => null)
    const message = (payload as { message?: string } | null)?.message
      ?? `Stream failed (${response.status})`

    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  // Convert the binary body to a Blob, then to an object URL
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

// ── 4. Update user audio progress with batched chunks ────────────────────────

/**
 * POST /user/audio/progress/update/{audioId}
 * Sends an array of listened-time chunks (1–300 per request).
 * Returns the updated AudioProgress record.
 */
export async function updateAudioProgress(
  audioId: number,
  body: UpdateProgressBody,
): Promise<UpdateProgressResponse> {
  return apiClient.post<UpdateProgressResponse>(
    `/user/audio/progress/update/${audioId}`,
    body,
  )
}
