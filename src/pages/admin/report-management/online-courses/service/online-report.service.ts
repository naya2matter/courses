// ─── Online Course Reporting Service ─────────────────────────────────────────

import { apiClient } from "@/lib/api"
import { downloadCsv, downloadFile, buildExportQuery, buildFileQuery } from "../../shared/download-csv"
import type {
  UserCourseDailyFilters,
  DeptCourseDailyFilters,
  SessionFactFilters,
  UserPerfFilters,
  UserCourseProgressFilters,
  DeptEvalFilters,
  PaginatedResponse,
  UserCourseDailyRow,
  DeptCourseDailyRow,
  SessionFactRow,
  UserPerformanceRow,
  UserCourseProgressRow,
  DeptEvalResponse,
} from "../types/online-report.types"

function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      // Laravel's `boolean` validation rule only accepts 1/0/"1"/"0" — not
      // "true"/"false" — so serialize booleans as "1"/"0" (e.g. is_suspicious).
      params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

// ── Datasets ──────────────────────────────────────────────────────────────────

export async function getUserCourseDaily(
  filters: Partial<UserCourseDailyFilters> = {},
): Promise<PaginatedResponse<UserCourseDailyRow>> {
  return apiClient.get(`/admin/reporting/datasets/user-course-daily${buildQuery(filters)}`)
}

export async function getDeptCourseDaily(
  filters: Partial<DeptCourseDailyFilters> = {},
): Promise<PaginatedResponse<DeptCourseDailyRow>> {
  return apiClient.get(`/admin/reporting/datasets/department-course-daily${buildQuery(filters)}`)
}

export async function getSessionFact(
  filters: Partial<SessionFactFilters> = {},
): Promise<PaginatedResponse<SessionFactRow>> {
  return apiClient.get(`/admin/reporting/datasets/session-fact${buildQuery(filters)}`)
}

/** GET /admin/reporting/datasets/session-fact/{id} — single record (404 if missing). */
export async function getSessionFactById(id: number): Promise<SessionFactRow> {
  const res = await apiClient.get<{ data: SessionFactRow }>(
    `/admin/reporting/datasets/session-fact/${id}`,
  )
  return res.data
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getUserPerformance(
  filters: Partial<UserPerfFilters> = {},
): Promise<PaginatedResponse<UserPerformanceRow>> {
  return apiClient.get(`/admin/reporting/user-performance${buildQuery(filters)}`)
}

/**
 * GET /admin/reporting/user-performance/{id} — single user's performance row.
 * {id} is the user id. Accepts the same optional filters as the list.
 */
export async function getUserPerformanceById(
  id: number,
  filters: Partial<UserPerfFilters> = {},
): Promise<UserPerformanceRow> {
  const res = await apiClient.get<{ data: UserPerformanceRow }>(
    `/admin/reporting/user-performance/${id}${buildQuery(filters)}`,
  )
  return res.data
}

export async function getUserCourseProgress(
  filters: Partial<UserCourseProgressFilters> = {},
): Promise<PaginatedResponse<UserCourseProgressRow>> {
  return apiClient.get(`/admin/reporting/user-course-progress${buildQuery(filters)}`)
}

export async function getDeptEvalPerformance(
  filters: Partial<DeptEvalFilters> = {},
): Promise<DeptEvalResponse> {
  return apiClient.get(`/admin/reporting/evaluation/department-performance${buildQuery(filters)}`)
}

// ── CSV Exports ───────────────────────────────────────────────────────────────

export const exportUserCourseDaily = (f: Partial<UserCourseDailyFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/user-course-daily${buildExportQuery(f as Record<string, unknown>)}`, "user-course-daily.csv")

export const exportDeptCourseDaily = (f: Partial<DeptCourseDailyFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/department-course-daily${buildExportQuery(f as Record<string, unknown>)}`, "dept-course-daily.csv")

export const exportSessionFact = (f: Partial<SessionFactFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/session-fact${buildExportQuery(f as Record<string, unknown>)}`, "session-fact.csv")

export const exportUserPerformance = (f: Partial<UserPerfFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/user-performance${buildExportQuery(f as Record<string, unknown>)}`, "user-performance.csv")

export const exportUserCourseProgress = (f: Partial<UserCourseProgressFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/user-course-progress${buildExportQuery(f as Record<string, unknown>)}`, "user-course-progress.csv")

/** Styled 2-sheet Excel workbook (Completed / Non-Completed KPIs). */
export const exportUserCourseProgressExcel = (f: Partial<UserCourseProgressFilters> = {}) =>
  downloadFile(`/admin/reporting/export/user-course-progress-excel${buildFileQuery(f as Record<string, unknown>)}`, "user-course-progress.xlsx")

export const exportDeptEvalPerformance = (f: Partial<DeptEvalFilters> = {}) =>
  downloadCsv(`/admin/reporting/export/evaluation/department-performance${buildExportQuery(f as Record<string, unknown>)}`, "dept-eval-performance.csv")
