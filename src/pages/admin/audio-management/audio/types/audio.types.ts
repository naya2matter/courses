// ─── Audio Types ──────────────────────────────────────────────────────────────
// All TypeScript shapes for the Audio Management feature:
//   • API response types (list + single resource)
//   • Filter params used when fetching the list
//   • Zustand store state shape

// ── Resource shape returned by the API ───────────────────────────────────────

/**
 * A single audio entry returned by GET /admin/audio/getAll
 * and GET /admin/audio/getById/{id}.
 *
 * Fields are optional with `?` because the API may not include every field
 * in the list endpoint vs. the detail endpoint.
 */
export interface AudioResource {
  id: number
  title?: string | null
  name?: string | null
  description?: string | null
  /** URL to the audio file */
  url?: string | null
  /** Duration in seconds or a human-readable string */
  duration?: number | string | null
  audio_category_id?: number | null
  audio_category?: {
    id?: number | null
    name?: string | null
  } | null
  thumbnail_path?: string | null
  has_audio_file?: boolean
  /** File size in bytes or human-readable */
  file_size?: number | string | null
  /** MIME type, e.g. audio/mpeg */
  mime_type?: string | null
  /** Name of the course or lesson this audio belongs to */
  course?: string | null
  /** Any extra category/tag information */
  category?: string | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

// ── Laravel paginated envelope ────────────────────────────────────────────────

/** Standard Laravel paginator meta block */
export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

/** Standard Laravel paginator links block */
export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

/** Generic paginated API response (works for any resource type) */
export interface LaravelPaginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// ── Filter params ─────────────────────────────────────────────────────────────

/** Query params sent to GET /admin/audio/getAll */
export interface AudioListFilters {
  page?: number
  per_page?: number
  search?: string
}

// ── Zustand store shape ───────────────────────────────────────────────────────

/** Full state + actions managed by the audio Zustand store */
export interface AudioState {
  /** Current page of audio items */
  items: AudioResource[]
  /** Pagination metadata from the last response */
  meta: PaginationMeta | null
  /** True while any list fetch is in-flight */
  isLoading: boolean
  /** Human-readable error string, or null when there is no error */
  error: string | null
  /** Currently active list filters */
  filters: AudioListFilters
  /** Fetch (or re-fetch) the list, optionally merging new filters */
  fetchAudio: (filters?: AudioListFilters) => Promise<void>
  /** Merge new filters and immediately re-fetch from page 1 */
  setFilters: (filters: AudioListFilters) => void
  /** Dismiss the error banner */
  clearError: () => void
}
