import { EyeIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { UserEvaluation } from "../types/user-evaluation.types"
import { UserPerformanceLevelBadge } from "./user-performance-level-badge"

function formatDate(iso?: string | null): string {
  if (!iso) return "-"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "-"
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface UserEvaluationMobileCardProps {
  item: UserEvaluation
  onViewDetails: (id: number) => void
}

export function UserEvaluationMobileCard({
  item,
  onViewDetails,
}: UserEvaluationMobileCardProps) {
  const courseType = item.course_type === "online" ? "Online" : "Regular"

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {item.course?.name ?? `Course #${item.course?.id ?? "-"}`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Evaluated {formatDate(item.created_at)}
          </p>
        </div>
        <Badge variant="outline" className="border-white/10 bg-white/8 text-xs">
          {courseType}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-muted-foreground">Total Score</p>
          <p className="text-lg font-bold tabular-nums text-white">{item.total_score}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-muted-foreground">History Rows</p>
          <p className="text-lg font-bold tabular-nums text-white">{item.history.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <UserPerformanceLevelBadge level={item.performance_level} />
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => onViewDetails(item.id)}
          aria-label={`View evaluation details for ${item.course?.name ?? "course"}`}
        >
          <EyeIcon className="size-3.5" />
          View Details
        </Button>
      </div>
    </div>
  )
}
