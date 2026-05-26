// ─── FeedbackMobileCard ───────────────────────────────────────────────────────
// Single card for the mobile (< md) layout in the feedback table.

import { EllipsisVerticalIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FeedbackStatusBadge } from "./shared/feedback-status-badge"
import { FeedbackTypeBadge } from "./shared/feedback-type-badge"
import type { Feedback } from "../types/feedback.types"

interface FeedbackMobileCardProps {
  feedback: Feedback
  onView: () => void
  onRespond: () => void
  onUpdateStatus: () => void
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

export function FeedbackMobileCard({
  feedback,
  onView,
  onRespond,
  onUpdateStatus,
}: FeedbackMobileCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-1">
            {feedback.title}
          </p>
          {feedback.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {feedback.description}
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
            <DropdownMenuItem onSelect={onRespond}>Respond</DropdownMenuItem>
            <DropdownMenuItem onSelect={onUpdateStatus}>Update Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Badges ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        <FeedbackTypeBadge type={feedback.type} />
        <FeedbackStatusBadge status={feedback.status} />
      </div>

      {/* ── Meta grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetaItem label="Submitted By" value={feedback.user.name} />
        <MetaItem
          label="Department"
          value={feedback.user.department?.name ?? "—"}
        />
        <MetaItem label="Created" value={formatShortDate(feedback.created_at)} />
        <MetaItem
          label="Response"
          value={feedback.admin_response ? "Yes" : "No"}
        />
      </div>
    </div>
  )
}
