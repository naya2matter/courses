// ─── Online Course Assignment Service ───────────────────────────────────────
// HTTP calls for admin online-course assignments.

import { apiClient } from "@/lib/api"
import type {
  CreateOnlineCourseAssignmentPayload,
  CreateOnlineCourseAssignmentResult,
  OnlineCourseAssignmentFilters,
  OnlineCourseAssignmentListResponse,
  OnlineCourseAssignmentResource,
} from "../types/online-course-assignment.types"

type RawListResponse =
  | OnlineCourseAssignmentListResponse
  | {
      data?: OnlineCourseAssignmentResource[]
      links?: OnlineCourseAssignmentListResponse["links"]
      meta?: OnlineCourseAssignmentListResponse["meta"]
      cards?: OnlineCourseAssignmentListResponse["cards"]
    }

function buildQuery(filters: OnlineCourseAssignmentFilters): string {
  const params = new URLSearchParams()

  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters.course_online_id != null) {
    params.set("course_online_id", String(filters.course_online_id))
  }
  if (filters.user_id != null) params.set("user_id", String(filters.user_id))
  if (filters.search)    params.set("search", filters.search)
  if (filters.is_overdue != null) {
    params.set("is_overdue", filters.is_overdue ? "1" : "0")
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function normalizeList(raw: RawListResponse): OnlineCourseAssignmentListResponse {
  return {
    data: Array.isArray(raw.data) ? raw.data : [],
    links: raw.links ?? { first: null, last: null, prev: null, next: null },
    meta: raw.meta ?? {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: 15,
      to: null,
      total: 0,
      path: "",
    },
    cards: Array.isArray(raw.cards) ? raw.cards : [],
  }
}

export async function getOnlineCourseAssignments(
  filters: OnlineCourseAssignmentFilters = {},
): Promise<OnlineCourseAssignmentListResponse> {
  const query = buildQuery(filters)
  const raw = await apiClient.get<RawListResponse>(
    `/admin/online-course-assignments/getAll${query}`,
  )
  return normalizeList(raw)
}

export async function createOnlineCourseAssignments(
  payload: CreateOnlineCourseAssignmentPayload,
): Promise<CreateOnlineCourseAssignmentResult> {
  return apiClient.post<CreateOnlineCourseAssignmentResult>(
    "/admin/online-course-assignments/create",
    payload,
  )
}

export async function deleteOnlineCourseAssignment(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/online-course-assignments/delete/${id}`)
}
