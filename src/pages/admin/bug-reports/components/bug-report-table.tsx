// ─── BugReportTable ───────────────────────────────────────────────────────────
// Orchestrator: filters toolbar, desktop table, mobile cards, pagination,
// and all dialogs/drawers for the bug reports feature.

import { useState } from "react"
import { toast } from "sonner"
import {
  BugIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"
import { resolveBugReport } from "../service/bug-report.service"
import type { BugReport, BugReportFilters, PaginationMeta } from "../types/bug-report.types"
import { BugReportFiltersToolbar, type AssignedFilter } from "./bug-report-filters-toolbar"
import { PriorityBadge } from "./shared/priority-badge"
import { StatusBadge } from "./shared/status-badge"
import { BugReportMobileCard } from "./bug-report-mobile-card"
import { BugReportDetailDrawer } from "./bug-report-detail-drawer"
import { EditBugReportDialog } from "./edit-bug-report-dialog"
import { AssignBugReportDialog } from "./assign-bug-report-dialog"
import { DeleteBugReportDialog } from "./delete-bug-report-dialog"

// ── Types ─────────────────────────────────────────────────────────────────────

interface BugReportTableProps {
  items: BugReport[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: BugReportFilters
  onFilterChange: (f: Partial<BugReportFilters>) => void
  onMutated: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const SKELETON_ROWS = 8

// ── Component ─────────────────────────────────────────────────────────────────

export function BugReportTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onMutated,
}: BugReportTableProps) {
  // ── Assigned filter (client-side) ─────────────────────────────────────────
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("all")

  const displayedItems = items.filter((r) => {
    if (assignedFilter === "assigned") return r.assigned_to !== null
    if (assignedFilter === "unassigned") return r.assigned_to === null
    return true
  })

  // ── Resolve dialog state ──────────────────────────────────────────────────
  const [resolveTarget, setResolveTarget] = useState<BugReport | null>(null)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [isResolving, setIsResolving] = useState(false)

  async function handleResolveConfirm(e: React.MouseEvent) {
    e.preventDefault()
    if (!resolveTarget) return
    setIsResolving(true)
    try {
      await resolveBugReport(resolveTarget.id)
      toast.success("Bug report marked as resolved.")
      setResolveOpen(false)
      setResolveTarget(null)
      onMutated()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to resolve bug report."
      if (isApiError(err)) msg = err.message || msg
      toast.error(msg)
    } finally {
      setIsResolving(false)
    }
  }

  function openResolve(report: BugReport) {
    setResolveTarget(report)
    setResolveOpen(true)
  }

  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [detailTarget, setDetailTarget] = useState<BugReport | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function openDetail(report: BugReport) {
    setDetailTarget(report)
    setDetailOpen(true)
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<BugReport | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  function openEdit(report: BugReport) {
    setEditTarget(report)
    setEditOpen(true)
  }

  // ── Assign dialog ─────────────────────────────────────────────────────────
  const [assignTarget, setAssignTarget] = useState<BugReport | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)

  function openAssign(report: BugReport) {
    setAssignTarget(report)
    setAssignOpen(true)
  }

  // ── Delete dialog ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<BugReport | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function openDelete(report: BugReport) {
    setDeleteTarget(report)
    setDeleteOpen(true)
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  function prevPage() {
    if (currentPage > 1) onFilterChange({ page: currentPage - 1 })
  }
  function nextPage() {
    if (currentPage < lastPage) onFilterChange({ page: currentPage + 1 })
  }

  // ── Filters helpers ───────────────────────────────────────────────────────
  const hasActiveFilters = Boolean(filters.search || filters.priority || filters.status)

  const resultCount = meta
    ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
    : null

  function clearAll() {
    onFilterChange({ search: undefined, priority: undefined, status: undefined, page: 1 })
    setAssignedFilter("all")
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <BugReportFiltersToolbar
        filters={filters}
        assignedFilter={assignedFilter}
        resultCount={resultCount}
        onFilterChange={onFilterChange}
        onAssignedFilterChange={setAssignedFilter}
        onClearAll={clearAll}
      />

      {/* ── Desktop table ──────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="hidden xl:table-cell">Page URL</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="hidden lg:table-cell">Resolved</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <BugIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No bug reports found.</p>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedItems.map((report) => {
                const canResolve =
                  report.status !== "resolved" && report.status !== "closed"
                return (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-[260px]">
                      <p className="font-medium line-clamp-1">{report.title}</p>
                      {report.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {report.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={report.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={report.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {report.reported_by?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {report.assigned_to?.name ?? (
                        <span className="italic opacity-50">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {report.page_url ? (
                        <a
                          href={report.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline max-w-[160px] truncate"
                        >
                          <ExternalLinkIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{report.page_url}</span>
                        </a>
                      ) : (
                        <span className="text-muted-foreground opacity-40">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(report.created_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(report.resolved_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                            <span className="sr-only">Row actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openDetail(report)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openEdit(report)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openAssign(report)}>
                            Assign
                          </DropdownMenuItem>
                          {canResolve && (
                            <DropdownMenuItem onSelect={() => openResolve(report)}>
                              Resolve
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => openDelete(report)}
                            className="text-destructive focus:text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <BugIcon className="h-8 w-8 opacity-30" />
            <p className="text-sm">No bug reports found.</p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          displayedItems.map((report) => (
            <BugReportMobileCard
              key={report.id}
              report={report}
              onView={() => openDetail(report)}
              onEdit={() => openEdit(report)}
              onAssign={() => openAssign(report)}
              onResolve={() => openResolve(report)}
              onDelete={() => openDelete(report)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!isLoading && meta && lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {lastPage}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={currentPage >= lastPage}
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialogs & drawers ──────────────────────────────────────────────── */}
      <BugReportDetailDrawer
        report={detailTarget}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <EditBugReportDialog
        report={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() => {
          setEditOpen(false)
          onMutated()
        }}
      />

      <AssignBugReportDialog
        report={assignTarget}
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onAssigned={() => {
          setAssignOpen(false)
          onMutated()
        }}
      />

      <DeleteBugReportDialog
        report={deleteTarget}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          setDeleteOpen(false)
          onMutated()
        }}
      />

      {/* Resolve AlertDialog (inline) */}
      <AlertDialog
        open={resolveOpen}
        onOpenChange={(next) => {
          if (!next) setResolveTarget(null)
          setResolveOpen(next)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as resolved?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the bug report as resolved. You can reopen it later
              by changing the status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResolving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveConfirm} disabled={isResolving}>
              {isResolving ? "Resolving…" : "Resolve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
