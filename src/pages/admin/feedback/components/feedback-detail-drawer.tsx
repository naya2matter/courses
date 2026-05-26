// ─── FeedbackDetailDrawer ─────────────────────────────────────────────────────
// Sheet drawer displaying all details of a single feedback entry.

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { FeedbackStatusBadge } from "./shared/feedback-status-badge"
import { FeedbackTypeBadge } from "./shared/feedback-type-badge"
import type { Feedback } from "../types/feedback.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground break-words min-w-0 flex-1">{children}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface FeedbackDetailDrawerProps {
  feedback: Feedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FeedbackDetailDrawer({
  feedback,
  open,
  onOpenChange,
}: FeedbackDetailDrawerProps) {
  if (!feedback) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] lg:max-w-[760px] p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-lg leading-snug pr-6">{feedback.title}</SheetTitle>
            <SheetDescription>Feedback entry details</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* ── Overview ─────────────────────────────────────────────────── */}
            <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Overview
              </p>
              <div className="space-y-2.5">
                <Row label="Type">
                  <FeedbackTypeBadge type={feedback.type} />
                </Row>
                <Row label="Status">
                  <FeedbackStatusBadge status={feedback.status} />
                </Row>
                <Row label="Submitted By">
                  <span>
                    {feedback.user.name}
                    {feedback.user.department && (
                      <span className="ml-1.5 text-muted-foreground text-xs">
                        — {feedback.user.department.name}
                      </span>
                    )}
                  </span>
                </Row>
                <Row label="Created">{formatDate(feedback.created_at)}</Row>
              </div>
            </section>

            {/* ── Description ──────────────────────────────────────────────── */}
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {feedback.description}
              </div>
            </section>

            {/* ── Admin Response ───────────────────────────────────────────── */}
            {feedback.admin_response && (
              <>
                <Separator className="opacity-20" />
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Admin Response
                  </p>
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {feedback.admin_response}
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
