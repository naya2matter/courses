// ─── KPI Overview Charts ──────────────────────────────────────────────────────
// Visualizes overview data: user completion donut + percentage metrics bars.

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type { KpiOverviewData } from "../types/kpi.types"

interface Props {
  data: KpiOverviewData | null
  isLoading: boolean
  error: string | null
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

// ── Shared custom tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: Record<string, unknown> }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const label = (item.payload as { label?: string; name?: string } | undefined)?.label ?? item.name ?? ""
  return (
    <div className="rounded-xl border border-white/12 bg-[#10101e]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white tabular-nums">{item.value}</p>
    </div>
  )
}

// ── Donut — Enrolled vs Completed ────────────────────────────────────────────

function CompletionDonut({ enrolled, completed }: { enrolled: number; completed: number }) {
  const remaining = Math.max(0, enrolled - completed)
  const pct = enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Remaining", value: remaining },
  ]

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/55">
        User Completion
      </p>
      <div className="relative">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              paddingAngle={2}
            >
              <Cell fill="#34d399" />
              <Cell fill="rgba(255,255,255,0.07)" />
            </Pie>
            {/* Tooltip disabled — the center label already shows the value */}
            <Tooltip content={() => null} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tabular-nums text-emerald-400">{pct}%</span>
          <span className="text-xs font-medium text-white/55">complete</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-white/75">{completed} completed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="text-white/50">{remaining} remaining</span>
        </div>
      </div>
    </div>
  )
}

// ── Radial bars — Percentage metrics ─────────────────────────────────────────

function MetricsRadial({
  completionRate,
  avgCompletionPct,
  avgAttention,
}: {
  completionRate: number
  avgCompletionPct: number
  avgAttention: number
}) {
  const data = [
    { name: "Avg Attention", value: avgAttention, fill: "#fbbf24" },
    { name: "Avg Completion %", value: avgCompletionPct, fill: "#2dd4bf" },
    { name: "Completion Rate", value: completionRate, fill: "#4ade80" },
  ]

  function RadialTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number }> }) {
    if (!active || !payload?.length) return null
    const item = payload[0]
    return (
      <div className="rounded-xl border border-white/12 bg-[#10101e]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
        <p className="text-xs text-white/50">{item.name}</p>
        <p className="text-sm font-semibold text-white tabular-nums">{Number(item.value).toFixed(1)}%</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/55">
        Performance Metrics
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius={20}
          outerRadius={70}
          barSize={14}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={6}
            background={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Tooltip content={<RadialTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
              <span className="text-white/65">{d.name}</span>
            </div>
            <span className="font-semibold tabular-nums" style={{ color: d.fill }}>
              {d.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Session & Activity Bar ────────────────────────────────────────────────────

function SessionsBar({
  sessions,
  enrolled,
  completed,
  suspicious,
}: {
  sessions: number
  enrolled: number
  completed: number
  suspicious: number
}) {
  const barData = [
    { label: "Sessions",   value: sessions,   fill: "#818cf8" },
    { label: "Enrolled",   value: enrolled,   fill: "#38bdf8" },
    { label: "Completed",  value: completed,  fill: "#34d399" },
    { label: "Suspicious", value: suspicious, fill: "#fb7185" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/55">
        Volume Breakdown
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {barData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
            ))}
          </Bar>
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={<ChartTooltip />}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {barData.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.fill }} />
            <span className="text-white/65">{d.label}</span>
            <span className="font-semibold tabular-nums text-white/85">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function KpiTrendsChart({ data, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-2xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/65">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/50">
        No data available.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-card p-5 sm:p-6 space-y-5">
      {/* Header with period badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-white/65">
          Metrics Breakdown
        </h2>
        {data.period && (
          <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/60">
            {fmtDate(data.period.from)} — {fmtDate(data.period.to)}
          </span>
        )}
      </div>

      {/* Three-panel chart grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex items-center justify-center rounded-xl border border-white/8 bg-white/3 p-5">
          <CompletionDonut
            enrolled={data.enrolled_users}
            completed={data.completed_users}
          />
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <MetricsRadial
            completionRate={data.completion_rate}
            avgCompletionPct={data.avg_completion_pct}
            avgAttention={data.avg_attention_score}
          />
        </div>

        <div className="rounded-xl border border-white/8 bg-white/3 p-5">
          <SessionsBar
            sessions={data.total_sessions}
            enrolled={data.enrolled_users}
            completed={data.completed_users}
            suspicious={data.suspicious_sessions}
          />
        </div>
      </div>
    </div>
  )
}
