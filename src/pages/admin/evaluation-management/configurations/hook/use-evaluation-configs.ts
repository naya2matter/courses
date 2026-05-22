// ─── useEvaluationConfigs Hook ────────────────────────────────────────────────
// Fetches the configs list on mount and exposes a refetch + error helpers.
// Uses local component state — no global store required for this feature.

import { useState, useEffect, useCallback } from "react"
import { isApiError } from "@/lib/api"
import { getEvaluationConfigs } from "../service/evaluation-config.service"
import type { EvaluationConfig } from "../types/evaluation-config.types"

export interface UseEvaluationConfigsResult {
  configs: EvaluationConfig[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearError: () => void
}

export function useEvaluationConfigs(): UseEvaluationConfigsResult {
  const [configs, setConfigs] = useState<EvaluationConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getEvaluationConfigs()
      setConfigs(data)
    } catch (err) {
      // Ignore in-flight cancellations — not a user-visible error
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsLoading(false)
        return
      }
      let message = "Failed to load evaluation configs. Please try again."
      if (isApiError(err)) {
        message = err.message ?? message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  return {
    configs,
    isLoading,
    error,
    refetch: fetchConfigs,
    clearError: () => setError(null),
  }
}
