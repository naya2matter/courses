// ─── PerformanceLevelBadge ────────────────────────────────────────────────────
// Renders a colored badge for each performance level.

import { Badge } from "@/components/ui/badge"
import type { EvaluationPerformanceLevel } from "../types/evaluation.types"

interface PerformanceLevelBadgeProps {
  performance_level?: EvaluationPerformanceLevel | null
}

const LEVEL_STYLES: Record<number, { className: string }> = {
  1: { className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  2: { className: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  3: { className: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  4: { className: "bg-red-500/20 text-red-300 border-red-500/30" },
}

export function PerformanceLevelBadge({ performance_level }: PerformanceLevelBadgeProps) {
  if (!performance_level) {
    return <Badge variant="outline" className="text-white/40 border-white/10">—</Badge>
  }

  const style = LEVEL_STYLES[performance_level.level] ?? { className: "bg-white/10 text-white/60" }

  return (
    <Badge variant="outline" className={style.className}>
      {performance_level.label}
    </Badge>
  )
}
