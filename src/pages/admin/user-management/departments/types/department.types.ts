// ─── Department Types ─────────────────────────────────────────────────────────
// Defines the shape of data returned by /admin/departments/getAll

export interface DepartmentUserLevel {
  id: number
  name: string
}

export interface DepartmentUserTier {
  id: number
  tier_name: string
  level?: DepartmentUserLevel
}

export interface DepartmentUser {
  id: number
  name: string
  email: string
  // manager can be a string, object, or null based on the structure provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  manager?: any
  tier?: DepartmentUserTier
  created_at?: string
  updated_at?: string
}

/** A single department as returned by the API */
export interface Department {
  id: number
  name: string
  slug: string
  parent_id: number | null
  sort_order: number
  users: DepartmentUser[]
  children?: Department[]
  created_at?: string
  updated_at?: string
}

/** API response envelope for GET /admin/departments/getAll */
export interface DepartmentsApiResponse {
  data: Department[]
  total?: number
  message?: string
}

/** Payload shared by create and update department endpoints */
export interface DepartmentMutationPayload {
  name: string
  parent_id: number | null
  sort_order: number | null
}

// ─── Store State ──────────────────────────────────────────────────────────────

/** Shape of the Zustand departments store */
export interface DepartmentsState {
  /** All departments fetched from the API, retaining their raw tree structure */
  departments: Department[]
  /** Whether a fetch is in-flight */
  isLoading: boolean
  /** Error message if the last fetch failed */
  error: string | null
  /** Store actions */
  fetchDepartments: () => Promise<void>
  clearError: () => void
}
