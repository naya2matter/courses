// ─── Live Course Reporting Service ───────────────────────────────────────────

import { apiClient } from "@/lib/api"
import { downloadCsv, buildExportQuery } from "../../shared/download-csv"
import type {
  RegistrationFilters,
  AttendanceFilters,
  CompletionFilters,
  PaginatedResponse,
  CourseRegistration,
  AttendanceRecord,
  CourseCompletion,
} from "../types/live-report.types"

function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export async function getCourseRegistrations(
  filters: Partial<RegistrationFilters> = {},
): Promise<PaginatedResponse<CourseRegistration>> {
  return apiClient.get(
    `/admin/reporting/live/course-registrations${buildQuery(filters)}`,
  )
}

export async function getAttendance(
  filters: Partial<AttendanceFilters> = {},
): Promise<PaginatedResponse<AttendanceRecord>> {
  return apiClient.get(
    `/admin/reporting/live/attendance${buildQuery(filters)}`,
  )
}

export async function getCourseCompletion(
  filters: Partial<CompletionFilters> = {},
): Promise<PaginatedResponse<CourseCompletion>> {
  return apiClient.get(
    `/admin/reporting/live/course-completion${buildQuery(filters)}`,
  )
}

export async function exportRegistrationsCsv(
  filters: Partial<RegistrationFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/live/course-registrations${buildExportQuery(filters as Record<string, unknown>)}`,
    "course-registrations.csv",
  )
}

export async function exportAttendanceCsv(
  filters: Partial<AttendanceFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/live/attendance${buildExportQuery(filters as Record<string, unknown>)}`,
    "attendance.csv",
  )
}

export async function exportCompletionCsv(
  filters: Partial<CompletionFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/live/course-completion${buildExportQuery(filters as Record<string, unknown>)}`,
    "course-completion.csv",
  )
}
