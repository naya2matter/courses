// ─── KPI Trends Chart ─────────────────────────────────────────────────────────

import { useMemo } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type { KpiTrendPoint } from "../types/kpi.types"

interface Props {
  data: KpiTrendPoint[]
  isLoading: boolean
  error: string | null
}

function fmt(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const LINE_CFG = [
  { key: "sessions", label: "Sessions", color: "#818cf8" },
  { key: "completions", label: "Completions", color: "#34d399" },
  { key: "active_users", label: "Active Users", color: "#a78bfa" },
  { key: "avg_attention_score", label: "Avg Attention", color: "#fbbf24" },
] as const

export function KpiTrendsChart({ data, isLoading, error }: Props) {
  const chartData = useMemo(
    () => data.map((p) => ({ ...p, date: fmt(p.date) })),
    [data],
  )

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl bg-white/5" />
  }

  if (error) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/50">
        {error}
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/40">
        No trend data for the selected period.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-card p-4 sm:p-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-white/50">
        Daily Trends
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0f0f1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: 12,
            }}
            itemStyle={{ color: "rgba(255,255,255,0.8)" }}
            labelStyle={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.5)", paddingTop: 12 }}
          />
          {LINE_CFG.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
