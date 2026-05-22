// ─── Video Service ────────────────────────────────────────────────────────────
// Handles all HTTP requests for the Video Management feature.
// The shared apiClient automatically attaches the Bearer token.

import { apiClient } from "@/lib/api"
import type { ApiError } from "@/lib/api"
import type {
  Video,
  VideoDetail,
  VideoListResponse,
  VideoListResult,
  VideoFilters,
  CreateVideoPayload,
  UpdateVideoPayload,
  UploadChunkParams,
  UploadChunkResponse,
  VideoSubtitleData,
  VideoSubtitleResponse,
  UploadSubtitleResponse,
} from "../types/video.types"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

// ── Query builder ─────────────────────────────────────────────────────────────

function buildQuery(filters: VideoFilters): string {
  const params = new URLSearchParams()
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.page != null && filters.page > 1) params.set("page", String(filters.page))
  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.video_category_id != null) params.set("video_category_id", String(filters.video_category_id))
  if (filters.transcode_status != null) params.set("transcode_status", filters.transcode_status)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ── Normalisation helpers ─────────────────────────────────────────────────────

function unwrapVideo(res: { data: Video } | Video): Video {
  return "data" in res && typeof (res as { data: Video }).data === "object"
    ? (res as { data: Video }).data
    : (res as Video)
}

function unwrapVideoDetail(res: { data: VideoDetail } | VideoDetail): VideoDetail {
  return "data" in res && typeof (res as { data: VideoDetail }).data === "object"
    ? (res as { data: VideoDetail }).data
    : (res as VideoDetail)
}

function appendFormValue(
  form: FormData,
  key: string,
  value: string | number | null | undefined,
): void {
  if (value === undefined) return
  form.append(key, value === null ? "" : String(value))
}

function buildVideoFormData(payload: CreateVideoPayload | UpdateVideoPayload): FormData {
  const form = new FormData()

  appendFormValue(form, "name", payload.name)
  appendFormValue(form, "description", payload.description)
  appendFormValue(form, "video_category_id", payload.video_category_id)
  appendFormValue(form, "file_size", payload.file_size)
  appendFormValue(form, "duration_seconds", payload.duration_seconds)
  appendFormValue(form, "thumbnail_path", payload.thumbnail_path)

  if ("file_path" in payload) {
    appendFormValue(form, "file_path", payload.file_path)
  }

  if ("subtitle_vtt_path" in payload) {
    appendFormValue(form, "subtitle_vtt_path", payload.subtitle_vtt_path)
  }

  if (payload.thumbnail) {
    form.append("thumbnail", payload.thumbnail)
  }

  return form
}

// ── API functions ─────────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of videos.
 * Endpoint: GET /admin/videos/getAll
 */
export async function getVideos(filters: VideoFilters = {}): Promise<VideoListResult> {
  const qs = buildQuery(filters)
  const response = await apiClient.get<VideoListResponse>(`/admin/videos/getAll${qs}`)

  return {
    items: Array.isArray(response?.data) ? response.data : [],
    cards: Array.isArray(response?.cards) ? response.cards : [],
    meta: response?.meta ?? null,
  }
}

/**
 * Fetch a single video by ID.
 * Endpoint: GET /admin/videos/getById/{videoId}
 */
export async function getVideoById(videoId: number): Promise<VideoDetail> {
  const response = await apiClient.get<{ data: VideoDetail } | VideoDetail>(
    `/admin/videos/getById/${videoId}`,
  )
  return unwrapVideoDetail(response as { data: VideoDetail } | VideoDetail)
}

/**
 * Create a new video record after a successful chunk upload.
 * Endpoint: POST /admin/videos/create
 *
 * Do NOT include transcode_status or created_by — the server sets those.
 */
export async function createVideo(payload: CreateVideoPayload): Promise<VideoDetail> {
  const form = buildVideoFormData(payload)
  const response = await apiClient.postForm<{ data: VideoDetail } | VideoDetail>(
    "/admin/videos/create",
    form,
  )
  return unwrapVideoDetail(response as { data: VideoDetail } | VideoDetail)
}

/**
 * Update an existing video's metadata.
 * Endpoint: PUT /admin/videos/update/{videoId}
 *
 * file_path is immutable — do not include it in the payload.
 */
export async function updateVideo(
  videoId: number,
  payload: UpdateVideoPayload,
): Promise<VideoDetail> {
  const form = buildVideoFormData(payload)
  const response = await apiClient.putForm<{ data: VideoDetail } | VideoDetail>(
    `/admin/videos/update/${videoId}`,
    form,
  )
  return unwrapVideoDetail(response as { data: VideoDetail } | VideoDetail)
}

/**
 * Soft-delete a video by ID.
 * Endpoint: DELETE /admin/videos/delete/{videoId}
 */
export async function deleteVideo(videoId: number): Promise<void> {
  return apiClient.delete<void>(`/admin/videos/delete/${videoId}`)
}

/**
 * Upload a single chunk of a video file.
 * Endpoint: POST /admin/videos/upload-chunk (multipart/form-data)
 *
 * - Sends chunk blob, upload_uuid, chunk_index, total_chunks.
 * - original_filename is only sent on chunk 0.
 * - When the last chunk arrives the server auto-finalises and returns
 *   { status: "complete", file_path, file_size }.
 *
 * Uses raw fetch (not apiClient) so we can send FormData without Content-Type
 * being overridden by the JSON wrapper.
 */
export async function uploadVideoChunk(
  params: UploadChunkParams,
  signal?: AbortSignal,
): Promise<UploadChunkResponse> {
  const { file, chunkBlob, uploadUuid, chunkIndex, totalChunks } = params

  const form = new FormData()
  form.append("chunk", chunkBlob, file.name)
  form.append("upload_uuid", uploadUuid)
  form.append("chunk_index", String(chunkIndex))
  form.append("total_chunks", String(totalChunks))
  if (chunkIndex === 0) {
    form.append("original_filename", file.name)
  }

  const token = apiClient.getToken()
  const res = await fetch(`${API_BASE}/admin/videos/upload-chunk`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
    signal,
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    const err = new Error(
      (payload as { message?: string })?.message ?? `Chunk upload failed (${res.status})`,
    ) as Error & { status: number; data: unknown }
    err.status = res.status
    err.data = payload
    throw err
  }

  return res.json() as Promise<UploadChunkResponse>
}

/**
 * Revert / cancel an in-progress chunk upload.
 * Endpoint: DELETE /admin/videos/upload-chunk/revert
 *
 * Safe to call even if no chunks were sent. Call this whenever the user
 * cancels an upload mid-way to prevent orphaned temp files on the server.
 */
export async function revertVideoUpload(uploadUuid: string): Promise<void> {
  const token = apiClient.getToken()
  await fetch(`${API_BASE}/admin/videos/upload-chunk/revert`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ upload_uuid: uploadUuid }),
  })
  // Intentionally swallow revert errors — best-effort cleanup
}

/**
 * Reset a failed transcode for a video.
 * Endpoint: POST /admin/videos/{videoId}/retry-transcode
 */
export async function retryTranscode(videoId: number): Promise<VideoDetail> {
  const response = await apiClient.post<{ data: VideoDetail } | VideoDetail>(
    `/admin/videos/${videoId}/retry-transcode`,
  )
  return unwrapVideoDetail(response as { data: VideoDetail } | VideoDetail)
}

// ── Subtitle management ───────────────────────────────────────────────────────

/**
 * Fetch the subtitle info for a video.
 * Endpoint: GET /admin/videos/{videoId}/subtitle
 *
 * Returns the subtitle data or null when no subtitle has been uploaded.
 */
export async function getVideoSubtitle(videoId: number): Promise<VideoSubtitleData | null> {
  const response = await apiClient.get<VideoSubtitleResponse>(
    `/admin/videos/${videoId}/subtitle`,
  )
  return response.data ?? null
}

/**
 * Upload or replace the subtitle file for a video.
 * Endpoint: POST /admin/videos/{videoId}/subtitle (multipart/form-data)
 *
 * - Only .vtt files up to 10 MB are accepted (validated client-side first).
 * - If a subtitle already exists it is replaced by the backend.
 * - Uses XMLHttpRequest so we can report upload progress via onProgress.
 */
export function uploadVideoSubtitle(
  videoId: number,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadSubtitleResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append("subtitle_file", file)

    const token = apiClient.getToken()
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${API_BASE}/admin/videos/${videoId}/subtitle`)
    xhr.setRequestHeader("Accept", "application/json")
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const raw = JSON.parse(xhr.responseText)
          resolve(unwrapVideoDetail(raw as { data: VideoDetail } | VideoDetail))
        } catch {
          reject(new Error("Invalid JSON response from subtitle upload."))
        }
        return
      }

      try {
        const payload = JSON.parse(xhr.responseText) as { message?: string; errors?: Record<string, string[]> }
        const err = new Error(
          payload?.message ?? `Subtitle upload failed (${xhr.status})`,
        ) as ApiError
        err.status = xhr.status
        err.data = payload
        reject(err)
      } catch {
        const err = new Error(`Subtitle upload failed (${xhr.status})`) as ApiError
        err.status = xhr.status
        err.data = null
        reject(err)
      }
    })

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during subtitle upload. Please check your connection."))
    })

    xhr.addEventListener("abort", () => {
      reject(new DOMException("Subtitle upload was aborted.", "AbortError"))
    })

    xhr.send(form)
  })
}

/**
 * Delete the subtitle file for a video.
 * Endpoint: DELETE /admin/videos/{videoId}/subtitle
 *
 * Returns 422 if the video has no subtitle — the caller should guard against this.
 */
export async function deleteVideoSubtitle(videoId: number): Promise<void> {
  return apiClient.delete<void>(`/admin/videos/${videoId}/subtitle`)
}

/**
 * Fetch the video binary from the admin stream endpoint and return an
 * object URL suitable for a browser <video> element.
 *
 * The server uses BinaryFileResponse which supports HTTP Range requests, so
 * the browser can seek even inside the object URL blob.
 * Revoke the returned URL via URL.revokeObjectURL() when the component unmounts.
 */
export async function getVideoStreamBlobUrl(
  videoId: number,
  signal?: AbortSignal,
): Promise<string> {
  const token = apiClient.getToken()

  const response = await fetch(`${API_BASE}/admin/videos/${videoId}/stream`, {
    method: "GET",
    headers: {
      Accept: "video/*,*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      (payload as { message?: string } | null)?.message ??
      `Stream failed (${response.status})`
    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * Fetch the raw VTT subtitle text for admin inspection.
 * Endpoint: GET /admin/videos/{videoId}/subtitle/raw
 *
 * Returns the raw WebVTT string (plain text), typically only a few KB.
 */
export async function getVideoSubtitleContent(
  videoId: number,
  signal?: AbortSignal,
): Promise<string> {
  const token = apiClient.getToken()

  const response = await fetch(`${API_BASE}/admin/videos/${videoId}/subtitle/raw`, {
    method: "GET",
    headers: {
      Accept: "text/vtt,text/plain,*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      (payload as { message?: string } | null)?.message ??
      `Failed to load subtitle content (${response.status})`
    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  return response.text()
}

export { unwrapVideo }
