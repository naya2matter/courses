// ─── Department Service ───────────────────────────────────────────────────────
// Responsible for all HTTP calls related to departments.
// Uses the shared apiClient so auth tokens are handled automatically.

import { apiClient } from "@/lib/api"
import type { Department, DepartmentCard, DepartmentsApiResponse, DepartmentMutationPayload } from "../types/department.types"

/**
 * Fetch all departments from the backend.
 * Endpoint: GET /admin/departments/getAll
 *
 * The API may return either an envelope { data: [...], cards: [...] } or a plain array.
 * We normalise both shapes so the store always receives { departments, cards }.
 */
export async function getAllDepartments(): Promise<{ departments: Department[]; cards: DepartmentCard[] }> {
  const response = await apiClient.get<DepartmentsApiResponse | Department[]>(
    "/admin/departments/getAll",
  )

  // Plain array (no envelope)
  if (Array.isArray(response)) {
    return { departments: response, cards: [] }
  }

  // Envelope shape
  if (response && Array.isArray(response.data)) {
    return { departments: response.data, cards: response.cards ?? [] }
  }

  return { departments: [], cards: [] }
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
