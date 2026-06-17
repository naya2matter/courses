// ─── Shared User Page Header ──────────────────────────────────────────────────
// One canonical header for every user-side page so the whole area shares the
// same "soul": clean title + subtitle on the left, actions (and an optional
// standard Refresh button) on the right. No decorative icon box — by design.
//
//   <PageHeader
//     title="My Online Courses"
//     description="Self-paced video & document courses assigned to you."
//     onRefresh={fetchCourses}
//     refreshing={isLoading}
//   />
//
// Pass extra buttons via `actions` (rendered left of Refresh) and an optional
// count chip via `badge` (rendered next to the title).

import type { ReactNode } from "react"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface PageHeaderProps {
  title: string
  description?: string
  /** Small chip rendered next to the title (e.g. a result count). */
  badge?: ReactNode
  /** Extra action elements, rendered to the left of the Refresh button. */
  actions?: ReactNode
  /** When provided, renders the standard Refresh button. */
  onRefresh?: () => void
  /** Spins the Refresh icon and disables the button while true. */
  refreshing?: boolean
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  onRefresh,
  refreshing,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {badge}
        </div>
        {description && <p className="text-sm text-white/45">{description}</p>}
      </div>

      {(actions || onRefresh) && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <RefreshCwIcon className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
