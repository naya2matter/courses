// ─── EvaluationSummaryCards ───────────────────────────────────────────────────
// Displays 7 calculated summary cards from the current evaluations list.

import { Card, CardContent } from "@/components/ui/card"
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
}

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  colorClass: string
}) {
  return (
    <Card >
      <CardContent className="flex flex-col items-center justify-center gap-4 p-4">
        <div className={`rounded-xl p-2.5 ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-center text-center">
          <p className="text-xs text-white/50">{label}</p>
          <p className="text-xl font-semibold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function EvaluationSummaryCards({ evaluations }: Props) {
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <StatCard
        icon={ClipboardListIcon}
        label="Total Evaluations"
        value={total}
        colorClass="bg-violet-500/20 text-violet-300"
      />
      <StatCard
        icon={StarIcon}
        label="Outstanding"
        value={outstanding}
        colorClass="bg-emerald-500/20 text-emerald-300"
      />
      <StatCard
        icon={ShieldCheckIcon}
        label="Reliable"
        value={reliable}
        colorClass="bg-blue-500/20 text-blue-300"
      />
      <StatCard
        icon={TrendingUpIcon}
        label="Developing"
        value={developing}
        colorClass="bg-amber-500/20 text-amber-300"
      />
      <StatCard
        icon={BarChart2Icon}
        label="Avg Score"
        value={avgScore}
        colorClass="bg-purple-500/20 text-purple-300"
      />
      <StatCard
        icon={BookOpenIcon}
        label="Regular"
        value={regular}
        colorClass="bg-sky-500/20 text-sky-300"
      />
      <StatCard
        icon={GlobeIcon}
        label="Online"
        value={online}
        colorClass="bg-teal-500/20 text-teal-300"
      />
    </div>
  )
}
