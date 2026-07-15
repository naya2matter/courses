// ─── Monthly Comparison Panel ─────────────────────────────────────────────────
// "This month vs last month" — one card per metric with a change % delta pill.

import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type {
  ComparisonMetric,
  ComparisonMetricKey,
  MonthlyComparison,
} from "../types/monthly-kpi.types"

interface Props {
  data: MonthlyComparison | null
  isLoading: boolean
  error: string | null
}

type MetricFormat = "number" | "duration" | "percent" | "score"

const METRIC_META: { key: ComparisonMetricKey; label: string; format: MetricFormat }[] = [
  { key: "sessions", label: "Sessions", format: "number" },
  { key: "active_users", label: "Active Users", format: "number" },
  { key: "active_seconds", label: "Active Time", format: "duration" },
  { key: "avg_completion_pct", label: "Avg Completion", format: "percent" },
  { key: "avg_attention_score", label: "Avg Attention", format: "score" },
  { key: "suspicious_sessions", label: "Suspicious", format: "number" },
]

// Metrics where a decrease is the healthy direction (green when down).
const LOWER_IS_BETTER = new Set<ComparisonMetricKey>(["suspicious_sessions"])

function fmtValue(v: number, format: MetricFormat): string {
  switch (format) {
    case "duration": {
      const h = Math.floor(v / 3600)
      const m = Math.floor((v % 3600) / 60)
      if (h === 0) return `${m}m`
      return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    case "percent":
      return `${Number(v).toFixed(1)}%`
    case "score":
      return Number(v).toFixed(1)
    default:
      return String(v)
  }
}

function DeltaPill({ metric, metricKey }: { metric: ComparisonMetric; metricKey: ComparisonMetricKey }) {
  const { change, change_pct } = metric

  // No previous baseline → percentage is undefined.
  if (change_pct === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/40">
        <ArrowRightIcon className="size-3" />
        —
      </span>
    )
  }

  const flat = change === 0
  const isUp = change > 0
  // "Good" depends on the metric's direction.
  const isGood = flat ? true : LOWER_IS_BETTER.has(metricKey) ? !isUp : isUp

  const cls = flat
    ? "border-white/10 bg-white/5 text-white/40"
    : isGood
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
      : "border-rose-500/30 bg-rose-500/10 text-rose-400"

  const Icon = flat ? ArrowRightIcon : isUp ? ArrowUpRightIcon : ArrowDownRightIcon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      <Icon className="size-3" />
      {isUp ? "+" : ""}{Number(change_pct).toFixed(1)}%
    </span>
  )
}

export function MonthlyComparisonPanel({ data, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/50">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/40">
        No comparison data available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Period header */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-white/50">
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          {data.current_label}
        </span>
        <span className="text-white/30">vs</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">
          {data.previous_label}
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRIC_META.map(({ key, label, format }) => {
          const metric = data.metrics[key]
          if (!metric) return null
          return (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-card px-5 py-4 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/55">
                  {label}
                </p>
                <DeltaPill metric={metric} metricKey={key} />
              </div>
              <p className="text-2xl font-extrabold tabular-nums leading-none text-white">
                {fmtValue(metric.current, format)}
              </p>
              <p className="text-sm text-white/50">
                was <span className="tabular-nums text-white/70">{fmtValue(metric.previous, format)}</span> last month
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
