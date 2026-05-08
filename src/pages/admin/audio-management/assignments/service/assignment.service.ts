// ─── Audio Assignment Service ────────────────────────────────────────────────
// Handles all HTTP requests for the Audio Assignments page.

import { apiClient } from "@/lib/api"
import type {
  AssignmentListFilters,
  AssignmentListResult,
  AssignmentSummaryCard,
  AudioAssignmentResource,
  CreateAssignmentPayload,
  CreateAssignmentResult,
  LaravelPaginated,
} from "../types/assignment.types"

type ListApiResponse =
  | AssignmentListResult
  | LaravelPaginated<AudioAssignmentResource>
  | { data?: AudioAssignmentResource[]; meta?: LaravelPaginated<AudioAssignmentResource>["meta"]; links?: LaravelPaginated<AudioAssignmentResource>["links"]; cards?: AssignmentSummaryCard[] }
  | AudioAssignmentResource[]

type CreateApiResponse =
  | {
      data?: AudioAssignmentResource[]
      skipped_user_ids?: number[]
    }
  | AudioAssignmentResource[]

function buildQuery(filters: AssignmentListFilters): string {
  const params = new URLSearchParams()

  if (filters.search?.trim()) params.set("search", filters.search.trim())
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.audio_id != null) params.set("audio_id", String(filters.audio_id))
  if (filters.user_id != null) params.set("user_id", String(filters.user_id))

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function normalizeListResponse(response: ListApiResponse): AssignmentListResult {
  // Case 1: endpoint returned array directly.
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: {
        current_page: 1,
        from: response.length > 0 ? 1 : null,
        last_page: 1,
        per_page: response.length,
        to: response.length > 0 ? response.length : null,
        total: response.length,
        path: "",
      },
      links: { first: null, last: null, prev: null, next: null },
    }
  }

  // Case 2: paginated object from Laravel resource collection.
  return {
    data: Array.isArray(response.data) ? response.data : [],
    meta: response.meta ?? {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    links: response.links ?? { first: null, last: null, prev: null, next: null },
    cards: Array.isArray((response as { cards?: AssignmentSummaryCard[] }).cards)
      ? (response as { cards?: AssignmentSummaryCard[] }).cards
      : [],
  }
}

function normalizeCreateResponse(response: CreateApiResponse): CreateAssignmentResult {
  if (Array.isArray(response)) {
    return { created: response, skippedUserIds: [] }
  }

  return {
    created: Array.isArray(response.data) ? response.data : [],
    skippedUserIds: Array.isArray(response.skipped_user_ids) ? response.skipped_user_ids : [],
  }
}

export async function getAllAssignments(
  filters: AssignmentListFilters = {},
): Promise<AssignmentListResult> {
  const query = buildQuery(filters)
  const response = await apiClient.get<ListApiResponse>(`/admin/audio-assignments/getAll${query}`)
  return normalizeListResponse(response)
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
): Promise<CreateAssignmentResult> {
  const response = await apiClient.post<CreateApiResponse>("/admin/audio-assignments/create", payload)
  return normalizeCreateResponse(response)
}

export async function deleteAssignment(id: number): Promise<void> {
  return apiClient.delete<void>(`/admin/audio-assignments/delete/${id}`)
}
