// ─── Audio Category Types ──────────────────────────────────────────────────────
// All TypeScript shapes for the Audio Category feature:
//   • API response types (AudioCategoryResource)
//   • Payloads for create and update requests
//   • Zustand store state shape

// ── Resource shape returned by the API ───────────────────────────────────────

/**
 * A single audio category returned by the API.
 * Fields match the AudioCategoryResource from the backend.
 */
export interface AudioCategoryResource {
  id: number
  name: string
  sort_order: number
  created_at?: string | null
  updated_at?: string | null
}

// ── Request payloads ──────────────────────────────────────────────────────────

/** Body for POST /admin/audio-categories/create */
export interface CreateCategoryPayload {
  name: string           // required, max 255 chars
  sort_order?: number    // optional, min 0
}

/** Body for PUT /admin/audio-categories/update/{id} */
export interface UpdateCategoryPayload {
  name?: string          // optional on update
  sort_order?: number    // optional, min 0
}

// ── Zustand store shape ───────────────────────────────────────────────────────

/** Full state + actions managed by the category Zustand store */
export interface CategoryState {
  /** Full list of audio categories (not paginated) */
  items: AudioCategoryResource[]
  /** True while the list is being fetched */
  isLoading: boolean
  /** Non-null when the last fetch failed */
  error: string | null

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load all categories from the API */
  fetchCategories: () => Promise<void>
  /** Create a new category and refresh the list */
  createCategory: (payload: CreateCategoryPayload) => Promise<AudioCategoryResource>
  /** Update an existing category by ID and refresh the list */
  updateCategory: (id: number, payload: UpdateCategoryPayload) => Promise<AudioCategoryResource>
  /** Delete a category by ID and refresh the list */
  deleteCategory: (id: number) => Promise<void>
  /** Dismiss the top-level error banner */
  clearError: () => void
}
