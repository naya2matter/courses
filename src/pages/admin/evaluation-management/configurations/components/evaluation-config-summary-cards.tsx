// ─── EvaluationConfigSummaryCards ────────────────────────────────────────────
// Displays five stat cards computed from the configs list.
// Mirrors the visual style used on the Live Courses and other admin pages.

import { LayoutGridIcon, BookOpenIcon, MonitorIcon, LayersIcon, HashIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { EvaluationConfig } from "../types/evaluation-config.types"

// ── Types ──────────────────────────────────────────────────────────────────────

interface CardDef {
  key: string
  title: string
  value: number
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function deriveCards(configs: EvaluationConfig[]): CardDef[] {
  return [
    {
      key: "total",
      title: "Total Configs",
      value: configs.length,
      Icon: LayoutGridIcon,
      iconColor: "text-primary",
    },
    {
      key: "regular",
      title: "Regular",
      value: configs.filter((c) => c.applies_to === "regular").length,
      Icon: BookOpenIcon,
      iconColor: "text-blue-400",
    },
    {
      key: "online",
      title: "Online",
      value: configs.filter((c) => c.applies_to === "online").length,
      Icon: MonitorIcon,
      iconColor: "text-teal-400",
    },
    {
      key: "both",
      title: "Both",
      value: configs.filter((c) => c.applies_to === "both").length,
      Icon: LayersIcon,
      iconColor: "text-violet-400",
    },
    {
      key: "total_max_score",
      title: "Total Max Score",
      value: configs.reduce((sum, c) => sum + c.max_score, 0),
      Icon: HashIcon,
      iconColor: "text-amber-400",
    },
  ]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <Skeleton className="h-12 w-12 rounded-xl mb-3" />
      <Skeleton className="h-9 w-10 mt-1" />
      <Skeleton className="h-3 w-20 mt-3" />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface EvaluationConfigSummaryCardsProps {
  configs: EvaluationConfig[]
  isLoading: boolean
}

export function EvaluationConfigSummaryCards({
  configs,
  isLoading,
}: EvaluationConfigSummaryCardsProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </section>
    )
  }

  const cards = deriveCards(configs)

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map(({ key, title, value, Icon, iconColor }) => (
        <div
          key={key}
          className="flex flex-col items-center text-center  p-4 "
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3">
            <Icon className={`size-6 ${iconColor}`} />
          </div>
          <p className="text-4xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
        </div>
      ))}
    </section>
  )
}
