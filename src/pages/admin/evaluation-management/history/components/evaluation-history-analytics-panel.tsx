// ─── EvaluationHistoryAnalyticsPanel ─────────────────────────────────────────
// Three sections: Performance Distribution, Monthly Trends, Top Categories.
// Uses Recharts via shadcn ChartContainer for consistent dark-theme rendering.

import { AlertCircleIcon } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type {
  EvaluationHistoryAnalytics,
  PerformanceDistributionItem,
  MonthlyTrendItem,
  TopCategoryItem,
} from "../types/evaluation-history.types"

// ── Shared helpers ────────────────────────────────────────────────────────────

function fmt(n: number | string, decimals = 2): string {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

interface ChartTooltipPayload {
  name: string
  value: number | string
  color?: string
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      {label && <p className="mb-1 font-medium text-white/80">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? "#a3a3a3" }}>
          {p.name}: <span className="font-semibold">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ── Section: Performance Distribution ────────────────────────────────────────

function PerformanceDistributionChart({
  data,
}: {
  data: PerformanceDistributionItem[]
}) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No distribution data.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.level} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color || "#6b7280" }}
              />
              <span className="font-medium text-foreground">{item.label}</span>
              <span className="text-muted-foreground">
                score {item.range.min}–{item.range.max}
              </span>
            </div>
            <span className="tabular-nums text-muted-foreground">
              {item.count} ({fmt(item.percentage, 1)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, item.percentage)}%`,
                backgroundColor: item.color || "#6b7280",
                opacity: 0.8,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Section: Monthly Trends ───────────────────────────────────────────────────

function MonthlyTrendsChart({ data }: { data: MonthlyTrendItem[] }) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No trend data available.
      </p>
    )
  }

  const chartData = data.map((d) => ({
    month: d.month,
    Evaluations: d.count,
    "Avg Score": Number(Number(d.avg_score).toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<DarkTooltip />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="Evaluations"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={{ fill: "#60a5fa", r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="Avg Score"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ fill: "#34d399", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Section: Top Categories ───────────────────────────────────────────────────

function TopCategoriesList({ data }: { data: TopCategoryItem[] }) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No category data available.
      </p>
    )
  }

  const chartData = data.map((d) => ({
    name: d.name,
    "Avg Score": Number(Number(d.avg_score).toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="rgba(255,255,255,0.06)"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<DarkTooltip />} />
        <Bar dataKey="Avg Score" fill="#a78bfa" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Panel skeleton ────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface EvaluationHistoryAnalyticsPanelProps {
  analytics: EvaluationHistoryAnalytics | null
  isLoading: boolean
  error: string | null
}

export function EvaluationHistoryAnalyticsPanel({
  analytics,
  isLoading,
  error,
}: EvaluationHistoryAnalyticsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
        <AlertCircleIcon className="size-4 shrink-0 text-amber-400" />
        <span>Analytics unavailable: {error}</span>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Section title="Performance Distribution">
        <PerformanceDistributionChart data={analytics.performance_distribution} />
      </Section>

      <Section title="Monthly Trends">
        <MonthlyTrendsChart data={analytics.monthly_trends} />
      </Section>

      <Section title="Top Categories">
        <TopCategoriesList data={analytics.top_categories} />
      </Section>
    </div>
  )
}
