// ─── Refresh Log Hook ─────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react"
import { getRefreshLog } from "../service/refresh.service"
import type { RefreshLogEntry } from "../types/refresh.types"

export function useRefreshLog() {
  const [data, setData] = useState<RefreshLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getRefreshLog(50)
      setData(Array.isArray(res) ? res : [])
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Failed to load refresh log.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, isLoading, error, refetch: fetch }
}
