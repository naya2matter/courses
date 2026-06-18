// ─── BugReportDetailDrawer ────────────────────────────────────────────────────
// Sheet drawer displaying all details of a single bug report.

import {
  BugIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FileTextIcon,
  LinkIcon,
  ListChecksIcon,
  UserIcon,
  UserCheckIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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

// A labelled person/date stat tile.
function StatTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm text-foreground break-words">{children}</div>
    </div>
  )
}

// A titled content block (description, steps, …).
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {title}
      </div>
      {children}
    </section>
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
        className="w-full gap-0 p-0 sm:max-w-[680px] lg:max-w-[760px]"
      >
        <div className="flex h-full min-h-0 flex-col">
          {/* ── Hero header ──────────────────────────────────────────────── */}
          <SheetHeader className="shrink-0 space-y-0 border-b border-white/10 bg-gradient-to-b from-red-500/8 to-transparent px-6 pb-5 pt-6">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
                <BugIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg leading-snug">{report.title}</SheetTitle>
                <SheetDescription className="mt-0.5">
                  Bug report #{report.id}
                </SheetDescription>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={report.priority} />
                  <StatusBadge status={report.status} />
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* ── Body ─────────────────────────────────────────────────────── */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* People + dates */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatTile icon={<UserIcon className="h-3.5 w-3.5" />} label="Reported By">
                {report.reported_by ? (
                  <>
                    <span className="font-medium">{report.reported_by.name}</span>
                    <span className="block text-xs text-muted-foreground break-all">
                      {report.reported_by.email}
                    </span>
                  </>
                ) : (
                  <span className="italic text-muted-foreground/50">—</span>
                )}
              </StatTile>

              <StatTile icon={<UserCheckIcon className="h-3.5 w-3.5" />} label="Assigned To">
                {report.assigned_to ? (
                  <>
                    <span className="font-medium">{report.assigned_to.name}</span>
                    <span className="block text-xs text-muted-foreground break-all">
                      {report.assigned_to.email}
                    </span>
                  </>
                ) : (
                  <span className="italic text-muted-foreground/50">Unassigned</span>
                )}
              </StatTile>

              <StatTile icon={<CalendarIcon className="h-3.5 w-3.5" />} label="Created">
                {formatDate(report.created_at)}
              </StatTile>

              {report.resolved_at && (
                <StatTile
                  icon={<CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Resolved"
                >
                  {formatDate(report.resolved_at)}
                </StatTile>
              )}
            </div>

            {/* Description */}
            <Section icon={<FileTextIcon className="h-3.5 w-3.5" />} title="Description">
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {report.description}
              </div>
            </Section>

            {/* Steps to reproduce */}
            {report.steps_to_reproduce && (
              <Section
                icon={<ListChecksIcon className="h-3.5 w-3.5" />}
                title="Steps to Reproduce"
              >
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {report.steps_to_reproduce}
                </div>
              </Section>
            )}

            {/* Page URL */}
            {report.page_url && (
              <Section icon={<LinkIcon className="h-3.5 w-3.5" />} title="Page URL">
                <a
                  href={report.page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors break-all"
                >
                  <span className="truncate">{report.page_url}</span>
                  <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
                </a>
              </Section>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
