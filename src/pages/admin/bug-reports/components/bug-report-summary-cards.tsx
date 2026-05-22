// ─── BugReportSummaryCards ────────────────────────────────────────────────────
// Six stat cards derived from the current page of items + the total count.

import {
  BugIcon,
  CircleDotIcon,
  ClockIcon,
  CheckCircle2Icon,
  ZapIcon,
  UserCheckIcon,
} from "lucide-react"
import type { BugReport } from "../types/bug-report.types"

interface BugReportSummaryCardsProps {
  items: BugReport[]
  /** Total across all pages (from pagination meta). Falls back to items.length. */
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

export function BugReportSummaryCards({ items, total }: BugReportSummaryCardsProps) {
  const resolvedTotal = total ?? items.length
  const open = items.filter((r) => r.status === "open").length
  const inProgress = items.filter((r) => r.status === "in_progress").length
  const resolved = items.filter((r) => r.status === "resolved").length
  const critical = items.filter((r) => r.priority === "critical").length
  const assigned = items.filter((r) => r.assigned_to != null).length

  const cards: StatCard[] = [
    { key: "total",       title: "Total Reports", value: resolvedTotal, icon: BugIcon,          iconColor: "text-indigo-400" },
    { key: "open",        title: "Open",          value: open,          icon: CircleDotIcon,    iconColor: "text-sky-400" },
    { key: "in_progress", title: "In Progress",   value: inProgress,    icon: ClockIcon,        iconColor: "text-amber-400" },
    { key: "resolved",    title: "Resolved",      value: resolved,      icon: CheckCircle2Icon, iconColor: "text-emerald-400" },
    { key: "critical",    title: "Critical",      value: critical,      icon: ZapIcon,          iconColor: "text-red-400" },
    { key: "assigned",    title: "Assigned",      value: assigned,      icon: UserCheckIcon,    iconColor: "text-violet-400" },
  ]

  return (
    <section className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
      {cards.map(({ key, ...rest }) => (
        <SummaryCard key={key} {...rest} />
      ))}
    </section>
  )
}
