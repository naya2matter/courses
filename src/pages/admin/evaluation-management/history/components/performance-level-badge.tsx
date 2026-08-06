// ─── PerformanceLevelBadge ────────────────────────────────────────────────────
// Reusable badge for displaying a performance level label.
// Uses the backend color when provided; falls back to a level-based palette.
// Ensures readable contrast on dark backgrounds.

import type { EvaluationHistoryPerformanceLevel } from "../types/evaluation-history.types"

interface PerformanceLevelBadgeProps {
  /** Null when the evaluation has no score/level assigned yet. */
  level: EvaluationHistoryPerformanceLevel | null
  /** Extra class names */
  className?: string
}

/** Palette used when no backend color is present. Level 1 = best. */
function fallbackStyle(level: number): string {
  switch (level) {
    case 1:
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    case 2:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30"
    case 3:
      return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    default:
      return "bg-red-500/20 text-red-300 border-red-500/30"
  }
}

export function PerformanceLevelBadge({
  level,
  className = "",
}: PerformanceLevelBadgeProps) {
  if (!level) {
    return (
      <span
        className={`inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/40 ${className}`}
        aria-label="Performance level: not scored"
      >
        Not scored
      </span>
    )
  }

  if (level.color) {
    // Backend-supplied colour — keep the hue but render translucent so it
    // remains legible on dark glass cards.
    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
        style={{
          backgroundColor: `${level.color}26`,  // ~15 % opacity
          borderColor: `${level.color}66`,       // ~40 % opacity
          color: level.color,
        }}
        aria-label={`Performance level: ${level.label}`}
      >
        {level.label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${fallbackStyle(level.level)} ${className}`}
      aria-label={`Performance level: ${level.label}`}
    >
      {level.label}
    </span>
  )
}
