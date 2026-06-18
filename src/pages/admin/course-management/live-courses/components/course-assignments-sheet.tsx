// ─── Course Assignments Sheet ─────────────────────────────────────────────────
// Elegant slide-over showing all course assignments with summary stats,
// rich cards (course info + user avatar + session dates), and delete support.

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getInitials(name?: string | null): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function levelColor(level?: string | null) {
  switch (level?.toLowerCase()) {
    case "beginner":    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
    case "intermediate":return "bg-amber-500/15 text-amber-400 border-amber-500/25"
    case "advanced":    return "bg-red-500/15 text-red-400 border-red-500/25"
    default:            return "bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
  }
}

// ── Assignment card ───────────────────────────────────────────────────────────

function AssignmentCard({
  assignment,
  onDelete,
  isDeleting,
}: {
  assignment: CourseAssignmentResource
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const [confirming, setConfirming] = useState(false)
  const course = assignment.course
  const user   = assignment.user
  const avail  = assignment.course_availability

  function handleDeleteClick() {
    if (confirming) {
      onDelete(assignment.id)
    } else {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 transition-colors hover:border-white/20 hover:bg-card/80">
      {/* Accent stripe */}
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-600" />

      <div className="pl-5 pr-4 py-4">

        {/* ── Course row ── */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-start gap-2 min-w-0">
            <BookOpenIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-snug">
                {course?.name ?? `Course #${assignment.course_id ?? "?"}`}
              </p>
              {course?.description && (
                <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                  {course.description}
                </p>
              )}
            </div>
          </div>

          {/* Badges + delete */}
          <div className="flex shrink-0 items-center gap-1.5">
            {course?.level && (
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${levelColor(course.level)}`}
              >
                {course.level}
              </span>
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

        <Separator className="my-3 bg-white/5" />

        {/* ── User row ── */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-snug">
              {user?.name ?? `User #${assignment.user_id ?? "?"}`}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* ── Meta footer ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
          {avail?.start_date && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 text-violet-400" />
              {formatDate(avail.start_date)}
              {avail.end_date && avail.end_date !== avail.start_date && (
                <> → {formatDate(avail.end_date)}</>
              )}
            </span>
          )}
          {assignment.assigned_at && (
            <span className="flex items-center gap-1">
              <CheckIcon className="h-3 w-3 text-emerald-400" />
              {formatDate(assignment.assigned_at)}
            </span>
          )}
          {assignment.assigned_by_user?.name && (
            <span className="text-muted-foreground/50">
              by {assignment.assigned_by_user.name}
            </span>
          )}
          <span className="ml-auto text-muted-foreground/30 tabular-nums">
            #{assignment.id}
          </span>
        </div>

      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card/60">
      <div className="flex">
        <div className="w-[3px] shrink-0 bg-muted/30" />
        <div className="flex-1 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Separator className="bg-white/5" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}

// ── Main sheet ────────────────────────────────────────────────────────────────

interface CourseAssignmentsSheetProps {
  open: boolean
  onClose: () => void
}

export function CourseAssignmentsSheet({ open, onClose }: CourseAssignmentsSheetProps) {
  const {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    isDeleting,
    filters,
    fetchAssignments,
    setFilters,
    deleteAssignment,
  } = useCourseAssignmentStore()

  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const lastErrorRef  = useRef<string | null>(null)
  const deletingIdRef = useRef<number | null>(null)
  const searchMounted = useRef(false)

  // Load on open
  useEffect(() => {
    if (open) {
      searchMounted.current = false
      fetchAssignments({ page: 1 })
    }
  }, [open, fetchAssignments])

  // Debounced search
  useEffect(() => {
    if (!searchMounted.current) { searchMounted.current = true; return }
    const id = setTimeout(() => {
      setFilters({ search: searchDraft, page: 1 })
    }, 400)
    return () => clearTimeout(id)
  }, [searchDraft])

  // Toast errors
  useEffect(() => {
    if (!error) { lastErrorRef.current = null; return }
    if (lastErrorRef.current === error) return
    lastErrorRef.current = error
    toast.error(error)
  }, [error])

  async function handleDelete(id: number) {
    deletingIdRef.current = id
    try {
      await deleteAssignment(id)
      toast.success("Assignment removed.")
    } finally {
      deletingIdRef.current = null
    }
  }

  function handlePageChange(page: number) {
    fetchAssignments({ ...filters, page })
  }

  // ── Summary card icons ────────────────────────────────────────────────────

  function summaryIcon(key: string) {
    switch (key) {
      case "total_course_assignments": return ClipboardListIcon
      case "assigned_users":           return UsersIcon
      case "assigned_courses":         return BookOpenIcon
      default:                         return CalendarDaysIcon
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <ClipboardListIcon className="h-5 w-5 text-primary" />
              Course Assignments
            </SheetTitle>
            {meta && (
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {meta.total} total
              </Badge>
            )}
          </div>
          <SheetDescription>
            View and manage all manual course assignments.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        {summaryCards.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 px-6 py-4">
              {summaryCards.map((card) => {
                const Icon = summaryIcon(card.key)
                return (
                  <div
                    key={card.key}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-muted/30 px-3 py-3 text-center"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {card.value}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.14em] leading-tight text-muted-foreground line-clamp-2">
                      {card.title}
                    </p>
                  </div>
                )
              })}
            </div>
            <Separator />
          </>
        )}

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-6 py-3">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by user, course…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fetchAssignments({ page: 1 })}
            disabled={isLoading}
            aria-label="Refresh"
          >
            {isLoading
              ? <Loader2Icon className="h-4 w-4 animate-spin" />
              : <RefreshCwIcon className="h-4 w-4" />}
          </Button>
          {searchDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setSearchDraft("")}
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator />

        {/* ── Content list ───────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {/* Loading */}
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}

          {/* Empty */}
          {!isLoading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ClipboardListIcon className="mb-4 h-12 w-12 text-muted-foreground/25" />
              <p className="text-sm font-medium text-muted-foreground">No assignments found</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {filters.search
                  ? "Try a different search term"
                  : "Assign a course to a user to get started"}
              </p>
            </div>
          )}

          {/* Cards */}
          {!isLoading && items.map((assignment: CourseAssignmentResource) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={handleDelete}
              isDeleting={isDeleting && deletingIdRef.current === assignment.id}
            />
          ))}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────── */}
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
                <span className="min-w-[4rem] text-center text-xs text-muted-foreground">
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
