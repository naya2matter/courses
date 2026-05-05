// ─── Department Service ───────────────────────────────────────────────────────
// Responsible for all HTTP calls related to departments.
// Uses the shared apiClient so auth tokens are handled automatically.

import { apiClient } from "@/lib/api"
import type { Department, DepartmentsApiResponse, DepartmentMutationPayload } from "../types/department.types"

/**
 * Fetch all departments from the backend.
 * Endpoint: GET /admin/departments/getAll
 *
 * The API may return either an envelope { data: [...] } or a plain array.
 * We normalise both shapes so the store always works with Department[].
 */
export async function getAllDepartments(): Promise<Department[]> {
  const response = await apiClient.get<DepartmentsApiResponse | Department[]>(
    "/admin/departments/getAll",
  )

  // Normalise: handle both { data: [...] } and plain array responses
  if (Array.isArray(response)) {
    return response
  }

  // Envelope shape
  if (response && Array.isArray(response.data)) {
    return response.data
  }

  // Unexpected shape – return empty list rather than crashing
  return []
}

/**
 * Create a new department.
 * Endpoint: POST /admin/departments/create
 */
export async function createDepartment(payload: DepartmentMutationPayload): Promise<Department> {
  return apiClient.post<Department>("/admin/departments/create", payload)
}

/**
 * Update an existing department by ID.
 * Endpoint: PUT /admin/departments/update/{id}
 */
export async function updateDepartment(id: number, payload: DepartmentMutationPayload): Promise<Department> {
  return apiClient.put<Department>(`/admin/departments/update/${id}`, payload)
}

/**
 * Delete a department by ID.
 * Endpoint: DELETE /admin/departments/delete/{id}
 */
export async function deleteDepartment(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/departments/delete/${id}`)
}
