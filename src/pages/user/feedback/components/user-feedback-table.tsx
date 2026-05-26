// ─── UserFeedbackTable ────────────────────────────────────────────────────────
// Desktop table + mobile cards + pagination + detail drawer for user feedback.

import { useState } from "react"
import {
  MessageSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageSquareTextIcon,
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
import { Skeleton } from "@/components/ui/skeleton"
import type { PaginationMeta, UserFeedback, UserFeedbackFilters } from "../types/user-feedback.types"
import { UserFeedbackFiltersToolbar } from "./user-feedback-filters-toolbar"
import { UserFeedbackStatusBadge } from "./shared/user-feedback-status-badge"
import { UserFeedbackTypeBadge } from "./shared/user-feedback-type-badge"
import { UserFeedbackMobileCard } from "./user-feedback-mobile-card"
import { UserFeedbackDetailDrawer } from "./user-feedback-detail-drawer"

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserFeedbackTableProps {
  items: UserFeedback[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: UserFeedbackFilters
  onFilterChange: (f: Partial<UserFeedbackFilters>) => void
  onClearAll: () => void
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

export function UserFeedbackTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onClearAll,
}: UserFeedbackTableProps) {
  // ── Local text search (client-side) ──────────────────────────────────────
  const [searchText, setSearchText] = useState("")

  const displayedItems = searchText.trim()
    ? items.filter(
        (f) =>
          f.title.toLowerCase().includes(searchText.toLowerCase()) ||
          f.description.toLowerCase().includes(searchText.toLowerCase()),
      )
    : items

  // ── Detail drawer ─────────────────────────────────────────────────────────
  const [detailTarget, setDetailTarget] = useState<UserFeedback | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function openDetail(fb: UserFeedback) {
    setDetailTarget(fb)
    setDetailOpen(true)
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
  const hasActiveFilters = Boolean(filters.status || filters.type || searchText.trim())

  function clearAll() {
    setSearchText("")
    onClearAll()
  }

  const resultCount = meta
    ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
    : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <UserFeedbackFiltersToolbar
        filters={filters}
        searchText={searchText}
        resultCount={resultCount}
        onFilterChange={onFilterChange}
        onSearchTextChange={setSearchText}
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
              <TableHead>Submitted</TableHead>
              <TableHead>Admin Response</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                </TableRow>
              ))
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <MessageSquareIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">
                      {hasActiveFilters ? "No feedback matches your filters." : "You haven't submitted any feedback yet."}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedItems.map((fb) => (
                <TableRow
                  key={fb.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openDetail(fb)}
                >
                  <TableCell className="max-w-[280px]">
                    <p className="font-medium line-clamp-1">{fb.title}</p>
                    {fb.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {fb.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <UserFeedbackTypeBadge type={fb.type} />
                  </TableCell>
                  <TableCell>
                    <UserFeedbackStatusBadge status={fb.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(fb.created_at)}
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    {fb.admin_response ? (
                      <div className="flex items-start gap-1.5">
                        <MessageSquareTextIcon className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {fb.admin_response}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground opacity-50">
                        Awaiting response
                      </span>
                    )}
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
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <MessageSquareIcon className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {hasActiveFilters ? "No feedback matches your filters." : "You haven't submitted any feedback yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          displayedItems.map((fb) => (
            <UserFeedbackMobileCard
              key={fb.id}
              feedback={fb}
              onView={() => openDetail(fb)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={prevPage}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= lastPage || isLoading}
              onClick={nextPage}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ─────────────────────────────────────────────────── */}
      <UserFeedbackDetailDrawer
        feedback={detailTarget}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
