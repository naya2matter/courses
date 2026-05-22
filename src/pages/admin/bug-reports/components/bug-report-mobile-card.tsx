// ─── BugReportMobileCard ──────────────────────────────────────────────────────
// Single card for the mobile (< md) layout in the bug reports table.
// Shows title, description, badges, meta grid, and a DropdownMenu for actions.

import { ExternalLinkIcon, EllipsisVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PriorityBadge } from "./shared/priority-badge"
import { StatusBadge } from "./shared/status-badge"
import type { BugReport } from "../types/bug-report.types"

interface BugReportMobileCardProps {
  report: BugReport
  dimmed?: boolean
  onView: () => void
  onEdit: () => void
  onAssign: () => void
  onResolve: () => void
  onDelete: () => void
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="text-xs text-foreground truncate">{value}</span>
    </div>
  )
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function BugReportMobileCard({
  report,
  dimmed = false,
  onView,
  onEdit,
  onAssign,
  onResolve,
  onDelete,
}: BugReportMobileCardProps) {
  const canResolve = report.status !== "resolved" && report.status !== "closed"

  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/2 p-4 space-y-3 transition-opacity ${
        dimmed ? "opacity-50" : ""
      }`}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-1">
            {report.title}
          </p>
          {report.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {report.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <EllipsisVerticalIcon className="h-4 w-4" />
              <span className="sr-only">Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onView}>View Details</DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onAssign}>Assign</DropdownMenuItem>
            {canResolve && (
              <DropdownMenuItem onSelect={onResolve}>Resolve</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Badges ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <PriorityBadge priority={report.priority} />
        <StatusBadge status={report.status} />
      </div>

      {/* ── Meta grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetaItem
          label="Reported By"
          value={report.reported_by?.name ?? "Unknown"}
        />
        <MetaItem
          label="Assigned To"
          value={report.assigned_to?.name ?? "Unassigned"}
        />
        <MetaItem label="Created" value={formatShortDate(report.created_at)} />
        {report.resolved_at && (
          <MetaItem label="Resolved" value={formatShortDate(report.resolved_at)} />
        )}
      </div>

      {/* ── Page URL ────────────────────────────────────────────────────────── */}
      {report.page_url && (
        <a
          href={report.page_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
        >
          <ExternalLinkIcon className="h-3 w-3 shrink-0" />
          {report.page_url}
        </a>
      )}
    </div>
  )
}
