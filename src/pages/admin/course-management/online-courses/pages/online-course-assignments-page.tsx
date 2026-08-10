import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"


import { getOnlineCourses } from "../service/online-course.service"
import type { OnlineCourse } from "../types/online-course.types"
import { useOnlineCourseAssignments } from "../hook/use-online-course-assignments"
import { AssignOnlineCourseDialog } from "../components/assign-online-course-dialog"
import { OnlineCourseAssignmentFiltersToolbar } from "../components/online-course-assignment-filters-toolbar"
import type { OnlineCourseAssignmentResource } from "../types/online-course-assignment.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d?: string | null): string {
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

function statIcon(key: string) {
  switch (key) {
    case "total_assignments": return ClipboardListIcon
    case "assigned_users":    return UsersIcon
    case "assigned_courses":  return BookOpenIcon
    default:                  return ClipboardListIcon
  }
}

// ── Assignment card ───────────────────────────────────────────────────────────

function AssignmentCard({
  assignment,
  isDeleting,
  onDelete,
}: {
  assignment: OnlineCourseAssignmentResource
  isDeleting: boolean
  onDelete: (id: number) => void
}) {
  const [confirming, setConfirming] = useState(false)
  const course = assignment.course
  const user   = assignment.user

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
            <p className="truncate text-sm font-semibold leading-snug">
              {course?.name ?? `Course #${assignment.id}`}
            </p>
          </div>

          {/* Overdue badge + delete */}
          <div className="flex shrink-0 items-center gap-1.5">
            {assignment.is_overdue && (
              <Badge className="border border-red-500/30 bg-red-500/15 text-red-400 text-[10px]">
                Overdue
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
              aria-label={confirming ? "Confirm unassign" : "Unassign"}
              title={confirming ? "Click again to confirm" : "Unassign"}
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
              {user?.name ?? `User #${assignment.id}`}
            </p>
            {user?.email && (
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>

        {/* ── Meta footer ── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70">
          {assignment.assigned_at && (
            <span className="flex items-center gap-1">
              <CheckIcon className="h-3 w-3 text-emerald-400" />
              {formatDate(assignment.assigned_at)}
            </span>
          )}
          {assignment.deadline && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 text-violet-400" />
              Due {formatDate(assignment.deadline)}
            </span>
          )}
          {assignment.assigned_by?.name && (
            <span className="text-muted-foreground/50">
              by {assignment.assigned_by.name}
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

// ── Skeleton card ─────────────────────────────────────────────────────────────

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
          <Skeleton className="h-px w-full" />
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnlineCourseAssignmentsPage() {
  const navigate = useNavigate()
  const {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    filters,
    isDeleting,
    fetchAssignments,
    setFilters,
    deleteAssignment,
    clearError,
  } = useOnlineCourseAssignments()

  const [courses, setCourses]           = useState<OnlineCourse[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [assignOpen, setAssignOpen]     = useState(false)
  const [searchDraft, setSearchDraft]   = useState("")
  const deletingIdRef = useRef<number | null>(null)
  const lastErrorRef  = useRef<string | null>(null)

  // Load course options once
  useEffect(() => {
    let mounted = true
    setLoadingOptions(true)
    getOnlineCourses({ per_page: 200 })
      .then((coursesRes) => {
        if (!mounted) return
        setCourses(coursesRes.data)
      })
      .catch((err: Error) => {
        if (!mounted) return
        toast.error(err.message || "Failed to load filter options")
      })
      .finally(() => { if (mounted) setLoadingOptions(false) })
    return () => { mounted = false }
  }, [])

  // Toast errors (deduplicated)
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

  function handlePage(page: number) {
    fetchAssignments({ ...filters, page })
  }

  const resultCount = useMemo(() => {
    if (!meta) return null
    return { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
  }, [meta])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 shrink-0"
            onClick={() => navigate("/admin/course-management/online-courses")}
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-bold tracking-tight">Online Course Assignments</h1>
              {summaryCards.map((card) => {
                const Icon = statIcon(card.key)
                return (
                  <span
                    key={card.key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-muted/40 px-2.5 py-0.5 text-sm tabular-nums text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">{card.value}</span>
                    {card.title}
                  </span>
                )
              })}
            </div>
            <p className="mt-1 text-muted-foreground">
              Assign online courses to users and manage their access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fetchAssignments()} disabled={isLoading}>
            {isLoading
              ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              : <RefreshCwIcon className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setAssignOpen(true)}>
            <UserPlusIcon className="h-4 w-4" />
            Assign Course
          </Button>
        </div>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={clearError}>
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Toolbar: search + selects ─────────────────────────────────────────── */}
      <div className="space-y-3 rounded-2xl border border-white/8 bg-card/40 p-4">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user, course…"
              value={searchDraft}
              onChange={(e) => {
                setSearchDraft(e.target.value)
                setFilters({ search: e.target.value || undefined, page: 1 })
              }}
              className="h-9 pl-9"
            />
          </div>
          {searchDraft && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => { setSearchDraft(""); setFilters({ search: undefined, page: 1 }) }}
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Dropdown filters (course / user / overdue) */}
        {loadingOptions ? (
          <div className="flex gap-3">
            <Skeleton className="h-9 w-[240px]" />
            <Skeleton className="h-9 w-[240px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
        ) : (
          <OnlineCourseAssignmentFiltersToolbar
            filters={filters}
            courses={courses}
            resultCount={resultCount}
            onFilterChange={setFilters}
            onClearAll={() =>
              setFilters({
                course_online_id: undefined,
                user_id: undefined,
                is_overdue: undefined,
                page: 1,
              })
            }
          />
        )}
      </div>

      {/* ── Loading skeletons ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-card/40 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <ClipboardListIcon className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-semibold text-muted-foreground">No assignments found</p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              {filters.course_online_id || filters.user_id || filters.is_overdue != null
                ? "Try clearing your filters"
                : "Assign a course to a user to get started"}
            </p>
          </div>
        </div>
      )}

      {/* ── Cards grid ────────────────────────────────────────────────────────── */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {items.map((assignment: OnlineCourseAssignmentResource) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onDelete={handleDelete}
              isDeleting={isDeleting && deletingIdRef.current === assignment.id}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      {!isLoading && meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(meta.current_page - 1)}
            disabled={meta.current_page <= 1 || isLoading}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground tabular-nums">
            {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} · Page {meta.current_page} of {meta.last_page}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page || isLoading}
          >
            Next
          </Button>
        </div>
      )}

      {/* ── Assign dialog ─────────────────────────────────────────────────────── */}
      <AssignOnlineCourseDialog
        open={assignOpen}
        courses={courses}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => fetchAssignments({ page: 1 })}
      />
    </div>
  )
}
