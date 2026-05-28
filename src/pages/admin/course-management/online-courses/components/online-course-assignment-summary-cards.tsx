import {
  BookOpenCheckIcon,
  ClipboardListIcon,
} from "lucide-react"
import type { OnlineCourseAssignmentSummaryCard } from "../types/online-course-assignment.types"

interface CardMeta {
  icon: React.ElementType
  iconColor: string
}

const CARD_META: Record<string, CardMeta> = {
  total_assignments: {
    icon: ClipboardListIcon,
    iconColor: "text-sky-400",
  },
  active_courses: {
    icon: BookOpenCheckIcon,
    iconColor: "text-emerald-400",
  },
}

function getCardMeta(key: string): CardMeta {
  return CARD_META[key] ?? { icon: ClipboardListIcon, iconColor: "text-muted-foreground" }
}

interface Props {
  cards: OnlineCourseAssignmentSummaryCard[]
}

export function OnlineCourseAssignmentSummaryCards({ cards }: Props) {
  if (!cards.length) return null

  return (
    <section
      className="grid gap-6 items-center"
      style={{ gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))` }}
    >
      {cards.map(({ key, title, value }) => {
        const { icon: Icon, iconColor } = getCardMeta(key)
        return (
          <div key={key} className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/6">
              <Icon className={`size-6 ${iconColor}`} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {title}
            </p>
          </div>
        )
      })}
    </section>
  )
}
