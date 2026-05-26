import {
  CalendarClockIcon,
  CircleGaugeIcon,
  Layers3Icon,
  MedalIcon,
  SigmaIcon,
  TvMinimalPlayIcon,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type { UserEvaluation } from "../types/user-evaluation.types"

function formatNumber(value: number): string {
  return value.toLocaleString()
}

function formatAvg(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatDate(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface SummaryCard {
  key: string
  label: string
  value: string
  icon: React.ReactNode
}

interface UserEvaluationSummaryCardsProps {
  items: UserEvaluation[]
  isLoading: boolean
}

export function UserEvaluationSummaryCards({
  items,
  isLoading,
}: UserEvaluationSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    )
  }

  const total = items.length
  const avgScore = total > 0
    ? items.reduce((sum, item) => sum + (item.total_score ?? 0), 0) / total
    : 0
  const bestScore = total > 0
    ? Math.max(...items.map((item) => item.total_score ?? 0))
    : 0

  const latest = [...items].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime()
    const bTime = new Date(b.created_at).getTime()
    return bTime - aTime
  })[0]

  const regularCount = items.filter((item) => item.course_type === "regular").length
  const onlineCount = items.filter((item) => item.course_type === "online").length

  const cards: SummaryCard[] = [
    {
      key: "total",
      label: "Total Evaluations",
      value: formatNumber(total),
      icon: <Layers3Icon className="size-4" />,
    },
    {
      key: "avg",
      label: "Average Score",
      value: formatAvg(avgScore),
      icon: <SigmaIcon className="size-4" />,
    },
    {
      key: "best",
      label: "Best Score",
      value: formatNumber(bestScore),
      icon: <MedalIcon className="size-4" />,
    },
    {
      key: "latest",
      label: "Latest Evaluation",
      value: formatDate(latest?.created_at),
      icon: <CalendarClockIcon className="size-4" />,
    },
    {
      key: "regular",
      label: "Regular Courses",
      value: formatNumber(regularCount),
      icon: <CircleGaugeIcon className="size-4" />,
    },
    {
      key: "online",
      label: "Online Courses",
      value: formatNumber(onlineCount),
      icon: <TvMinimalPlayIcon className="size-4" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/7"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{card.label}</span>
            <span className="text-white/55">{card.icon}</span>
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  )
}
