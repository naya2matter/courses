// ─── Audio Category Service ────────────────────────────────────────────────────
// Handles all HTTP requests for the Audio Category feature.
// The shared apiClient automatically attaches the Bearer token from localStorage,
// so no manual Authorization header is needed here.

import { apiClient } from "@/lib/api"
import type {
  AudioCategoryResource,
  CategoryListResult,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  SummaryCard,
} from "../types/category.types"

type CategoriesApiResponse =
  | AudioCategoryResource[]
  | {
      data?: AudioCategoryResource[]
      cards?: SummaryCard[]
    }

/**
 * Normalise category list response to a strict array.
 * Some endpoints return { data: [...] } while others return [...].
 */
function normalizeCategoryList(response: CategoriesApiResponse): AudioCategoryResource[] {
  if (Array.isArray(response)) return response
  if (response && Array.isArray(response.data)) return response.data
  return []
}

function normalizeSummaryCards(response: CategoriesApiResponse): SummaryCard[] {
  if (!response || Array.isArray(response)) return []
  return Array.isArray(response.cards) ? response.cards : []
}

/**
 * Fetch all audio categories.
 * Endpoint: GET /admin/audio-categories/getAll
 *
 * Returns a plain array (not paginated) with optional summary cards.
 */
export async function getAllCategories(): Promise<CategoryListResult> {
  const response = await apiClient.get<CategoriesApiResponse>("/admin/audio-categories/getAll")
  return {
    items: normalizeCategoryList(response),
    cards: normalizeSummaryCards(response),
  }
}

/**
 * Create a new audio category.
 * Endpoint: POST /admin/audio-categories/create
 *
 * Returns the newly created AudioCategoryResource (HTTP 201).
 */
export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<AudioCategoryResource> {
  return apiClient.post<AudioCategoryResource>("/admin/audio-categories/create", payload)
}

/**
 * Update an existing audio category by its ID.
 * Endpoint: PUT /admin/audio-categories/update/{id}
 *
 * Only include the fields you want to change; all body fields are optional.
 * Returns the updated AudioCategoryResource (HTTP 200).
 */
export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload,
): Promise<AudioCategoryResource> {
  return apiClient.put<AudioCategoryResource>(`/admin/audio-categories/update/${id}`, payload)
}

/**
 * Delete an audio category by its ID.
 * Endpoint: DELETE /admin/audio-categories/delete/{id}
 *
 * Returns void on success (HTTP 200).
 */
export async function deleteCategory(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/audio-categories/delete/${id}`)
}
