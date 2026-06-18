// ─── KPI Overview Cards ───────────────────────────────────────────────────────

import {
  ActivityIcon,
  BrainIcon,
  CheckCircle2Icon,
  ClockIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { KpiOverviewData } from "../types/kpi.types"

// Convert seconds → "Xh Ym"
function fmtSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface StatConfig {
  key: keyof KpiOverviewData
  label: string
  icon: React.ElementType
  color: string
  glow: string
  ring: string
  format?: (v: number) => string
}

const STATS: StatConfig[] = [
  {
    key: "total_sessions",
    label: "Total Sessions",
    icon: ActivityIcon,
    color: "text-indigo-400",
    glow: "0 8px 24px rgba(99,102,241,0.35)",
    ring: "rgba(99,102,241,0.25)",
  },
  {
    key: "total_active_seconds",
    label: "Active Time",
    icon: ClockIcon,
    color: "text-violet-400",
    glow: "0 8px 24px rgba(139,92,246,0.35)",
    ring: "rgba(139,92,246,0.25)",
    format: fmtSeconds,
  },
  {
    key: "enrolled_users",
    label: "Enrolled Users",
    icon: UsersIcon,
    color: "text-sky-400",
    glow: "0 8px 24px rgba(56,189,248,0.3)",
    ring: "rgba(56,189,248,0.20)",
  },
  {
    key: "completed_users",
    label: "Completed Users",
    icon: UserCheckIcon,
    color: "text-emerald-400",
    glow: "0 8px 24px rgba(16,185,129,0.3)",
    ring: "rgba(16,185,129,0.20)",
  },
  {
    key: "avg_completion_pct",
    label: "Avg Completion",
    icon: TrendingUpIcon,
    color: "text-teal-400",
    glow: "0 8px 24px rgba(45,212,191,0.3)",
    ring: "rgba(45,212,191,0.20)",
    format: (v) => `${Number(v).toFixed(1)}%`,
  },
  {
    key: "completion_rate",
    label: "Completion Rate",
    icon: CheckCircle2Icon,
    color: "text-green-400",
    glow: "0 8px 24px rgba(74,222,128,0.3)",
    ring: "rgba(74,222,128,0.20)",
    format: (v) => `${Number(v).toFixed(0)}%`,
  },
  {
    key: "avg_attention_score",
    label: "Avg Attention",
    icon: BrainIcon,
    color: "text-amber-400",
    glow: "0 8px 24px rgba(251,191,36,0.3)",
    ring: "rgba(251,191,36,0.20)",
    format: (v) => `${Number(v).toFixed(1)}`,
  },
  {
    key: "suspicious_sessions",
    label: "Suspicious",
    icon: ShieldAlertIcon,
    color: "text-rose-400",
    glow: "0 8px 24px rgba(251,113,133,0.3)",
    ring: "rgba(251,113,133,0.20)",
  },
]

interface Props {
  data: KpiOverviewData | null
  isLoading: boolean
}

export function KpiOverviewCards({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-card px-4 py-5">
            <Skeleton className="h-10 w-10 rounded-xl bg-white/8" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-14 bg-white/8" />
              <Skeleton className="h-3 w-20 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {STATS.map((s) => {
        const raw = data ? (data[s.key] as number) ?? 0 : 0
        const display = s.format ? s.format(raw) : String(raw)
        return (
          <div
            key={s.key}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/5 bg-card px-4 py-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15"
          >
            <div
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-transform duration-300 group-hover:scale-110"
              style={{ boxShadow: s.glow, outline: `1px solid ${s.ring}` }}
            >
              <s.icon className={`size-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-extrabold tabular-nums leading-none ${s.color}`}>
                {display}
              </p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {s.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
