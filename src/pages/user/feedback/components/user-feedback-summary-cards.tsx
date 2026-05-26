// ─── UserFeedbackSummaryCards ─────────────────────────────────────────────────
// Stat cards for the user's own feedback submissions.

import {
  MessageSquareIcon,
  ClockIcon,
  SearchIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SparklesIcon,
} from "lucide-react"
import type { UserFeedback } from "../types/user-feedback.types"

interface UserFeedbackSummaryCardsProps {
  items: UserFeedback[]
  total?: number
}

interface StatCard {
  key: string
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
}

function SummaryCard({ title, value, icon: Icon, iconColor }: Omit<StatCard, "key">) {
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

export function UserFeedbackSummaryCards({ items, total }: UserFeedbackSummaryCardsProps) {
  const resolvedTotal = total ?? items.length
  const pending     = items.filter((f) => f.status === "pending").length
  const underReview = items.filter((f) => f.status === "under_review").length
  const approved    = items.filter((f) => f.status === "approved").length
  const rejected    = items.filter((f) => f.status === "rejected").length
  const responded   = items.filter((f) => f.admin_response != null).length

  const cards: StatCard[] = [
    { key: "total",        title: "Submitted",    value: resolvedTotal, icon: MessageSquareIcon, iconColor: "text-indigo-400"  },
    { key: "pending",      title: "Pending",      value: pending,       icon: ClockIcon,         iconColor: "text-amber-400"   },
    { key: "under_review", title: "Under Review", value: underReview,   icon: SearchIcon,        iconColor: "text-sky-400"     },
    { key: "approved",     title: "Approved",     value: approved,      icon: CheckCircle2Icon,  iconColor: "text-emerald-400" },
    { key: "rejected",     title: "Rejected",     value: rejected,      icon: XCircleIcon,       iconColor: "text-red-400"     },
    { key: "responded",    title: "Responded",    value: responded,     icon: SparklesIcon,      iconColor: "text-violet-400"  },
  ]

  return (
    <section className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
      {cards.map(({ key, ...rest }) => (
        <SummaryCard key={key} {...rest} />
      ))}
    </section>
  )
}
