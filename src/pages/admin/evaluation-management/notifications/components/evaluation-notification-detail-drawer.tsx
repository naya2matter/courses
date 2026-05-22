// ─── EvaluationNotificationDetailDrawer ──────────────────────────────────────
// Sheet drawer showing full details of a notification history item.

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

import type { EvaluationNotificationHistoryItem } from "../types/evaluation-notification.types"
import { NotificationStatusBadge } from "./notification-status-badge"
import { deriveStatus } from "../hook/use-evaluation-notification-history"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationNotificationDetailDrawerProps {
  item: EvaluationNotificationHistoryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationNotificationDetailDrawer({
  item,
  open,
  onOpenChange,
}: EvaluationNotificationDetailDrawerProps) {
  if (!item) return null

  const status = deriveStatus(item)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-6"
      >
        <SheetHeader>
          <SheetTitle className="text-base leading-snug">{item.subject}</SheetTitle>
          <SheetDescription>Notification batch detail</SheetDescription>
        </SheetHeader>

        {/* ── Overview ────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <div className="space-y-2">
            <Row label="Status" value={<NotificationStatusBadge status={status} />} />
            <Row label="Created" value={formatDate(item.created_at)} />
            {item.updated_at && (
              <Row label="Updated" value={formatDate(item.updated_at)} />
            )}
            {item.start_date && (
              <Row label="Start Date" value={item.start_date} />
            )}
            {item.end_date && <Row label="End Date" value={item.end_date} />}
          </div>
        </section>

        <Separator className="opacity-20" />

        {/* ── Message ─────────────────────────────────────────────────────── */}
        {item.message && (
          <>
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Message
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {item.message}
              </div>
            </section>
            <Separator className="opacity-20" />
          </>
        )}

        {/* ── Delivery result ──────────────────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Delivery Result
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs text-muted-foreground">Queued</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-400">
                {item.success_count}
              </p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold tabular-nums text-red-400">
                {item.failed_count}
              </p>
            </div>
          </div>

          {/* Queue note */}
          <p className="text-xs text-muted-foreground">
            Emails are queued and may be delivered shortly after batch creation.
          </p>
        </section>

        {/* ── Sent to ─────────────────────────────────────────────────────── */}
        {item.sent_to && item.sent_to.length > 0 && (
          <>
            <Separator className="opacity-20" />
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Sent to ({item.sent_to.length})
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
                {item.sent_to.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-muted-foreground">{m.email}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── Failed ──────────────────────────────────────────────────────── */}
        {item.failed_to && item.failed_to.length > 0 && (
          <>
            <Separator className="opacity-20" />
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-400">
                Failed ({item.failed_to.length})
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 divide-y divide-red-500/10">
                {item.failed_to.map((m) => (
                  <div key={m.id} className="px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-red-300">{m.name}</span>
                      <span className="text-red-400/70">{m.email}</span>
                    </div>
                    {m.error && (
                      <p className="mt-0.5 text-red-400/60">{m.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
