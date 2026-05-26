import { apiClient } from "@/lib/api"
import type {
  UserEvaluationDetailResponse,
  UserEvaluationFilters,
  UserEvaluationListResponse,
} from "../types/user-evaluation.types"

export async function getMyEvaluations(
  filters?: Partial<Pick<UserEvaluationFilters, "page" | "per_page" | "course_type" | "performance_level" | "start_date" | "end_date">>,
): Promise<UserEvaluationListResponse> {
  const params = new URLSearchParams()

  if (filters?.page != null) params.set("page", String(filters.page))
  if (filters?.per_page != null) params.set("per_page", String(filters.per_page))
  if (filters?.course_type && filters.course_type !== "all") {
    params.set("course_type", filters.course_type)
  }
  if (filters?.performance_level && filters.performance_level !== "all") {
    params.set("performance_level", filters.performance_level)
  }
  if (filters?.start_date) params.set("start_date", filters.start_date)
  if (filters?.end_date) params.set("end_date", filters.end_date)

  const qs = params.toString()
  return apiClient.get<UserEvaluationListResponse>(
    `/user/evaluations/getAll${qs ? `?${qs}` : ""}`,
  )
}

export async function getMyEvaluationById(
  id: number,
): Promise<UserEvaluationDetailResponse> {
  return apiClient.get<UserEvaluationDetailResponse>(`/user/evaluations/getById/${id}`)
}
