// ─── KPI Overview Cards ───────────────────────────────────────────────────────

import {
  ActivityIcon,
  BrainIcon,
  CheckCircle2Icon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { KpiOverviewData } from "../types/kpi.types"

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
    key: "total_completions",
    label: "Completions",
    icon: CheckCircle2Icon,
    color: "text-emerald-400",
    glow: "0 8px 24px rgba(16,185,129,0.3)",
    ring: "rgba(16,185,129,0.20)",
  },
  {
    key: "active_users",
    label: "Active Users",
    icon: UsersIcon,
    color: "text-violet-400",
    glow: "0 8px 24px rgba(139,92,246,0.35)",
    ring: "rgba(139,92,246,0.25)",
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
    key: "completion_rate",
    label: "Completion Rate",
    icon: TrendingUpIcon,
    color: "text-sky-400",
    glow: "0 8px 24px rgba(56,189,248,0.3)",
    ring: "rgba(56,189,248,0.20)",
    format: (v) => `${Number(v).toFixed(1)}%`,
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/5 bg-card px-5 py-6">
            <Skeleton className="h-14 w-14 rounded-2xl bg-white/8" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-14 bg-white/8" />
              <Skeleton className="h-3 w-24 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STATS.map((s) => {
        const raw = data ? (data[s.key] as number) ?? 0 : 0
        const display = s.format ? s.format(raw) : String(raw)
        return (
          <div
            key={s.key}
            className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-card px-5 py-6 shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15"
          >
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 transition-transform duration-300 group-hover:scale-110"
              style={{ boxShadow: s.glow, outline: `1px solid ${s.ring}` }}
            >
              <s.icon className={`size-6 ${s.color}`} />
            </div>
            <div className="min-w-0 flex flex-col">
              <p className={`text-2xl font-extrabold tabular-nums leading-none ${s.color}`}>
                {display}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                {s.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
