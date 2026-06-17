// ─── OnlineCourseGrid ─────────────────────────────────────────────────────────
// Orchestrates: filters toolbar · grid/list toggle · cards · pagination · drawer.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GridIcon,
  LayersIcon,
  ListIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"
import { isApiError } from "@/lib/api"
import { deleteOnlineCourse } from "../service/online-course.service"
import type { OnlineCourse, OnlineCourseFilters, PaginationMeta } from "../types/online-course.types"
import { OnlineCourseFiltersToolbar } from "./online-course-filters-toolbar"
import { OnlineCourseCard, OnlineCourseListRow } from "./online-course-card"

// ── Skeleton helpers ──────────────────────────────────────────────────────────

function GridSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[300px] rounded-2xl" />
      ))}
    </div>
  )
}

function ListSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseGridProps {
  items: OnlineCourse[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: OnlineCourseFilters
  onFilterChange: (f: Partial<OnlineCourseFilters>) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnlineCourseGrid({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
}: OnlineCourseGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const navigate = useNavigate()

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<OnlineCourse | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await deleteOnlineCourse(deleteTarget.id)
      toast.success(`"${deleteTarget.name}" deleted successfully.`)
      setDeleteTarget(null)
      // Re-fetch the list with current filters reset to page 1
      onFilterChange({ page: 1 })
    } catch (err) {
      let msg = "Failed to delete course. Please try again."
      if (isApiError(err)) {
        msg =
          err.status === 422
            ? "This course has active user assignments. Please unassign all users before deleting."
            : err.message || msg
      } else if (err instanceof Error) {
        msg = err.message
      }
      setDeleteError(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  function openDetail(id: number) {
    navigate(`/admin/course-management/online-courses/${id}`)
  }

  function openEdit(id: number) {
    navigate(`/admin/course-management/online-courses/edit/${id}`)
  }

  // Pagination
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  function prevPage() {
    if (currentPage > 1) onFilterChange({ page: currentPage - 1 })
  }
  function nextPage() {
    if (currentPage < lastPage) onFilterChange({ page: currentPage + 1 })
  }

  // Filter helpers
  const resultCount = meta
    ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
    : null

  function clearAll() {
    onFilterChange({ search: undefined, status: undefined, page: 1 })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Filters + view toggle row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <OnlineCourseFiltersToolbar
          filters={filters}
          resultCount={resultCount}
          onFilterChange={onFilterChange}
          onClearAll={clearAll}
        />

        {/* View toggle */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        viewMode === "grid" ? <GridSkeletons /> : <ListSkeletons />
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-card/40 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <LayersIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">No courses found</p>
            <p className="text-sm text-muted-foreground/60 mt-0.5">
              {filters.search || filters.status
                ? "Try clearing your filters"
                : "No online courses have been created yet"}
            </p>
          </div>
        </div>
      )}

      {/* Grid view */}
      {!isLoading && viewMode === "grid" && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((course) => (
            <OnlineCourseCard
              key={course.id}
              course={course}
              onView={() => openDetail(course.id)}
              onEdit={() => openEdit(course.id)}
              onDelete={() => { setDeleteError(null); setDeleteTarget(course) }}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && viewMode === "list" && items.length > 0 && (
        <div className="space-y-2">
          {items.map((course) => (
            <OnlineCourseListRow
              key={course.id}
              course={course}
              onView={() => openDetail(course.id)}
              onEdit={() => openEdit(course.id)}
              onDelete={() => { setDeleteError(null); setDeleteTarget(course) }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage <= 1 || isLoading}
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm text-muted-foreground tabular-nums">
            Page {currentPage} of {lastPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage >= lastPage || isLoading}
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
        title="Delete online course?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed. This action cannot be undone. If the course has active user assignments, deletion will be blocked.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete Course"
        isLoading={isDeleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
