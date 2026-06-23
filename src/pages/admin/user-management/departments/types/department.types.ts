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

export interface DepartmentUserManager {
  id: number
  name: string
}

export interface DepartmentUser {
  id: number
  name: string
  email: string
  role?: string
  manager?: DepartmentUserManager | null
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

/** A summary card returned alongside departments by getAll */
export interface DepartmentCard {
  key: string
  title: string
  value: number
}

/** API response envelope for GET /admin/departments/getAll */
export interface DepartmentsApiResponse {
  data: Department[]
  cards?: DepartmentCard[]
  total?: number
  message?: string
}

/** Payload shared by create and update department endpoints */
export interface DepartmentMutationPayload {
  name: string
  parent_id: number | null
  sort_order: number | null
}

// ─── Filter / flat-list types ─────────────────────────────────────────────────

export interface DepartmentFilters {
  search?: string
  parent_id?: number | 'root' | null
  has_users?: boolean
}

/** Shape returned by getAll when filters are active (flat paginated) */
export interface FlatDepartment {
  id: number
  name: string
  slug: string
  parent_id: number | null
  parent?: { id: number; name: string } | null
  users_count: number
  users: DepartmentUser[]
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface FilteredDepartmentsMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface FilteredDepartmentsResponse {
  departments: FlatDepartment[]
  cards: DepartmentCard[]
  meta: FilteredDepartmentsMeta
}

// ─── Store State ──────────────────────────────────────────────────────────────

/** Shape of the Zustand departments store */
export interface DepartmentsState {
  /** All departments fetched from the API, retaining their raw tree structure */
  departments: Department[]
  /** Summary stat cards returned by the API */
  cards: DepartmentCard[]
  /** Whether a fetch is in-flight */
  isLoading: boolean
  /** Error message if the last fetch failed */
  error: string | null
  /** Store actions */
  fetchDepartments: () => Promise<void>
  clearError: () => void
}
