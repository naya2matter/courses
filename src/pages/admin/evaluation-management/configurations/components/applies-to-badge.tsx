// ─── AppliesToBadge ───────────────────────────────────────────────────────────
// Renders a coloured badge for the `applies_to` field.
// regular → blue  |  online → teal  |  both → violet

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AppliesToValue } from "../types/evaluation-config.types"

const CONFIG: Record<AppliesToValue, { label: string; className: string }> = {
  regular: {
    label: "Regular",
    className:
      "border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25",
  },
  online: {
    label: "Online",
    className:
      "border-teal-500/30 bg-teal-500/15 text-teal-400 hover:bg-teal-500/25",
  },
  both: {
    label: "Both",
    className:
      "border-violet-500/30 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25",
  },
}

interface AppliesToBadgeProps {
  value: AppliesToValue
  className?: string
}

export function AppliesToBadge({ value, className }: AppliesToBadgeProps) {
  const conf = CONFIG[value] ?? CONFIG.both
  return (
    <Badge
      variant="outline"
      className={cn(conf.className, "capitalize font-medium", className)}
    >
      {conf.label}
    </Badge>
  )
}
