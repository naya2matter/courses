import { Badge } from "@/components/ui/badge"
import type { UserEvaluationPerformanceLevel } from "../types/user-evaluation.types"

const FALLBACK_LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: {
    bg: "rgba(76, 175, 80, 0.18)",
    text: "#8CE99A",
    border: "rgba(76, 175, 80, 0.35)",
  },
  2: {
    bg: "rgba(33, 150, 243, 0.18)",
    text: "#90CAF9",
    border: "rgba(33, 150, 243, 0.35)",
  },
  3: {
    bg: "rgba(255, 152, 0, 0.18)",
    text: "#FFCC80",
    border: "rgba(255, 152, 0, 0.35)",
  },
  4: {
    bg: "rgba(244, 67, 54, 0.18)",
    text: "#EF9A9A",
    border: "rgba(244, 67, 54, 0.35)",
  },
}

function withAlpha(color: string, alphaHex: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return `${color}${alphaHex}`
  return color
}

interface UserPerformanceLevelBadgeProps {
  level?: UserEvaluationPerformanceLevel | null
  className?: string
}

export function UserPerformanceLevelBadge({
  level,
  className,
}: UserPerformanceLevelBadgeProps) {
  if (!level) {
    return (
      <Badge variant="outline" className={className}>
        Unrated
      </Badge>
    )
  }

  const fallback = FALLBACK_LEVEL_COLORS[level.level] ?? {
    bg: "rgba(148, 163, 184, 0.18)",
    text: "#CBD5E1",
    border: "rgba(148, 163, 184, 0.35)",
  }

  const style = level.color
    ? {
        backgroundColor: withAlpha(level.color, "22"),
        color: level.color,
        borderColor: withAlpha(level.color, "4A"),
      }
    : {
        backgroundColor: fallback.bg,
        color: fallback.text,
        borderColor: fallback.border,
      }

  return (
    <Badge
      variant="outline"
      className={[
        "inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-semibold",
        className ?? "",
      ].join(" ")}
      style={style}
      aria-label={`Performance level ${level.level}: ${level.label}`}
    >
      <span aria-hidden="true">L{level.level}</span>
      <span>{level.label}</span>
    </Badge>
  )
}
