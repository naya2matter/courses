// ─── OnlineCourseSummaryCards ─────────────────────────────────────────────────
// Four stat cards sourced directly from the API `cards` array.

import {
  BookOpenIcon,
  GlobeIcon,
  PencilLineIcon,
  UsersIcon,
} from "lucide-react"
import type { OnlineCourseSummaryCard } from "../types/online-course.types"

// ── Icon + colour map ─────────────────────────────────────────────────────────

interface CardMeta {
  icon: React.ElementType
  iconColor: string
}

const CARD_META: Record<string, CardMeta> = {
  total_courses: {
    icon: BookOpenIcon,
    iconColor: "text-indigo-400",
  },
  published_courses: {
    icon: GlobeIcon,
    iconColor: "text-emerald-400",
  },
  draft_courses: {
    icon: PencilLineIcon,
    iconColor: "text-amber-400",
  },
  total_enrollments: {
    icon: UsersIcon,
    iconColor: "text-sky-400",
  },
}

function getCardMeta(key: string): CardMeta {
  return CARD_META[key] ?? { icon: BookOpenIcon, iconColor: "text-muted-foreground" }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/6">
        <Icon className={`size-6 ${iconColor}`} />
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
    </div>
  )
}

// ── Props + component ─────────────────────────────────────────────────────────

interface OnlineCourseSummaryCardsProps {
  cards: OnlineCourseSummaryCard[]
}

export function OnlineCourseSummaryCards({ cards }: OnlineCourseSummaryCardsProps) {
  if (!cards.length) return null

  return (
    <section
      className="grid gap-6 items-center"
      style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))` }}
    >
      {cards.map(({ key, title, value }) => {
        const { icon, iconColor } = getCardMeta(key)
        return (
          <SummaryCard
            key={key}
            title={title}
            value={value}
            icon={icon}
            iconColor={iconColor}
          />
        )
      })}
    </section>
  )
}
