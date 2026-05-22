// ─── EvaluationNotificationSummaryCards ──────────────────────────────────────
// Four stat cards computed from the history list.
// Mirrors the visual style used across other admin pages.

import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { EvaluationNotificationHistoryItem } from "../types/evaluation-notification.types"
import { deriveStatus } from "../hook/use-evaluation-notification-history"

// ── Types ──────────────────────────────────────────────────────────────────────

interface CardDef {
  key: string
  title: string
  value: string
  Icon: React.ComponentType<{ className?: string }>
  iconColor: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildCards(items: EvaluationNotificationHistoryItem[]): CardDef[] {
  const totalBatches = items.length
  const totalSuccess = items.reduce((s, i) => s + (i.success_count ?? 0), 0)
  const totalFailed = items.reduce((s, i) => s + (i.failed_count ?? 0), 0)

  const lastItem = items.slice().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0]
  const lastSent = lastItem
    ? new Date(lastItem.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

  // Silence unused import for deriveStatus if not directly used in rendering
  void deriveStatus

  return [
    {
      key: "batches",
      title: "Total Batches",
      value: totalBatches.toLocaleString(),
      Icon: BellIcon,
      iconColor: "text-primary",
    },
    {
      key: "success",
      title: "Total Sent",
      value: totalSuccess.toLocaleString(),
      Icon: CheckCircleIcon,
      iconColor: "text-emerald-400",
    },
    {
      key: "failed",
      title: "Total Failed",
      value: totalFailed.toLocaleString(),
      Icon: XCircleIcon,
      iconColor: "text-red-400",
    },
    {
      key: "last",
      title: "Last Sent",
      value: lastSent,
      Icon: CalendarIcon,
      iconColor: "text-sky-400",
    },
  ]
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <Skeleton className="h-12 w-12 rounded-xl mb-3" />
      <Skeleton className="h-9 w-12 mt-1" />
      <Skeleton className="h-3 w-24 mt-3" />
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface EvaluationNotificationSummaryCardsProps {
  items: EvaluationNotificationHistoryItem[]
  isLoading: boolean
}

// ── Main component ─────────────────────────────────────────────────────────────

export function EvaluationNotificationSummaryCards({
  items,
  isLoading,
}: EvaluationNotificationSummaryCardsProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </section>
    )
  }

  const cards = buildCards(items)

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map(({ key, title, value, Icon, iconColor }) => (
        <div key={key} className="flex flex-col items-center text-center p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-3">
            <Icon className={`size-6 ${iconColor}`} />
          </div>
          <p className="text-4xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
        </div>
      ))}
    </section>
  )
}
