// ─── User Audio Types ─────────────────────────────────────────────────────────
// TypeScript shapes for all user-side audio API responses and request bodies.
// These map exactly to what the Laravel AudioResource, AudioPlayerResource,
// and AudioProgressResource return.

// ── Progress data embedded inside each audio list item ───────────────────────

/**
 * Progress snapshot included in every AudioResource.
 * Comes from the user's AudioProgress row for this audio.
 */
export interface AudioProgressData {
  current_time: number          // playback position in seconds
  total_listened_time: number   // cumulative listened seconds
  completion_percentage: number // 0-100
  is_completed: boolean
  last_accessed_at: string | null
}

// ── Single audio item (from list + player endpoints) ─────────────────────────

/**
 * Shape of one audio item returned by:
 *   - GET /user/audio/getAll (each item in data[])
 *   - GET /user/audio/getById/{id} (nested under data.audio)
 */
export interface UserAudioItem {
  id: number
  name: string | null
  description: string | null
  duration: number | null        // total duration in seconds
  audio_category_id: number | null
  audio_category: {
    id: number | null
    name: string | null
  } | null
  thumbnail_path: string | null  // relative path on the server's public disk
  has_audio_file: boolean        // true if an audio file exists on disk
  progress: AudioProgressData | null  // null if user has never played this
  created_at: string | null
  updated_at: string | null
}

// ── Stats card (from additional data in getAll) ───────────────────────────────

/**
 * One stat card returned in the `cards` additional key of the list response.
 * Keys: assigned_audios | completed_audios | in_progress_audios | remaining_audios
 */
export interface UserAudioCard {
  key: string
  title: string
  value: number
}

// ── Paginated list response from GET /user/audio/getAll ──────────────────────

/** Standard Laravel pagination meta block */
export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

/** Standard Laravel pagination links block */
export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

/**
 * Full response from GET /user/audio/getAll.
 * Paginated AudioResource collection + additional cards array.
 */
export interface UserAudioListResponse {
  data: UserAudioItem[]
  links: PaginationLinks
  meta: PaginationMeta
  cards: UserAudioCard[]  // injected via ->additional(['cards' => ...])
}

// ── Full progress resource (from AudioProgressResource) ───────────────────────

/**
 * Full AudioProgress row — returned by getById (nested under data.progress)
 * and by the updateProgress endpoint (data top-level).
 */
export interface UserAudioProgressDetail {
  id: number
  user_id: number
  audio_id: number
  current_time: number
  total_listened_time: number
  completion_percentage: number
  is_completed: boolean
  last_accessed_at: string | null
  created_at: string | null
  updated_at: string | null
}

// ── Single audio player response from GET /user/audio/getById/{id} ────────────

/**
 * Response envelope from GET /user/audio/getById/{id}.
 * Returns the audio + the user's full progress record.
 */
export interface UserAudioPlayerResponse {
  data: {
    audio: UserAudioItem
    progress: UserAudioProgressDetail | null
  }
}

// ── Progress update request/response ─────────────────────────────────────────

/**
 * One listened-time chunk to send to the server.
 * current_time : playback position at moment of recording (seconds, ≥ 0)
 * listened_time: integer seconds actually listened in this chunk (0–3600)
 *
 * NOTE: the idempotency key is NOT per-chunk — see `batch_key` on
 * UpdateProgressBody. The backend validation only accepts
 * `chunks.*.current_time` and `chunks.*.listened_time`.
 */
export interface ProgressChunk {
  current_time: number
  listened_time: number  // integer, 0-3600
}

/**
 * Request body for POST /user/audio/progress/update/{audioId}.
 *
 * `batch_key` is a TOP-LEVEL idempotency key (max 120 chars). The server
 * caches it per (user, audio, batch_key); replaying the same key returns the
 * existing progress WITHOUT re-applying the chunks, so a lost-response retry
 * never double-counts listened time. Always resend the same key on retry.
 */
export interface UpdateProgressBody {
  chunks: ProgressChunk[]  // 1–300 chunks per request
  batch_key?: string       // ≤ 120 chars, top-level idempotency key
}

/** Response envelope from POST /user/audio/progress/update/{audioId} */
export interface UpdateProgressResponse {
  data: UserAudioProgressDetail
}
