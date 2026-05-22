// ─── Video Category Types ──────────────────────────────────────────────────────
// All TypeScript shapes for the Video Category feature:
//   • API response types (VideoCategory)
//   • Payloads for create and update requests
//   • Zustand store state shape

// ── Resource shape returned by the API ───────────────────────────────────────

/**
 * A single video category returned by the API.
 * Fields match the VideoCategoryResource from the backend.
 */
export interface VideoCategory {
  id: number
  name: string
  slug: string
  sort_order: number
  created_at?: string | null
  updated_at?: string | null
}

// ── Summary card returned in the list response ────────────────────────────────

export interface VideoCategoryCard {
  key: string
  title: string
  value: number | string
}

// ── API response shapes ───────────────────────────────────────────────────────

/** Shape returned by GET /admin/video-categories/getAll */
export interface VideoCategoryListResponse {
  data: VideoCategory[]
  cards?: VideoCategoryCard[]
  links?: Record<string, unknown>
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
    [key: string]: unknown
  }
}

/** Normalised result held in the store */
export interface CategoryListResult {
  items: VideoCategory[]
  cards: VideoCategoryCard[]
  meta: VideoCategoryListResponse["meta"] | null
}

// ── Request payloads ──────────────────────────────────────────────────────────

/** Body for POST /admin/video-categories/create and PUT /admin/video-categories/update/{id} */
export interface VideoCategoryPayload {
  name: string           // required, max 255 chars
  sort_order?: number    // optional, min 0
}

// ── Validation error shape (HTTP 422) ─────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}

// ── Zustand store shape ───────────────────────────────────────────────────────

/** Full state + actions managed by the video category Zustand store */
export interface VideoCategoryState {
  /** Fetched list of video categories */
  items: VideoCategory[]
  /** Summary cards returned by the list API */
  summaryCards: VideoCategoryCard[]
  /** Pagination metadata */
  paginationMeta: VideoCategoryListResponse["meta"] | null
  /** True while the list is being fetched */
  isLoading: boolean
  /** Non-null when the last fetch failed */
  error: string | null
  /** Current search query */
  search: string
  /** Current page (1-based) */
  page: number
  /** Items per page */
  perPage: number

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load categories, optionally overriding search/page/perPage */
  fetchCategories: (opts?: { search?: string; page?: number; perPage?: number }) => Promise<void>
  /** Create a new category and refresh the list */
  createCategory: (payload: VideoCategoryPayload) => Promise<VideoCategory>
  /** Update an existing category by ID and refresh the list */
  updateCategory: (id: number, payload: VideoCategoryPayload) => Promise<VideoCategory>
  /** Delete a category by ID and refresh the list */
  deleteCategory: (id: number) => Promise<void>
  /** Dismiss the top-level error banner */
  clearError: () => void
  /** Update the active search term and re-fetch from page 1 */
  setSearch: (search: string) => void
  /** Navigate to a specific page */
  setPage: (page: number) => void
}
