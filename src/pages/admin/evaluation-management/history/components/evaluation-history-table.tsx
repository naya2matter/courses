// ─── EvaluationHistoryTable ───────────────────────────────────────────────────
// Desktop table + mobile card list for evaluation history entries.
// Read-only: only "View Details" action is exposed.

import { EyeIcon } from "lucide-react"

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

import type { EvaluationHistoryEntry } from "../types/evaluation-history.types"
import { PerformanceLevelBadge } from "./performance-level-badge"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function CourseTypeBadge({ type }: { type: string }) {
  const cls =
    type === "online"
      ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
      : "bg-blue-500/15 border-blue-500/30 text-blue-300"
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  )
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i} className="border-white/10">
          {Array.from({ length: 9 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ── Mobile card ───────────────────────────────────────────────────────────────

function MobileCard({
  entry,
  onView,
}: {
  entry: EvaluationHistoryEntry
  onView: (entry: EvaluationHistoryEntry) => void
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate font-medium text-foreground">{(entry.user?.name ?? "Unknown user")}</p>
          <p className="truncate text-xs text-muted-foreground">{(entry.department?.name ?? "—")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={() => onView(entry)}
          aria-label={`View details for ${(entry.user?.name ?? "Unknown user")}`}
        >
          <EyeIcon className="size-4" />
        </Button>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Course</span>
          <span className="truncate max-w-[160px] text-right text-foreground">
            {(entry.course?.name ?? "—")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Type</span>
          <CourseTypeBadge type={entry.course_type} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Score</span>
          <span className="font-semibold tabular-nums text-foreground">
            {entry.total_score}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Performance</span>
          <PerformanceLevelBadge level={entry.performance_level} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Snapshots</span>
          <span className="tabular-nums text-foreground">
            {entry.history.length}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Date</span>
          <span className="text-foreground">{formatDate(entry.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Mobile skeleton ───────────────────────────────────────────────────────────

function MobileSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex justify-between gap-2">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationHistoryTableProps {
  entries: EvaluationHistoryEntry[]
  isLoading: boolean
  onViewDetails: (entry: EvaluationHistoryEntry) => void
}

// ── Main component ────────────────────────────────────────────────────────────

export function EvaluationHistoryTable({
  entries,
  isLoading,
  onViewDetails,
}: EvaluationHistoryTableProps) {
  // ── Empty states ────────────────────────────────────────────────────────
  if (!isLoading && entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-muted-foreground">
        No evaluation history found.
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* ── Mobile view ──────────────────────────────────────────────────── */}
      <div className="space-y-3 sm:hidden">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <MobileSkeleton key={i} />)
          : entries.map((entry) => (
              <MobileCard key={entry.id} entry={entry} onView={onViewDetails} />
            ))}
      </div>

      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Employee</TableHead>
              <TableHead className="text-muted-foreground">Department</TableHead>
              <TableHead className="text-muted-foreground">Course</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-right text-muted-foreground">Score</TableHead>
              <TableHead className="text-muted-foreground">Performance</TableHead>
              <TableHead className="text-right text-muted-foreground">Snapshots</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="border-white/10 transition-colors hover:bg-white/5"
                >
                  <TableCell className="font-medium">{(entry.user?.name ?? "Unknown user")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {(entry.department?.name ?? "—")}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate text-sm cursor-default">
                          {(entry.course?.name ?? "—")}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        {(entry.course?.name ?? "—")}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <CourseTypeBadge type={entry.course_type} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">
                    {entry.total_score}
                  </TableCell>
                  <TableCell>
                    <PerformanceLevelBadge level={entry.performance_level} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {entry.history.length}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => onViewDetails(entry)}
                          aria-label={`View details for ${(entry.user?.name ?? "Unknown user")}`}
                        >
                          <EyeIcon className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Details</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
