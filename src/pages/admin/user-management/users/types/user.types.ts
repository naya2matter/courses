// ─── User Types ───────────────────────────────────────────────────────────────
// Defines all TypeScript shapes for the Users feature:
//   • API response types (list + single resource)
//   • Create user request payload
//   • Zustand store state shape
//   • Filter params used when fetching the list

import type { Role } from "@/types/auth"

// ── Resource shapes returned by the API ──────────────────────────────────────

/** Embedded department object inside a UserListResource */
export interface UserDepartment {
  id: number
  name: string
}

/** Embedded level object inside a tier */
export interface UserLevel {
  id: number
  name: string
}

/** Embedded tier object inside a UserListResource */
export interface UserTier {
  id: number
  tier_name: string
  level_name?: string | null
  level?: UserLevel | null
}

/** Tier item returned by GET /admin/user-levels/with-tiers */
export interface UserLevelTierResource {
  id: number
  tier_name: string
  tier_order: number
}

/** Level item returned by GET /admin/user-levels/with-tiers */
export interface UserLevelWithTiers {
  id: number
  code: string
  name: string
  hierarchy_level: number
  tiers: UserLevelTierResource[]
}

/** Envelope returned by GET /admin/user-levels/with-tiers */
export interface UserLevelsWithTiersResponse {
  data: UserLevelWithTiers[]
}

/** Embedded manager / report_to object */
export interface UserManager {
  id: number
  name: string
}

/**
 * A single user entry returned by GET /admin/users/getAll.
 * Maps to Laravel's UserListResource.
 */
export interface UserListResource {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string | null
  department?: UserDepartment | null
  tier?: UserTier | null
  report_to?: UserManager | null
  /** 1–2 managers this user reports to. Prefer this over the legacy `report_to`. */
  managers?: UserManager[]
  created_at?: string
}

/**
 * A single user as returned by POST /admin/users/create and
 * PUT /admin/users/update/{id}.
 * Uses `manager` (not `report_to`) and includes `updated_at`.
 */
export interface UserResource {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string | null
  department?: (UserDepartment & { slug?: string }) | null
  tier?: UserTier | null
  manager?: UserManager | null
  /** 1–2 managers this user reports to. Prefer this over the legacy `manager`. */
  managers?: UserManager[]
  created_at?: string
  updated_at?: string
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

/**
 * Query parameters accepted by GET /admin/users/getAll.
 * All fields are optional — omitting them returns all users.
 */
export interface UserListFilters {
  search?: string
  department_id?: number | null
  user_level_tier_id?: number | null
  role?: Role | ""
  /** Allow-listed sort column: name | email | created_at */
  sort?: string
  direction?: "asc" | "desc"
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}

// ── Create user payload ───────────────────────────────────────────────────────

/**
 * Request body for POST /admin/users/create.
 * password_confirmation must match password.
 */
export interface CreateUserPayload {
  email: string
  name: string
  password: string
  password_confirmation: string
  department_id?: number | null
  /** Legacy single-manager field. Prefer `manager_ids`. */
  report_to?: number | null
  /** 1–2 manager user ids (max 2, no dupes, cannot include the user itself). */
  manager_ids?: number[]
  role?: Role
  user_level_tier_id?: number | null
}

// ── Update user payload ───────────────────────────────────────────────────────

/**
 * Request body for PUT /admin/users/update/{id}.
 * All fields are optional so callers can patch only changed fields.
 */
export interface UpdateUserPayload {
  email?: string
  name?: string | null
  password?: string | null
  password_confirmation?: string | null
  department_id?: number | null
  /** Legacy single-manager field. Prefer `manager_ids`. */
  report_to?: number | null
  /**
   * 1–2 manager user ids. Omit to leave managers unchanged; send [] to clear.
   */
  manager_ids?: number[]
  role?: Role
  user_level_tier_id?: number | null
}

// ── Zustand store state ───────────────────────────────────────────────────────

/** Shape of the Zustand users store */
export interface UsersState {
  /** Current page of users fetched from the API */
  users: UserListResource[]
  /** Pagination metadata for the current result set */
  meta: PaginationMeta | null
  /** Whether a list fetch is in-flight */
  isLoading: boolean
  /** Error message if the last fetch failed, null otherwise */
  error: string | null
  /** Currently applied filters (page, search, etc.) */
  filters: UserListFilters

  // ── Actions ────────────────────────────────────────────────────────────────
  fetchUsers: (filters?: UserListFilters) => Promise<void>
  setFilters: (filters: UserListFilters) => void
  clearError: () => void
}
