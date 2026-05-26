// ─── ResendLinksMobileCard ────────────────────────────────────────────────────
// Single card for mobile layout in the expired-links list.

import { SendIcon, CalendarIcon, BookOpenIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LinkStatusBadge } from "./shared/link-status-badge"
import type { ExpiredLinkAssignment } from "../types/resend-links.types"

interface ResendLinksMobileCardProps {
  assignment: ExpiredLinkAssignment
  onResend: () => void
  isResending?: boolean
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
      <span className="shrink-0 opacity-60">{icon}</span>
      <span className="sr-only">{label}: </span>
      <span className="truncate">{value}</span>
    </div>
  )
}

export function ResendLinksMobileCard({
  assignment,
  onResend,
  isResending,
}: ResendLinksMobileCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug truncate">{assignment.user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{assignment.user.email}</p>
        </div>
        <LinkStatusBadge linkExpiresAt={assignment.user.link_expires_at} />
      </div>

      {/* ── Course & meta ────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <MetaItem
          icon={<BookOpenIcon className="h-3 w-3" />}
          label="Course"
          value={assignment.course.name}
        />
        <MetaItem
          icon={<CalendarIcon className="h-3 w-3" />}
          label="Assigned"
          value={formatDate(assignment.assigned_at)}
        />
        {assignment.user.link_expires_at && (
          <MetaItem
            icon={<CalendarIcon className="h-3 w-3" />}
            label="Expired"
            value={formatDate(assignment.user.link_expires_at)}
          />
        )}
      </div>

      {/* ── Action ──────────────────────────────────────────────────────────── */}
      <Button
        size="sm"
        className="w-full"
        disabled={isResending}
        onClick={onResend}
      >
        <SendIcon className="mr-1.5 h-3.5 w-3.5" />
        Resend Login Link
      </Button>
    </div>
  )
}
