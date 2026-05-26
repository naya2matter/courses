// ─── UserFeedbackDetailDrawer ─────────────────────────────────────────────────
// Sheet drawer that fetches full feedback details via GET /user/feedback/getById/{id}.

import { useEffect, useState } from "react"
import { Loader2Icon, AlertCircleIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { UserFeedbackStatusBadge } from "./shared/user-feedback-status-badge"
import { UserFeedbackTypeBadge } from "./shared/user-feedback-type-badge"
import { getMyFeedbackById } from "../service/user-feedback.service"
import type { UserFeedback } from "../types/user-feedback.types"

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
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground break-words min-w-0 flex-1">{children}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UserFeedbackDetailDrawerProps {
  /** The list-row item used to seed the title while the full record loads. */
  feedback: UserFeedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UserFeedbackDetailDrawer({
  feedback,
  open,
  onOpenChange,
}: UserFeedbackDetailDrawerProps) {
  const [detail, setDetail] = useState<UserFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch full record whenever the drawer opens for a new feedback item
  useEffect(() => {
    if (!open || !feedback) {
      setDetail(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setDetail(null)

    getMyFeedbackById(feedback.id)
      .then((res) => {
        if (!cancelled) setDetail(res)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(
          err?.status === 403
            ? "You don't have permission to view this feedback."
            : "Failed to load feedback details.",
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, feedback?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = detail ?? feedback
  const hasResponse = !!displayed?.admin_response

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[620px] lg:max-w-[700px] p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-lg leading-snug pr-6">
              {displayed?.title ?? "Feedback Details"}
            </SheetTitle>
            <SheetDescription>Your feedback submission</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* ── Loading state ─────────────────────────────────────────────── */}
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Loading details…
                </div>
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            )}

            {/* ── Error state ───────────────────────────────────────────────── */}
            {!isLoading && error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* ── Content ───────────────────────────────────────────────────── */}
            {!isLoading && !error && displayed && (
              <>
                {/* ── Overview ─────────────────────────────────────────────── */}
                <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Overview
                  </p>
                  <div className="space-y-2.5">
                    <Row label="Type">
                      <UserFeedbackTypeBadge type={displayed.type} />
                    </Row>
                    <Row label="Status">
                      <UserFeedbackStatusBadge status={displayed.status} />
                    </Row>
                    <Row label="Submitted">{formatDate(displayed.created_at)}</Row>
                  </div>
                </section>

                {/* ── Description ──────────────────────────────────────────── */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Description
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {displayed.description}
                  </div>
                </section>

                {/* ── Admin Response ───────────────────────────────────────── */}
                <Separator className="opacity-20" />
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Admin Response
                  </p>
                  {hasResponse ? (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {displayed.admin_response}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-muted-foreground italic">
                      No response yet. We'll review your feedback and get back to you.
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
