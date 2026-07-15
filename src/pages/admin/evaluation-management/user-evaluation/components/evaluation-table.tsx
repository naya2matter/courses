// ─── EvaluationTable ──────────────────────────────────────────────────────────
// Desktop table view for evaluations list.

import {
  EyeIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SortableHead } from "@/components/ui/table-controls"
import { PerformanceLevelBadge } from "./performance-level-badge"
import type { Evaluation } from "../types/evaluation.types"

interface Props {
  evaluations: Evaluation[]
  isLoading: boolean
  sort?: string
  direction?: "asc" | "desc"
  onSort?: (column: string) => void
  onView: (ev: Evaluation) => void
  onRescore: (ev: Evaluation) => void
  onDelete: (ev: Evaluation) => void
}

function formatDate(d?: string | null): string {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return d
  }
}

export function EvaluationTable({
  evaluations,
  isLoading,
  sort,
  direction,
  onSort,
  onView,
  onRescore,
  onDelete,
}: Props) {
  // Fallback no-op keeps SortableHead happy if the parent omits onSort.
  const handleSort = onSort ?? (() => {})
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg bg-white/5" />
        ))}
      </div>
    )
  }

  if (evaluations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-16 text-white/40">
        <p className="text-lg">No evaluations found</p>
        <p className="mt-1 text-sm">Adjust filters or create a new evaluation.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-white/60">User</TableHead>
            <TableHead className="text-white/60">Department</TableHead>
            <TableHead className="text-white/60">Type</TableHead>
            <TableHead className="text-white/60">Course</TableHead>
            <SortableHead
              label="Score"
              column="total_score"
              sort={sort}
              direction={direction}
              onSort={handleSort}
              align="right"
              className="text-white/60"
            />
            <SortableHead
              label="Performance"
              column="performance_level"
              sort={sort}
              direction={direction}
              onSort={handleSort}
              className="text-white/60"
            />
            <SortableHead
              label="Created"
              column="created_at"
              sort={sort}
              direction={direction}
              onSort={handleSort}
              className="text-white/60"
            />
            <TableHead className="text-white/60">Updated</TableHead>
            <TableHead className="text-white/60 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((ev) => {
            const courseName =
              ev.course?.name ??
              (ev.course_type === "online" ? "Online course" : "Regular course")
            return (
              <TableRow
                key={ev.id}
                className="border-white/10 hover:bg-white/5 cursor-pointer"
                onClick={() => onView(ev)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onView(ev)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open details for ${ev.user?.name ?? `User ${ev.user_id}`}`}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-white">{ev.user?.name ?? `User #${ev.user_id}`}</p>
                    {ev.user?.email && (
                      <p className="text-xs text-white/40">{ev.user.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-white/70">
                  {ev.department?.name ?? `Dept #${ev.department_id}`}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-white/10 text-white/60 capitalize">
                    {ev.course_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-white/70 max-w-[160px] truncate">{courseName}</TableCell>
                <TableCell className="text-right font-semibold text-white">
                  {ev.total_score}
                </TableCell>
                <TableCell>
                  <PerformanceLevelBadge performance_level={ev.performance_level} />
                </TableCell>
                <TableCell className="text-white/50 text-sm">{formatDate(ev.created_at)}</TableCell>
                <TableCell className="text-white/50 text-sm">{formatDate(ev.updated_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/50 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onView(ev)
                      }}
                      title="View details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/50 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRescore(ev)
                      }}
                      title="Re-score"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white/50 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(ev)
                      }}
                      title="Delete"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
