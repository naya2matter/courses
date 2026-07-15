// ─── Monthly KPI Panel ────────────────────────────────────────────────────────
// Trend chart across months + a department breakdown table.

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { MonthlyKpiData } from "../types/monthly-kpi.types"

interface Props {
  data: MonthlyKpiData | null
  isLoading: boolean
  error: string | null
}

const TOOLTIP_STYLE = {
  background: "#0f0f1a",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "10px",
  fontSize: 12,
  color: "#fff",
} as const

function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function MonthlyKpiPanel({ data, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-72 w-full rounded-2xl bg-white/5" />
        <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
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

  const overview = data?.overview ?? []
  const byDept = data?.by_department ?? []

  if (overview.length === 0 && byDept.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-white/10 bg-card text-sm text-white/40">
        No data for the selected period.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Trend chart ── */}
      <div className="rounded-2xl border border-white/8 bg-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/65">
          Monthly Trend
        </h2>
        {overview.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-white/40">
            No monthly data.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={overview} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} />
              <YAxis yAxisId="left" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: "rgba(255,255,255,0.85)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }} />
              <Bar yAxisId="left" dataKey="sessions" name="Sessions" fill="#818cf8" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="active_users" name="Active Users" fill="#38bdf8" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" dataKey="avg_completion_pct" name="Avg Completion %" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Department breakdown ── */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
        <div className="border-b border-white/8 px-5 py-3.5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
            By Department
          </h2>
        </div>
        {byDept.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/40">
            No department data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-white/40">Month</TableHead>
                  <TableHead className="text-white/40">Department</TableHead>
                  <TableHead className="text-right text-white/40">Enrolled</TableHead>
                  <TableHead className="text-right text-white/40">Active</TableHead>
                  <TableHead className="text-right text-white/40">Completed</TableHead>
                  <TableHead className="text-right text-white/40">Avg Progress</TableHead>
                  <TableHead className="text-right text-white/40">Active Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDept.map((r, i) => (
                  <TableRow key={`${r.period}-${r.department_id}-${i}`} className="border-white/5 hover:bg-white/3">
                    <TableCell className="text-white/60">{r.label}</TableCell>
                    <TableCell className="font-medium text-white">{r.department_name}</TableCell>
                    <TableCell className="text-right tabular-nums text-white/70">{r.enrolled_users}</TableCell>
                    <TableCell className="text-right tabular-nums text-white/70">{r.active_users}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-400">{r.completed_users}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Number(r.avg_progress))}%` }} />
                        </div>
                        <span className="text-[11px] tabular-nums text-white/50">{Number(r.avg_progress).toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-white/70">{fmtSeconds(r.total_active_seconds)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
