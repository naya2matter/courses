// ─── useQuizReport Hook ───────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import { getQuizAttempts } from "../service/quiz-report.service"
import type {
  QuizAttemptFilters,
  QuizAttemptRow,
  PaginationMeta,
} from "../types/quiz-report.types"

export const DEFAULT_QUIZ_FILTERS: QuizAttemptFilters = {
  quiz_id: "",
  status: "",
  department_id: "",
  user_id: "",
  date_from: "",
  date_to: "",
  page: 1,
  per_page: 15,
}

export interface UseQuizReportResult {
  data: QuizAttemptRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  filters: QuizAttemptFilters
  setFilters: (f: QuizAttemptFilters) => void
  setPage: (p: number) => void
  refetch: () => void
}

export function useQuizReport(): UseQuizReportResult {
  const [filters, setFiltersState] = useState<QuizAttemptFilters>(DEFAULT_QUIZ_FILTERS)
  const [data, setData] = useState<QuizAttemptRow[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (f: QuizAttemptFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getQuizAttempts(f)
      setData(res.data ?? [])
      setMeta(res.meta ?? null)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false)
        return
      }
      let msg = "Failed to load quiz attempts."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(filters) }, [filters, fetchData])

  return {
    data,
    meta,
    isLoading,
    error,
    filters,
    setFilters: setFiltersState,
    setPage: (p) => setFiltersState((f) => ({ ...f, page: p })),
    refetch: () => fetchData(filters),
  }
}
