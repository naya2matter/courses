// ─── EvaluationTypeSummaryCards ───────────────────────────────────────────────
// Four aggregate stat cards computed across all types from all configs.
// Mirrors the visual style of EvaluationConfigSummaryCards.

import { BarChart2Icon, AlertTriangleIcon, TagsIcon, TrophyIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { EvaluationConfig, EvaluationConfigType } from "../types/evaluation-config.types"

// ── Types ──────────────────────────────────────────────────────────────────────

interface TypeCardDef {
  key: string
  title: string
  value: string | number
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deriveTypeCards(configs: EvaluationConfig[]): TypeCardDef[] {
  const all: EvaluationConfigType[] = configs.flatMap((c) => c.types ?? [])

  const total = all.length
  const highest =
    all.length > 0 ? Math.max(...all.map((t) => t.score_value)) : 0
  const zeroCount = all.filter((t) => t.score_value === 0).length
  const avg =
    all.length > 0
      ? (
          all.reduce((s, t) => s + t.score_value, 0) / all.length
        ).toFixed(1)
      : "0.0"

  return [
    {
      key: "total_types",
      title: "Total Types",
      value: total,
      Icon: TagsIcon,
      iconColor: "text-purple-400",
    },
    {
      key: "highest_score",
      title: "Highest Score",
      value: highest,
      Icon: TrophyIcon,
      iconColor: "text-green-400",
    },
    {
      key: "zero_score",
      title: "Zero Score",
      value: zeroCount,
      Icon: AlertTriangleIcon,
      iconColor: "text-red-400",
    },
    {
      key: "avg_score",
      title: "Avg Score",
      value: avg,
      Icon: BarChart2Icon,
      iconColor: "text-amber-400",
    },
  ]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <Skeleton className="h-12 w-12 rounded-xl mb-3" />
      <Skeleton className="h-9 w-10 mt-1" />
      <Skeleton className="h-3 w-20 mt-3" />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EvaluationTypeSummaryCardsProps {
  configs: EvaluationConfig[]
  isLoading: boolean
}

export function EvaluationTypeSummaryCards({
  configs,
  isLoading,
}: EvaluationTypeSummaryCardsProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </section>
    )
  }

  const cards = deriveTypeCards(configs)

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ key, title, value, Icon, iconColor }) => (
        <div
          key={key}
          className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl ring-1 ring-white/5 transition-colors hover:bg-white/10"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3">
            <Icon className={`size-6 ${iconColor}`} />
          </div>
          <p className="text-4xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
        </div>
      ))}
    </section>
  )
}
