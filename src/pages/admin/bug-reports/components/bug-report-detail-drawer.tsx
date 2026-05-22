// ─── BugReportDetailDrawer ────────────────────────────────────────────────────
// Sheet drawer displaying all details of a single bug report.

import { ExternalLinkIcon } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { PriorityBadge } from "./shared/priority-badge"
import { StatusBadge } from "./shared/status-badge"
import type { BugReport } from "../types/bug-report.types"

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

interface BugReportDetailDrawerProps {
  report: BugReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BugReportDetailDrawer({
  report,
  open,
  onOpenChange,
}: BugReportDetailDrawerProps) {
  if (!report) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[680px] lg:max-w-[760px] p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-lg leading-snug pr-6">{report.title}</SheetTitle>
            <SheetDescription>Bug report details</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* ── Overview ─────────────────────────────────────────────────── */}
            <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Overview
              </p>
              <div className="space-y-2.5">
                <Row label="Priority">
                  <PriorityBadge priority={report.priority} />
                </Row>
                <Row label="Status">
                  <StatusBadge status={report.status} />
                </Row>
                <Row label="Reported By">
                  {report.reported_by ? (
                    <span className="break-all">
                      {report.reported_by.name}
                      <span className="ml-1.5 text-muted-foreground text-xs">
                        ({report.reported_by.email})
                      </span>
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </Row>
                <Row label="Assigned To">
                  {report.assigned_to ? (
                    <span className="break-all">
                      {report.assigned_to.name}
                      <span className="ml-1.5 text-muted-foreground text-xs">
                        ({report.assigned_to.email})
                      </span>
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground/50">Unassigned</span>
                  )}
                </Row>
                <Row label="Created">{formatDate(report.created_at)}</Row>
                {report.resolved_at && (
                  <Row label="Resolved">{formatDate(report.resolved_at)}</Row>
                )}
              </div>
            </section>

            {/* ── Description ──────────────────────────────────────────────── */}
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Description
              </p>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {report.description}
              </div>
            </section>

            {/* ── Steps to reproduce ───────────────────────────────────────── */}
            {report.steps_to_reproduce && (
              <>
                <Separator className="opacity-20" />
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Steps to Reproduce
                  </p>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {report.steps_to_reproduce}
                  </div>
                </section>
              </>
            )}

            {/* ── Page URL ────────────────────────────────────────────────── */}
            {report.page_url && (
              <>
                <Separator className="opacity-20" />
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Page URL
                  </p>
                  <a
                    href={report.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                  >
                    {report.page_url}
                    <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </section>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
