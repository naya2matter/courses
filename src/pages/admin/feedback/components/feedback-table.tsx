// ─── FeedbackTable ────────────────────────────────────────────────────────────
// Orchestrator: filters toolbar, desktop table, mobile cards, pagination,
// and all dialogs/drawers for the feedback feature.

import { useState } from "react"
import { toast } from "sonner"
import {
  MessageSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type { Feedback, FeedbackFilters, PaginationMeta } from "../types/feedback.types"
import { FeedbackFiltersToolbar } from "./feedback-filters-toolbar"
import { FeedbackStatusBadge } from "./shared/feedback-status-badge"
import { FeedbackTypeBadge } from "./shared/feedback-type-badge"
import { FeedbackMobileCard } from "./feedback-mobile-card"
import { FeedbackDetailDrawer } from "./feedback-detail-drawer"
import { RespondFeedbackDialog } from "./respond-feedback-dialog"
import { UpdateFeedbackStatusDialog } from "./update-feedback-status-dialog"

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedbackTableProps {
  items: Feedback[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: FeedbackFilters
  onFilterChange: (f: Partial<FeedbackFilters>) => void
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

export function FeedbackTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onMutated,
}: FeedbackTableProps) {
  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [detailTarget, setDetailTarget] = useState<Feedback | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function openDetail(fb: Feedback) {
    setDetailTarget(fb)
    setDetailOpen(true)
  }

  // ── Respond dialog ────────────────────────────────────────────────────────
  const [respondTarget, setRespondTarget] = useState<Feedback | null>(null)
  const [respondOpen, setRespondOpen] = useState(false)

  function openRespond(fb: Feedback) {
    setRespondTarget(fb)
    setRespondOpen(true)
  }

  // ── Update status dialog ──────────────────────────────────────────────────
  const [statusTarget, setStatusTarget] = useState<Feedback | null>(null)
  const [statusOpen, setStatusOpen] = useState(false)

  function openStatus(fb: Feedback) {
    setStatusTarget(fb)
    setStatusOpen(true)
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

  // ── Filter helpers ────────────────────────────────────────────────────────
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.type)

  const resultCount = meta
    ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
    : null

  function clearAll() {
    onFilterChange({ search: undefined, status: undefined, type: undefined, page: 1 })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <FeedbackFiltersToolbar
        filters={filters}
        resultCount={resultCount}
        onFilterChange={onFilterChange}
        onClearAll={clearAll}
      />

      {/* ── Desktop table ──────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead className="hidden lg:table-cell">Department</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="hidden xl:table-cell">Admin Response</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <MessageSquareIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No feedback found.</p>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((fb) => (
                <TableRow
                  key={fb.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(fb)}
                >
                  <TableCell className="max-w-[260px]">
                    <p className="font-medium line-clamp-1">{fb.title}</p>
                    {fb.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {fb.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <FeedbackTypeBadge type={fb.type} />
                  </TableCell>
                  <TableCell>
                    <FeedbackStatusBadge status={fb.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {fb.user.name}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {fb.user.department?.name ?? (
                      <span className="italic opacity-50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(fb.created_at)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell max-w-[200px]">
                    {fb.admin_response ? (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {fb.admin_response}
                      </p>
                    ) : (
                      <span className="text-xs italic text-muted-foreground opacity-50">
                        No response yet
                      </span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                          <span className="sr-only">Row actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openDetail(fb)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openRespond(fb)}>
                          Respond
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openStatus(fb)}>
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <MessageSquareIcon className="h-8 w-8 opacity-30" />
            <p className="text-sm">No feedback found.</p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          items.map((fb) => (
            <FeedbackMobileCard
              key={fb.id}
              feedback={fb}
              onView={() => openDetail(fb)}
              onRespond={() => openRespond(fb)}
              onUpdateStatus={() => openStatus(fb)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {meta.from != null && meta.to != null
              ? `Showing ${meta.from}–${meta.to} of ${meta.total?.toLocaleString() ?? 0}`
              : `${meta.total?.toLocaleString() ?? 0} feedback`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums text-muted-foreground">
              {currentPage} / {lastPage}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage <= 1 || isLoading}
              onClick={prevPage}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={currentPage >= lastPage || isLoading}
              onClick={nextPage}
              aria-label="Next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────────────────── */}
      <FeedbackDetailDrawer
        feedback={detailTarget}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* ── Respond dialog ────────────────────────────────────────────────── */}
      <RespondFeedbackDialog
        feedback={respondTarget}
        open={respondOpen}
        onOpenChange={setRespondOpen}
        onUpdated={() => {
          toast.success("Response submitted successfully.")
          onMutated()
        }}
      />

      {/* ── Update status dialog ──────────────────────────────────────────── */}
      <UpdateFeedbackStatusDialog
        feedback={statusTarget}
        open={statusOpen}
        onOpenChange={setStatusOpen}
        onUpdated={() => {
          toast.success("Feedback status updated.")
          onMutated()
        }}
      />
    </div>
  )
}
