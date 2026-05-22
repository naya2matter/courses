// ─── Video Types ──────────────────────────────────────────────────────────────
// All TypeScript shapes for the Video Management feature.

// ── Embedded references ───────────────────────────────────────────────────────

export interface VideoCategoryRef {
  id: number
  name: string
}

export interface VideoCreatorRef {
  id: number
  name: string
}

export interface VideoQuality {
  quality: string        // e.g. "360p", "720p", "1080p"
  file_path: string
  file_size: number
}

// ── Resource shapes ───────────────────────────────────────────────────────────

/** Shape returned in the list endpoint (no qualities / subtitle detail) */
export interface Video {
  id: number
  name: string
  description?: string | null
  file_path: string
  file_size?: number | null
  duration_seconds?: number | null
  thumbnail_path?: string | null
  transcode_status: "pending" | "processing" | "completed" | "failed"
  video_category?: VideoCategoryRef | null
  creator?: VideoCreatorRef | null
  created_at?: string | null
  updated_at?: string | null
}

/** Full detail shape returned by getById (includes qualities + subtitle) */
export interface VideoDetail extends Video {
  subtitle_vtt_path?: string | null
  qualities: VideoQuality[]
}

// ── Summary cards returned alongside the list ─────────────────────────────────

export interface VideoCardSummary {
  key: string
  title: string
  value: number | string
}

// ── API response shape ────────────────────────────────────────────────────────

/** Shape returned by GET /admin/videos/getAll */
export interface VideoListResponse {
  data: Video[]
  cards?: VideoCardSummary[]
  links?: {
    first?: string | null
    last?: string | null
    prev?: string | null
    next?: string | null
  }
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    from?: number | null
    to?: number | null
    [key: string]: unknown
  }
}

// ── List filters ──────────────────────────────────────────────────────────────

/** Query params for GET /admin/videos/getAll */
export interface VideoFilters {
  per_page?: number
  page?: number
  search?: string
  video_category_id?: number | null
  transcode_status?: "pending" | "processing" | "completed" | "failed" | null
}

// ── Request payloads ──────────────────────────────────────────────────────────

/** Body for POST /admin/videos/create */
export interface CreateVideoPayload {
  name: string
  description?: string | null
  video_category_id: number
  file_path: string
  file_size?: number | null
  duration_seconds?: number | null
  thumbnail_path?: string | null
  thumbnail?: File | null
  subtitle_vtt_path?: string | null
}

/** Body for PUT /admin/videos/update/{id} */
export interface UpdateVideoPayload {
  name?: string
  description?: string | null
  video_category_id?: number
  duration_seconds?: number | null
  file_size?: number | null
  thumbnail_path?: string | null
  thumbnail?: File | null
}

// ── Chunk upload types ────────────────────────────────────────────────────────

/** Params passed to uploadVideoChunk() */
export interface UploadChunkParams {
  file: File
  chunkBlob: Blob
  uploadUuid: string
  chunkIndex: number
  totalChunks: number
}

/** Response from POST /admin/videos/upload-chunk */
export interface UploadChunkResponse {
  status: "pending" | "complete"
  received?: number
  total?: number
  file_path?: string
  file_size?: number
}

/** Body for DELETE /admin/videos/upload-chunk/revert */
export interface RevertUploadPayload {
  upload_uuid: string
}

// ── Subtitle types ────────────────────────────────────────────────────────────

/** Shape contained in GET /admin/videos/{videoId}/subtitle → data field */
export interface VideoSubtitleData {
  video_id: number
  subtitle_vtt_path: string
}

/** Full response envelope from GET /admin/videos/{videoId}/subtitle */
export interface VideoSubtitleResponse {
  data: VideoSubtitleData | null
}

/**
 * Response from POST /admin/videos/{videoId}/subtitle.
 * The backend returns the full VideoDetailResource with subtitle_vtt_path populated.
 */
export type UploadSubtitleResponse = VideoDetail

// ── Validation error shape (HTTP 422) ─────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}

// ── Normalised list result held in the store ──────────────────────────────────

export interface VideoListResult {
  items: Video[]
  cards: VideoCardSummary[]
  meta: VideoListResponse["meta"] | null
}

// ── Zustand store shape ───────────────────────────────────────────────────────

export interface VideoState {
  items: Video[]
  summaryCards: VideoCardSummary[]
  paginationMeta: VideoListResponse["meta"] | null
  isLoading: boolean
  error: string | null
  filters: VideoFilters

  fetchVideos: (filters?: VideoFilters) => Promise<void>
  setFilters: (filters: VideoFilters) => void
  createVideo: (payload: CreateVideoPayload) => Promise<VideoDetail>
  updateVideo: (id: number, payload: UpdateVideoPayload) => Promise<VideoDetail>
  deleteVideo: (id: number) => Promise<void>
  retryTranscode: (id: number) => Promise<void>
  clearError: () => void
}
