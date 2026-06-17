import { useEffect, useMemo, useState } from "react"

import { isApiError } from "@/lib/api"
import { getUserLevelsWithTiers } from "../service/user.service"
import type { UserLevelWithTiers } from "../types/user.types"

export interface UserLevelTierOption {
  id: number
  tier_name: string
  tier_order: number
  level: {
    id: number
    name: string
    code: string
    hierarchy_level: number
  }
}

function flattenLevelTiers(levels: UserLevelWithTiers[]): UserLevelTierOption[] {
  return levels
    .slice()
    .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
    .flatMap((level) =>
      (level.tiers ?? [])
        .slice()
        .sort((a, b) => a.tier_order - b.tier_order)
        .map((tier) => ({
          id: tier.id,
          tier_name: tier.tier_name,
          tier_order: tier.tier_order,
          level: {
            id: level.id,
            name: level.name,
            code: level.code,
            hierarchy_level: level.hierarchy_level,
          },
        })),
    )
}

export function useUserLevelTierOptions() {
  const [levels, setLevels] = useState<UserLevelWithTiers[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError(null)

    getUserLevelsWithTiers()
      .then((res) => {
        if (cancelled) return
        setLevels(Array.isArray(res.data) ? res.data : [])
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return

        if (isApiError(err)) {
          setError(err.message ?? "Failed to load user level tiers.")
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError("Failed to load user level tiers.")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const tiers = useMemo(() => flattenLevelTiers(levels), [levels])

  return {
    levels,
    tiers,
    isLoadingTierOptions: isLoading,
    tierOptionsError: error,
  }
}
