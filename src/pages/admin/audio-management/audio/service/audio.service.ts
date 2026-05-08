// ─── Audio Service ────────────────────────────────────────────────────────────
// Handles all HTTP requests for the Audio Management feature.
// The shared apiClient automatically attaches the Bearer token from localStorage.

import { apiClient } from "@/lib/api"
import type { AudioListFilters, AudioResource, LaravelPaginated } from "../types/audio.types"

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

type BackendAudioCategory = {
  id?: number
  name?: string | null
} | null

type BackendAudioStatusSummary = {
  total_listeners?: number | null
  completion_rate?: number | null
  average_progress?: number | null
  total_hours_listened?: number | null
}

type BackendAudioProgress = {
  current_time?: number | null
  total_listened_time?: number | null
  completion_percentage?: number | null
  is_completed?: boolean | null
  last_accessed_at?: string | null
}

type BackendAudioListener = {
  user?: {
    id?: number | null
    name?: string | null
    email?: string | null
  } | null
  progress_percentage?: number | null
  current_position_seconds?: number | null
  total_duration_seconds?: number | null
  status?: string | null
  listening_time_minutes?: number | null
  last_accessed_at?: string | null
  assigned_at?: string | null
}

type BackendAudioResource = {
  id: number
  name?: string | null
  description?: string | null
  url?: string | null
  duration?: number | string | null
  file_size?: number | string | null
  file_size_bytes?: number | null
  mime_type?: string | null
  course?: string | null
  status?: string | BackendAudioStatusSummary | null
  audio_category_id?: number | null
  audio_category?: BackendAudioCategory
  thumbnail_path?: string | null
  has_audio_file?: boolean
  progress?: BackendAudioProgress
  stream_url?: string | null
  listeners?: BackendAudioListener[]
  created_at?: string | null
  updated_at?: string | null
}

type BackendLaravelPaginated<T> = {
  data?: T[]
  meta?: LaravelPaginated<T>["meta"]
  links?: LaravelPaginated<T>["links"]
}

type BackendAudioEnvelope = {
  data?: BackendAudioResource
}

/**
 * Build a query string from an AudioListFilters object.
 * Only includes params that have actual values (skips undefined / null / "").
 */
function buildQuery(filters: AudioListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim())
  }
  if (filters.per_page != null) {
    params.set("per_page", String(filters.per_page))
  }
  if (filters.page != null) {
    params.set("page", String(filters.page))
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function toAudioResource(audio: BackendAudioResource): AudioResource {
  return {
    id: audio.id,
    title: audio.name ?? null,
    name: audio.name ?? null,
    description: audio.description ?? null,
    url: audio.url ?? null,
    duration: audio.duration ?? null,
    file_size: audio.file_size ?? null,
    file_size_bytes: audio.file_size_bytes ?? null,
    mime_type: audio.mime_type ?? null,
    course: audio.course ?? null,
    status: audio.status ?? null,
    audio_category_id: audio.audio_category_id ?? audio.audio_category?.id ?? null,
    category: audio.audio_category?.name ?? null,
    audio_category: audio.audio_category
      ? {
          id: audio.audio_category.id ?? null,
          name: audio.audio_category.name ?? null,
        }
      : null,
    thumbnail_path: audio.thumbnail_path ?? null,
    has_audio_file: audio.has_audio_file ?? null,
    progress: audio.progress ?? null,
    stream_url: audio.stream_url ?? null,
    listeners: audio.listeners ?? null,
    created_at: audio.created_at ?? null,
    updated_at: audio.updated_at ?? null,
  }
}

function normalizeAudioListResponse(
  response: BackendLaravelPaginated<BackendAudioResource>,
): LaravelPaginated<AudioResource> {
  return {
    data: Array.isArray(response.data) ? response.data.map(toAudioResource) : [],
    meta: response.meta ?? {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    links: response.links ?? {
      first: null,
      last: null,
      prev: null,
      next: null,
    },
  }
}

function normalizeSingleAudioResponse(
  response: BackendAudioResource | BackendAudioEnvelope,
): AudioResource {
  const audio = "id" in response ? response : response.data

  if (!audio) {
    throw new Error("Audio response payload is missing.")
  }

  return toAudioResource(audio)
}

/**
 * Fetch a paginated list of audio items.
 * Endpoint: GET /admin/audio/getAll
 *
 * All filter fields are optional; omitting them lets the server return page 1
 * with its default per_page value.
 */
export async function getAllAudio(
  filters: AudioListFilters = {},
): Promise<LaravelPaginated<AudioResource>> {
  const query = buildQuery(filters)
  const response = await apiClient.get<BackendLaravelPaginated<BackendAudioResource>>(
    `/admin/audio/getAll${query}`,
  )
  return normalizeAudioListResponse(response)
}

/**
 * Fetch a single audio item by its ID.
 * Endpoint: GET /admin/audio/getById/{id}
 *
 * Returns the full detail resource (may include fields not in the list).
 */
export async function getAudioById(id: number): Promise<AudioResource> {
  const response = await apiClient.get<BackendAudioResource | BackendAudioEnvelope>(
    `/admin/audio/getById/${id}`,
  )
  return normalizeSingleAudioResponse(response)
}

/**
 * GET /admin/audio/stream/{id}
 * Fetches the audio binary from the admin stream endpoint and returns an
 * object URL suitable for a browser <audio> player.
 *
 * The returned URL should be revoked when the caller unmounts the component.
 */
export async function getAdminAudioStreamBlobUrl(
  id: number,
  signal?: AbortSignal,
): Promise<string> {
  const token = apiClient.getToken()

  const response = await fetch(`${API_BASE}/admin/audio/stream/${id}`, {
    method: "GET",
    headers: {
      Accept: "audio/*,*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message = (payload as { message?: string } | null)?.message ??
      `Stream failed (${response.status})`
    const err = new Error(message) as Error & { status: number }
    err.status = response.status
    throw err
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * Soft-delete an audio item by its ID.
 * Endpoint: DELETE /admin/audio/delete/{id}
 *
 * The record is not permanently removed — it is only marked as deleted on the
 * server side (soft delete). Returns void on success (HTTP 200).
 */
export async function deleteAudio(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/audio/delete/${id}`)
}

/**
 * Create a new audio item.
 * Endpoint: POST /admin/audio/create (multipart/form-data)
 *
 * Accepts a pre-built FormData object containing:
 *   - audio_category_id (required integer)
 *   - name              (required string, max 255)
 *   - audio_file        (optional binary file, max ~100 KB)
 *   - description       (optional string)
 *   - duration          (optional integer ≥ 1, in seconds)
 *   - thumbnail         (optional binary file, max ~4 MB)
 *
 * Returns the newly created AudioResource (HTTP 201).
 */
export async function createAudio(formData: FormData): Promise<AudioResource> {
  const response = await apiClient.postForm<BackendAudioResource | BackendAudioEnvelope>(
    "/admin/audio/create",
    formData,
  )
  return normalizeSingleAudioResponse(response)
}

/**
 * Update an existing audio item.
 * Endpoint: PUT /admin/audio/update/{id} (multipart/form-data)
 *
 * PHP does not natively parse multipart bodies on PUT requests, so the
 * apiClient appends `_method=PUT` and sends the request as POST — Laravel
 * reads that field and treats it as a PUT (method-spoofing).
 *
 * All body fields are optional for updates; only send what changed.
 *
 * Returns the updated AudioResource (HTTP 200).
 */
export async function updateAudio(id: number, formData: FormData): Promise<AudioResource> {
  const response = await apiClient.putForm<BackendAudioResource | BackendAudioEnvelope>(
    `/admin/audio/update/${id}`,
    formData,
  )
  return normalizeSingleAudioResponse(response)
}
