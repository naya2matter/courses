// ─── useEvaluations Hook ─────────────────────────────────────────────────────
// Manages fetching of the evaluation list and exposes refetch + state.

import { useState, useEffect, useCallback, useRef } from "react"
import { isApiError } from "@/lib/api"
import { getEvaluations } from "../service/evaluation.service"
import type { Evaluation, EvaluationFilters } from "../types/evaluation.types"

export interface UseEvaluationsResult {
  evaluations: Evaluation[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearError: () => void
}

export function useEvaluations(filters: Partial<EvaluationFilters>): UseEvaluationsResult {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchEvaluations = useCallback(async () => {
    // Cancel previous in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)
    try {
      const data = await getEvaluations(filters)
      setEvaluations(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false)
        return
      }
      let message = "Failed to load evaluations. Please try again."
      if (isApiError(err)) {
        message = err.message ?? message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.course_type,
    filters.department_id,
    filters.user_id,
    filters.performance_level,
    filters.start_date,
    filters.end_date,
  ])

  useEffect(() => {
    fetchEvaluations()
    return () => {
      abortRef.current?.abort()
    }
  }, [fetchEvaluations])

  return {
    evaluations,
    isLoading,
    error,
    refetch: fetchEvaluations,
    clearError: () => setError(null),
  }
}
