// ─── EvaluationHistorySummaryCards ───────────────────────────────────────────
// Six stat cards above the list: total evals, avg score, and one per
// performance level bucket.  Uses analytics when available; falls back to
// computing from the visible list entries.

import {
  ClipboardListIcon,
  TrendingUpIcon,
  StarIcon,
  ShieldCheckIcon,
  ActivityIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  EvaluationHistoryEntry,
  EvaluationHistoryAnalytics,
} from "../types/evaluation-history.types"

// ── Card definition ───────────────────────────────────────────────────────────

interface CardDef {
  key: string
  title: string
  value: string
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

function buildCards(
  analytics: EvaluationHistoryAnalytics | null,
  entries: EvaluationHistoryEntry[],
): CardDef[] {
  if (analytics) {
    const dist = analytics.performance_distribution ?? []
    function levelCount(label: string): number {
      return dist.find((d) => d.label === label)?.count ?? 0
    }

    return [
      {
        key: "total",
        title: "Total Evaluations",
        value: fmt(analytics.total_evaluations),
        Icon: ClipboardListIcon,
        iconColor: "text-primary",
      },
      {
        key: "avg",
        title: "Average Score",
        value: fmt(Number(analytics.average_score), 2),
        Icon: TrendingUpIcon,
        iconColor: "text-sky-400",
      },
      {
        key: "outstanding",
        title: "Outstanding",
        value: fmt(levelCount("Outstanding")),
        Icon: StarIcon,
        iconColor: "text-emerald-400",
      },
      {
        key: "reliable",
        title: "Reliable",
        value: fmt(levelCount("Reliable")),
        Icon: ShieldCheckIcon,
        iconColor: "text-blue-400",
      },
      {
        key: "developing",
        title: "Developing",
        value: fmt(levelCount("Developing")),
        Icon: ActivityIcon,
        iconColor: "text-amber-400",
      },
      {
        key: "underperforming",
        title: "Underperforming",
        value: fmt(levelCount("Underperforming")),
        Icon: AlertTriangleIcon,
        iconColor: "text-red-400",
      },
    ]
  }

  // ── Fallback: compute from visible list entries ────────────────────────────
  const total = entries.length
  const avg =
    total > 0
      ? entries.reduce((s, e) => s + e.total_score, 0) / total
      : 0

  function countLabel(label: string) {
    return entries.filter((e) => e.performance_level?.label === label).length
  }

  return [
    {
      key: "total",
      title: "Total (Page)",
      value: fmt(total),
      Icon: ClipboardListIcon,
      iconColor: "text-primary",
    },
    {
      key: "avg",
      title: "Average Score",
      value: fmt(avg, 2),
      Icon: TrendingUpIcon,
      iconColor: "text-sky-400",
    },
    {
      key: "outstanding",
      title: "Outstanding",
      value: fmt(countLabel("Outstanding")),
      Icon: StarIcon,
      iconColor: "text-emerald-400",
    },
    {
      key: "reliable",
      title: "Reliable",
      value: fmt(countLabel("Reliable")),
      Icon: ShieldCheckIcon,
      iconColor: "text-blue-400",
    },
    {
      key: "developing",
      title: "Developing",
      value: fmt(countLabel("Developing")),
      Icon: ActivityIcon,
      iconColor: "text-amber-400",
    },
    {
      key: "underperforming",
      title: "Underperforming",
      value: fmt(countLabel("Underperforming")),
      Icon: AlertTriangleIcon,
      iconColor: "text-red-400",
    },
  ]
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center p-4">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Skeleton className="h-5 w-5 rounded-sm" />
      </div>
      <Skeleton className="h-10 w-24" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface EvaluationHistorySummaryCardsProps {
  analytics: EvaluationHistoryAnalytics | null
  entries: EvaluationHistoryEntry[]
  isLoading: boolean
}

export function EvaluationHistorySummaryCards({
  analytics,
  entries,
  isLoading,
}: EvaluationHistorySummaryCardsProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </section>
    )
  }

  const cards = buildCards(analytics, entries)

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(({ key, title, value, Icon, iconColor }) => (
        <div
          key={key}
          className="flex flex-col items-center text-center p-4"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
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
