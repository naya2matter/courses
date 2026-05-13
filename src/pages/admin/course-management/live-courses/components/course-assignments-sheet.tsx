// ─── Course Assignments Sheet ─────────────────────────────────────────────────
// Slide-out sheet that shows all course assignments with delete capability.
// GET /admin/course-assignments/getAll
// DELETE /admin/course-assignments/delete/{id}

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  Loader2Icon,
  Trash2Icon,
  AlertCircleIcon,
  XIcon,
  ClipboardListIcon,
  RefreshCwIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  ShieldAlertIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { useCourseAssignmentStore } from "../store/course-assignment.store"
import type { CourseAssignmentResource } from "../types/course-assignment.types"

interface CourseAssignmentsSheetProps {
  open: boolean
  onClose: () => void
}

function formatDate(d?: string | null) {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return d
  }
}

function AssignmentRow({
  assignment,
  onDelete,
  isDeleting,
}: {
  assignment: CourseAssignmentResource
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const [confirming, setConfirming] = useState(false)

  function handleDeleteClick() {
    if (confirming) {
      onDelete(assignment.id)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card/60 transition-colors hover:bg-card hover:border-border">
      <div className="flex items-stretch gap-0">
        {/* Accent stripe */}
        <div className="w-1 shrink-0 rounded-l-2xl bg-linear-to-b from-indigo-500 to-violet-500" />

        {/* Content */}
        <div className="min-w-0 flex-1 p-4">
          {/* Top row: course name + delete */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <p className="truncate text-sm font-semibold text-foreground">
                {assignment.course?.name ?? `Course #${assignment.course?.id ?? "?"}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {assignment.course?.id && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                  #{assignment.course.id}
                </Badge>
              )}
              <Button
                variant={confirming ? "destructive" : "ghost"}
                size="icon"
                className={`h-7 w-7 shrink-0 transition-all ${
                  confirming
                    ? "scale-105"
                    : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                }`}
                onClick={handleDeleteClick}
                disabled={isDeleting}
                aria-label={confirming ? "Confirm delete" : "Delete assignment"}
                title={confirming ? "Click again to confirm" : "Delete"}
              >
                {isDeleting ? (
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                ) : confirming ? (
                  <ShieldAlertIcon className="h-3.5 w-3.5" />
                ) : (
                  <Trash2Icon className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="h-3.5 w-3.5 shrink-0 text-sky-400" />
            <div className="min-w-0">
              <span className="text-sm text-foreground">
                {assignment.user?.name ?? `User #${assignment.user?.id ?? "?"}`}
              </span>
              {assignment.user?.email && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {assignment.user.email}
                </span>
              )}
            </div>
          </div>

          {/* Session */}
          {assignment.course_availability && (
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-violet-400" />
              <span className="text-xs text-muted-foreground">
                {formatDate(assignment.course_availability.start_date)}
                {assignment.course_availability.end_date &&
                  ` → ${formatDate(assignment.course_availability.end_date)}`}
              </span>
            </div>
          )}

          {/* Footer meta */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 border-t border-border/40 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
            <span>#{assignment.id}</span>
            {assignment.assigned_at && (
              <span>{formatDate(assignment.assigned_at)}</span>
            )}
            {assignment.assigned_by && (
              <span>by {assignment.assigned_by.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function CourseAssignmentsSheet({ open, onClose }: CourseAssignmentsSheetProps) {
  const {
    items,
    meta,
    isLoading,
    error,
    isDeleting,
    filters,
    fetchAssignments,
    setFilters,
    deleteAssignment,
    clearError,
  } = useCourseAssignmentStore()

  const [searchValue, setSearchValue] = useState(filters.search ?? "")
  const lastErrorRef = useRef<string | null>(null)
  const deletingIdRef = useRef<number | null>(null)

  // Load on open
  useEffect(() => {
    if (open) {
      fetchAssignments({ page: 1 })
    }
  }, [open, fetchAssignments])

  // Toast errors
  useEffect(() => {
    if (!error) { lastErrorRef.current = null; return }
    if (lastErrorRef.current === error) return
    lastErrorRef.current = error
    toast.error(error)
  }, [error])

  function handleSearch(value: string) {
    setSearchValue(value)
    setFilters({ search: value })
  }

  async function handleDelete(id: number) {
    deletingIdRef.current = id
    try {
      await deleteAssignment(id)
      toast.success("Assignment deleted.")
    } catch {
      // error shown via store error state
    } finally {
      deletingIdRef.current = null
    }
  }

  function handlePageChange(page: number) {
    fetchAssignments({ ...filters, page })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-xl overflow-hidden p-0"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 pt-6 pb-5">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <ClipboardListIcon className="h-5 w-5 text-primary" />
              Course Assignments
            </SheetTitle>
            {meta && (
              <Badge variant="secondary" className="shrink-0">
                {meta.total} total
              </Badge>
            )}
          </div>
          <SheetDescription>
            View and manage all manual course assignments.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 py-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search assignments…"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => fetchAssignments({ page: 1 })}
            disabled={isLoading}
            aria-label="Refresh assignments"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator />

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <div className="flex w-full items-start justify-between gap-2">
                <AlertDescription>{error}</AlertDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={clearError}
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Alert>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
                  <div className="w-1 shrink-0 bg-muted/40" />
                  <div className="flex-1 p-4 space-y-2.5">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardListIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-medium text-muted-foreground">
                No assignments found
              </p>
              <p className="mt-1 text-sm text-muted-foreground/60">
                {filters.search
                  ? "Try a different search term"
                  : "Assign a course to a user to get started"}
              </p>
            </div>
          )}

          {/* Assignment rows */}
          {!isLoading &&
            items.map((assignment: CourseAssignmentResource) => (
              <AssignmentRow
                key={assignment.id}
                assignment={assignment}
                onDelete={handleDelete}
                isDeleting={isDeleting && deletingIdRef.current === assignment.id}
              />
            ))}
        </div>

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {meta && meta.last_page > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-6 py-4">
              <p className="text-xs text-muted-foreground">
                {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(meta.current_page - 1)}
                  disabled={meta.current_page === 1 || isLoading}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {meta.current_page} / {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(meta.current_page + 1)}
                  disabled={meta.current_page === meta.last_page || isLoading}
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
