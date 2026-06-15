// ─── Quiz Reporting Service ───────────────────────────────────────────────────

import { apiClient } from "@/lib/api"
import { downloadCsv, buildExportQuery } from "../../shared/download-csv"
import type {
  QuizAttemptFilters,
  QuizDetailedExportFilters,
  PaginatedResponse,
  QuizAttemptRow,
} from "../types/quiz-report.types"

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

export async function getQuizAttempts(
  filters: Partial<QuizAttemptFilters> = {},
): Promise<PaginatedResponse<QuizAttemptRow>> {
  return apiClient.get(
    `/admin/reporting/quiz/attempts${buildQuery(filters)}`,
  )
}

export async function exportQuizAttemptsCsv(
  filters: Partial<QuizAttemptFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/quiz/attempts${buildExportQuery(filters as Record<string, unknown>)}`,
    "quiz-attempts.csv",
  )
}

export async function exportQuizDetailedCsv(
  filters: Partial<QuizDetailedExportFilters> = {},
): Promise<void> {
  return downloadCsv(
    `/admin/reporting/export/quiz/detailed${buildExportQuery(filters as Record<string, unknown>)}`,
    "quiz-detailed.csv",
  )
}
