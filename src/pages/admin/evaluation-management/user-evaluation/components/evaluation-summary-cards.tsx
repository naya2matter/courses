// ─── EvaluationSummaryCards ───────────────────────────────────────────────────
// Displays 7 calculated summary cards from the current evaluations list.

import { Skeleton } from "@/components/ui/skeleton"
import {
  ClipboardListIcon,
  StarIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  BarChart2Icon,
  BookOpenIcon,
  GlobeIcon,
} from "lucide-react"
import type { Evaluation } from "../types/evaluation.types"

interface Props {
  evaluations: Evaluation[]
  isLoading?: boolean
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
  isLoading,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  colorClass: string
  isLoading?: boolean
}) {
  return (
    <div className="flex flex-col items-center justify-between text-center">
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-4xl font-semibold tabular-nums text-foreground">
        {isLoading ? <Skeleton className="h-10 w-24" /> : value}
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
    </div>
  )
}

export function EvaluationSummaryCards({ evaluations, isLoading }: Props) {
  const total = evaluations.length

  const outstanding = evaluations.filter((e) => e.performance_level?.level === 1).length
  const reliable = evaluations.filter((e) => e.performance_level?.level === 2).length
  const developing = evaluations.filter((e) => e.performance_level?.level === 3).length

  const avgScore =
    total === 0
      ? 0
      : Math.round((evaluations.reduce((acc, e) => acc + (e.total_score ?? 0), 0) / total) * 10) / 10

  const regular = evaluations.filter((e) => e.course_type === "regular").length
  const online = evaluations.filter((e) => e.course_type === "online").length

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
      <StatCard
        icon={ClipboardListIcon}
        label="Total Evaluations"
        value={total}
        colorClass="bg-violet-500/20 text-violet-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={StarIcon}
        label="Outstanding"
        value={outstanding}
        colorClass="bg-emerald-500/20 text-emerald-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={ShieldCheckIcon}
        label="Reliable"
        value={reliable}
        colorClass="bg-blue-500/20 text-blue-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={TrendingUpIcon}
        label="Developing"
        value={developing}
        colorClass="bg-amber-500/20 text-amber-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={BarChart2Icon}
        label="Avg Score"
        value={avgScore}
        colorClass="bg-purple-500/20 text-purple-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={BookOpenIcon}
        label="Regular"
        value={regular}
        colorClass="bg-sky-500/20 text-sky-300"
        isLoading={isLoading}
      />
      <StatCard
        icon={GlobeIcon}
        label="Online"
        value={online}
        colorClass="bg-teal-500/20 text-teal-300"
        isLoading={isLoading}
      />
    </div>
  )
}
