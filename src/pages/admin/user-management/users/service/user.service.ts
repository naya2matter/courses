// ─── User Service ─────────────────────────────────────────────────────────────
// Handles all HTTP requests for the Users feature.
// The shared apiClient attaches the Bearer token automatically.

import { apiClient } from "@/lib/api"
import type {
  CreateUserPayload,
  LaravelPaginated,
  UserListFilters,
  UserListResource,
  UserResource,
  UpdateUserPayload,
} from "../types/user.types"

/**
 * Build a query string from a filters object, omitting undefined/null/empty
 * values so the backend only receives the params that are actually set.
 */
function buildQuery(filters: UserListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim())
  }
  if (filters.department_id != null) {
    params.set("department_id", String(filters.department_id))
  }
  if (filters.user_level_tier_id != null) {
    params.set("user_level_tier_id", String(filters.user_level_tier_id))
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

/**
 * Fetch a paginated list of users.
 * Endpoint: GET /admin/users/getAll
 *
 * All filter fields are optional; omitting them returns page 1 with the
 * default server per_page value.
 */
export async function getAllUsers(
  filters: UserListFilters = {},
): Promise<LaravelPaginated<UserListResource>> {
  const query = buildQuery(filters)
  return apiClient.get<LaravelPaginated<UserListResource>>(
    `/admin/users/getAll${query}`,
  )
}

/**
 * Create a new user.
 * Endpoint: POST /admin/users/create
 *
 * Returns the newly created user wrapped in a Laravel resource envelope.
 */
export async function createUser(
  payload: CreateUserPayload,
): Promise<UserListResource> {
  return apiClient.post<UserListResource>("/admin/users/create", payload)
}

/**
 * Update an existing user.
 * Endpoint: PUT /admin/users/update/{id}
 *
 * Returns the updated user resource (unwrapped from the { data: {...} } envelope).
 */
export async function updateUser(
  id: number,
  payload: UpdateUserPayload,
): Promise<UserResource> {
  const res = await apiClient.put<{ data: UserResource }>(
    `/admin/users/update/${id}`,
    payload,
  )
  return res.data
}

/**
 * Soft-delete a user.
 * Endpoint: DELETE /admin/users/delete/{id}
 */
export async function deleteUser(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/users/delete/${id}`)
}
