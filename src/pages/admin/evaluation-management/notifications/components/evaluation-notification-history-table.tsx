// ─── EvaluationNotificationHistoryTable ──────────────────────────────────────
// Renders the notification history. Desktop = shadcn Table, mobile = cards.

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EvaluationNotificationHistoryItem } from "../types/evaluation-notification.types"
import { NotificationStatusBadge } from "./notification-status-badge"
import { deriveStatus } from "../hook/use-evaluation-notification-history"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function truncate(text?: string | null, max = 60): string {
  if (!text) return "—"
  return text.length > max ? text.slice(0, max) + "…" : text
}

function formatPeople(items?: { name: string; email: string }[] | null): string {
  if (!items || items.length === 0) return "—"
  return items.map((item) => item.name).join(", ")
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="border-white/5">
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationNotificationHistoryTableProps {
  items: EvaluationNotificationHistoryItem[]
  isLoading: boolean
  hasActiveFilters: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationNotificationHistoryTable({
  items,
  isLoading,
  hasActiveFilters,
}: EvaluationNotificationHistoryTableProps) {
  // ── Mobile card layout ─────────────────────────────────────────────────────
  function MobileCard({ item }: { item: EvaluationNotificationHistoryItem }) {
    const status = deriveStatus(item)
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground text-sm truncate">{item.subject}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{truncate(item.message, 80)}</p>
          </div>
          <NotificationStatusBadge status={status} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>
            <span className="text-emerald-400 font-medium">{item.success_count ?? 0}</span> sent
          </span>
          <span>
            <span className="text-red-400 font-medium">{item.failed_count ?? 0}</span> failed
          </span>
          <span className="col-span-2">
            <span className="font-medium text-foreground">Managers:</span> {formatPeople(item.managers)}
          </span>
          <span className="col-span-2">
            <span className="font-medium text-foreground">Employees:</span> {formatPeople(item.employees)}
          </span>
          {(item.start_date || item.end_date) && (
            <span className="col-span-2">
              {item.start_date ?? "all"} → {item.end_date ?? "all"}
            </span>
          )}
          <span className="col-span-2">Created {formatDate(item.created_at ?? item.sent_at)}</span>
        </div>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  function EmptyState() {
    if (hasActiveFilters) {
      return (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">No results for the current filters.</p>
          <p className="text-muted-foreground text-xs mt-1">Try adjusting or clearing your filters.</p>
        </div>
      )
    }
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-sm">No notification history yet.</p>
        <p className="text-muted-foreground text-xs mt-1">
          Compose a notification to send evaluation reports to managers.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile ──────────────────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))
          : items.length === 0
          ? <EmptyState />
          : items.map((item) => <MobileCard key={item.id} item={item} />)}
      </div>

      {/* ── Desktop ─────────────────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <Table className="min-w-4xl">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-44 text-muted-foreground font-medium">Subject</TableHead>
              <TableHead className="w-56 text-muted-foreground font-medium">Message</TableHead>
              <TableHead className="w-40 text-muted-foreground font-medium">Managers</TableHead>
              <TableHead className="w-40 text-muted-foreground font-medium">Employees</TableHead>
              <TableHead className="w-40 text-muted-foreground font-medium">Date Range</TableHead>
              <TableHead className="w-36 text-muted-foreground font-medium">Created At</TableHead>
              <TableHead className="w-28 text-muted-foreground font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows />
            ) : items.length === 0 ? (
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableCell colSpan={7}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const status = deriveStatus(item)
                return (
                  <TableRow
                    key={item.id}
                    className="border-white/5"
                  >
                    <TableCell className="w-44 font-medium text-foreground">
                      <span className="block truncate" title={item.subject}>
                        {item.subject}
                      </span>
                    </TableCell>
                    <TableCell className="w-56 text-muted-foreground">
                      <span className="block truncate" title={item.message ?? ""}>
                        {item.message ? truncate(item.message, 60) : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="w-40 text-muted-foreground">
                      <span className="block truncate" title={formatPeople(item.managers)}>
                        {formatPeople(item.managers)}
                      </span>
                    </TableCell>
                    <TableCell className="w-40 text-muted-foreground">
                      <span className="block truncate" title={formatPeople(item.employees)}>
                        {formatPeople(item.employees)}
                      </span>
                    </TableCell>
                    <TableCell className="w-40 text-muted-foreground text-xs">
                      {item.start_date || item.end_date
                        ? `${item.start_date ?? "all"} → ${item.end_date ?? "all"}`
                        : "All dates"}
                    </TableCell>
                    <TableCell className="w-36 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="w-28">
                      <NotificationStatusBadge status={status} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
