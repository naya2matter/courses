// ─── LinkStatusBadge ──────────────────────────────────────────────────────────
// Shows whether a login link was never sent or has expired.

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface LinkStatusBadgeProps {
  /** null = never sent; ISO string = link expired */
  linkExpiresAt: string | null
  className?: string
}

export function LinkStatusBadge({ linkExpiresAt, className }: LinkStatusBadgeProps) {
  if (linkExpiresAt === null) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-rose-500/40 bg-rose-500/10 text-rose-400 font-medium",
          className,
        )}
      >
        Never Sent
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-500/40 bg-amber-500/10 text-amber-400 font-medium",
        className,
      )}
    >
      Expired
    </Badge>
  )
}
