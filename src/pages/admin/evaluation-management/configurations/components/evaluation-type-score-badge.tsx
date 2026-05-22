// ─── EvaluationTypeScoreBadge ─────────────────────────────────────────────────
// Colored badge for a type's score_value.
// Color is relative to the parent config's max_score when provided, otherwise
// falls back to absolute thresholds.

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface EvaluationTypeScoreBadgeProps {
  score: number
  maxScore?: number
  className?: string
}

export function EvaluationTypeScoreBadge({
  score,
  maxScore,
  className,
}: EvaluationTypeScoreBadgeProps) {
  let colorClasses: string

  if (score === 0) {
    colorClasses = "border-red-500/30 bg-red-500/15 text-red-400"
  } else if (maxScore && maxScore > 0) {
    const ratio = score / maxScore
    if (ratio >= 0.7) {
      colorClasses = "border-green-500/30 bg-green-500/15 text-green-400"
    } else if (ratio >= 0.35) {
      colorClasses = "border-amber-500/30 bg-amber-500/15 text-amber-400"
    } else {
      colorClasses = "border-orange-500/30 bg-orange-500/15 text-orange-400"
    }
  } else {
    // Absolute thresholds when maxScore is not provided
    if (score >= 8) {
      colorClasses = "border-green-500/30 bg-green-500/15 text-green-400"
    } else if (score >= 4) {
      colorClasses = "border-amber-500/30 bg-amber-500/15 text-amber-400"
    } else {
      colorClasses = "border-orange-500/30 bg-orange-500/15 text-orange-400"
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        colorClasses,
        "font-mono font-semibold tabular-nums",
        className,
      )}
    >
      {score}
    </Badge>
  )
}
