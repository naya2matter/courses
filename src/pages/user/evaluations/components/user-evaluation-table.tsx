import { EyeIcon, InfoIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { UserEvaluation } from "../types/user-evaluation.types"
import { UserEvaluationMobileCard } from "./user-evaluation-mobile-card"
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

function scoreRange(item: UserEvaluation): string {
  const range = item.performance_level?.range
  if (!range) return "-"
  return `${range.min} - ${range.max}`
}

function courseTypeLabel(type: string): string {
  if (type === "online") return "Online"
  if (type === "regular") return "Regular"
  return type
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="border-white/10">
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

interface UserEvaluationTableProps {
  items: UserEvaluation[]
  isLoading: boolean
  hasActiveFilters: boolean
  onViewDetails: (id: number) => void
}

export function UserEvaluationTable({
  items,
  isLoading,
  hasActiveFilters,
  onViewDetails,
}: UserEvaluationTableProps) {
  function EmptyState() {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? "No evaluations match your current filters."
            : "You do not have any evaluations yet."}
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={350}>
      <div className="space-y-3 md:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          : items.length === 0
            ? <EmptyState />
            : items.map((item) => (
                <UserEvaluationMobileCard
                  key={item.id}
                  item={item}
                  onViewDetails={onViewDetails}
                />
              ))}
      </div>

      <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <Table className="min-w-5xl">
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-72">Course</TableHead>
              <TableHead className="w-28">Course Type</TableHead>
              <TableHead className="w-24 text-right">Total Score</TableHead>
              <TableHead className="w-40">Performance Level</TableHead>
              <TableHead className="w-28">Score Range</TableHead>
              <TableHead className="w-36">Evaluated At</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : items.length === 0 ? (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell colSpan={7}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-white/10">
                  <TableCell className="max-w-72">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate font-medium text-foreground">
                          {item.course?.name ?? `Course #${item.course?.id ?? "-"}`}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {item.course?.name ?? "Unnamed course"}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {courseTypeLabel(item.course_type)}
                  </TableCell>

                  <TableCell className="text-right font-semibold tabular-nums text-foreground">
                    {item.total_score}
                  </TableCell>

                  <TableCell>
                    <UserPerformanceLevelBadge level={item.performance_level} />
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {scoreRange(item)}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => onViewDetails(item.id)}
                      aria-label={`View details for evaluation ${item.id}`}
                    >
                      <EyeIcon className="size-3.5" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && items.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <InfoIcon className="size-3.5" />
          These evaluations are read-only and submitted by your administrators.
        </p>
      )}
    </TooltipProvider>
  )
}
