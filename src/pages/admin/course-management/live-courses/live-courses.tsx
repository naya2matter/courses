// ─── Courses Page ────────────────────────────────────────────────────────────
// Displays list of courses with grid and list view options

import { useState } from "react"
import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  BookOpenIcon,
  ClipboardListIcon,
  ClockIcon,
  GraduationCapIcon,
  GridIcon,
  ListIcon,
  Loader2Icon,
  RefreshCwIcon,
  UserPlusIcon,
  XIcon,
  LockIcon,
  UnlockIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CalendarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import MouseTiltCard from "@/components/ui/mouse-tilt-card"
import { Input } from "@/components/ui/input"

import { useCourse } from "./hook/use-course"
import { DeleteCourseDialog } from "./components/delete-course-dialog"
import { AssignCourseDialog } from "./components/assign-course-dialog"
import { CourseAssignmentsSheet } from "./components/course-assignments-sheet"
import { CourseDetailsSheet } from "./components/course-details-sheet"
import { parseAvailabilities } from "./utils/availability"
import type { CourseResource } from "./types/course.types"

/**
 * Format duration from minutes to human-readable string
 */
function formatDuration(minutes: number | null): string {
  if (!minutes) return "N/A"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`

  return `${hours}h ${mins}m`
}

function formatDateString(dateString?: string | null): string {
  if (!dateString) return "TBD"

  try {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateString
  }
}

/**
 * Get badge variant based on course status
 */
function getStatusVariant(status: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "active":
      return "default"
    case "draft":
      return "secondary"
    case "archived":
      return "destructive"
    default:
      return "outline"
  }
}

function getLevelLabel(level: CourseResource["level"]): string {
  if (!level) return "Unknown"
  return typeof level === "string" ? level : level.name
}

function getAvailabilityMetrics(availabilities: unknown) {
  const parsed = parseAvailabilities(availabilities)

  let totalCapacity = 0
  let totalUsed = 0
  let earliestStart: string | null = null

  parsed.forEach((slot) => {
    const capacity = Number(slot.capacity)
    const availableSpots = Number(slot.available_spots)

    if (!isNaN(capacity) && capacity > 0) {
      totalCapacity += capacity
    }

    if (!isNaN(capacity) && capacity >= 0) {
      const used = !isNaN(availableSpots)
        ? Math.max(0, capacity - availableSpots)
        : 0
      totalUsed += used
    }

    if (slot.start_date) {
      const current = new Date(slot.start_date)
      if (!isNaN(current.getTime())) {
        if (!earliestStart || current < new Date(earliestStart)) {
          earliestStart = slot.start_date
        }
      }
    }
  })

  return {
    parsed,
    totalCapacity,
    totalUsed,
    sessionsCount: parsed.length,
    startLabel: formatDateString(earliestStart),
  }
}

function CourseAvailabilitiesCollapse({ availabilities, dark = false }: { availabilities: unknown; dark?: boolean }) {
  const { parsed } = getAvailabilityMetrics(availabilities)
  if (!parsed.length) return null

  return (
    <details
      className="group rounded-xl border border-border/60 bg-background/30"
      onClick={(e) => e.stopPropagation()}
    >
      <summary
        className="cursor-pointer list-none select-none px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        Availabilities ({parsed.length})
      </summary>
      <div className="px-3 pb-3 space-y-2">
        {parsed.map((slot, index) => {
          const capacity = Number(slot.capacity)
          const availableSpots = Number(slot.available_spots)
          const used = !isNaN(capacity) && capacity >= 0
            ? (!isNaN(availableSpots) ? Math.max(0, capacity - availableSpots) : 0)
            : null

          return (
            <div
              key={slot.id ?? index}
              className={dark ? "rounded-lg bg-white/10 p-2 text-xs text-white/85" : "rounded-lg bg-muted/30 p-2 text-xs text-muted-foreground"}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{formatDateString(slot.start_date)}</span>
                <span>
                  {isNaN(capacity) || capacity <= 0
                    ? "Unlimited"
                    : `${used ?? 0}/${capacity} used`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </details>
  )
}


export default function LiveCoursesPage() {
  const navigate = useNavigate()
  const {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    filters,
    clearError,
    fetchCourses,
    setFilters,
    deleteCourse,
  } = useCourse()

  // View toggle state (grid or list)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Search input local state
  const [searchValue, setSearchValue] = useState(filters.search || "")

  // Delete dialog target
  const [deleteTarget, setDeleteTarget] = useState<CourseResource | null>(null)
  const lastErrorToastRef = useRef<string | null>(null)

  // Course details sheet
  const [detailSheetCourseId, setDetailSheetCourseId] = useState<number | null>(null)

  // Course assignment dialog/sheet state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignTarget, setAssignTarget] = useState<CourseResource | null>(null)
  const [assignmentsSheetOpen, setAssignmentsSheetOpen] = useState(false)

  useEffect(() => {
    if (!error) {
      lastErrorToastRef.current = null
      return
    }

    if (lastErrorToastRef.current === error) return
    lastErrorToastRef.current = error
    toast.error(error)
  }, [error])

  /**
   * Handle search input change with debounce
   */
  function handleSearch(value: string) {
    setSearchValue(value)
    setFilters({ search: value })
  }

  /**
   * Get icon for summary cards based on key
   */
  function getSummaryIcon(key: string) {
    switch (key) {
      case "total_courses":
        return BookOpenIcon
      case "active_courses":
        return GraduationCapIcon
      case "draft_courses":
        return ClockIcon
      default:
        return BookOpenIcon
    }
  }

  function handleCourseClick(id: number) {
    setDetailSheetCourseId(id)
  }

  /** Open create sheet */
  function handleOpenCreate() {
    navigate("/admin/course-management/live-courses/create")
  }

  /** Open edit sheet pre-filled with course data */
  function handleOpenEdit(e: React.MouseEvent, course: CourseResource) {
    e.stopPropagation()
    navigate(`/admin/course-management/live-courses/edit/${course.id}`)
  }

  /** Opens the assign dialog pre-filled with the given course */
  function handleOpenAssign(e: React.MouseEvent, course: CourseResource) {
    e.stopPropagation()
    setAssignTarget(course)
    setAssignDialogOpen(true)
  }

  /** Open delete confirmation dialog */
  function handleOpenDelete(e: React.MouseEvent, course: CourseResource) {
    e.stopPropagation()
    setDeleteTarget(course)
  }

  /** Confirms delete for the currently targeted course */
  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await deleteCourse(deleteTarget.id)
  }

  /**
   * Handle pagination
   */
  function handlePageChange(page: number) {
    setFilters({ page })
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Courses</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and manage all available courses in the system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fetchCourses()} disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setAssignmentsSheetOpen(true)}
          >
            <ClipboardListIcon className="mr-2 h-4 w-4" />
            View Assignments
          </Button>
          <Button onClick={handleOpenCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            New Course
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────────────── */}
      {summaryCards.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {summaryCards.map((card) => {
            const Icon = getSummaryIcon(card.key)
            return (
              <div
                key={card.key}
                className="flex flex-col items-center text-center rounded-3xl p-2 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border mb-2 border-white/6">
                  <Icon className="size-6 text-sky-400" />
                </div>
                <p className="text-4xl font-semibold tabular-nums text-foreground">{card.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {card.title}
                </p>
              </div>
            )
          })}
        </section>
      )}

      {/* ─── Error Alert ─────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load courses</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* ─── Filters & View Toggle ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search courses..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* View toggle buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ─── Loading State ───────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ─── Empty State ─────────────────────────────────────────────────────── */}
      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpenIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm text-muted-foreground">
              {filters.search ? "Try adjusting your search" : "No courses available"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ─── Grid View ───────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === "grid" && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((course) => {
            const { totalCapacity, totalUsed, sessionsCount, startLabel } =
              getAvailabilityMetrics(course.availabilities)
            const fillPct =
              totalCapacity > 0
                ? Math.min(100, Math.max(0, (totalUsed / totalCapacity) * 100))
                : 0

            return (
              <MouseTiltCard
                key={course.id}
                className="relative cursor-pointer overflow-hidden border-0 rounded-2xl ring-1 ring-white/10"
                onClick={() => handleCourseClick(course.id)}
              >
                <Card className="relative overflow-hidden border-0 rounded-2xl">
                  {/* Background */}
                  <div className="absolute inset-0 z-0 bg-zinc-900">
                    {course.image_path ? (
                      <img
                        src={course.image_path}
                        alt={course.name}
                        className="h-full w-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/40" />
                  </div>

                  {/* Content: fixed 300px, footer always pinned to bottom */}
                  <div className="relative z-10 flex h-[300px] flex-col justify-between overflow-hidden p-5">
                    {/* ── Top group: header + body ── */}
                    <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant={getStatusVariant(course.status)}
                        className="backdrop-blur-md bg-background/50 border-white/10 capitalize"
                      >
                        {course.status || "Unknown"}
                      </Badge>
                      <div className="flex items-center gap-1 rounded-md border border-white/10 bg-background/30 p-0.5 backdrop-blur-md">
                        {course.privacy === "private" ? (
                          <LockIcon className="mx-1 h-4 w-4 text-white/70" />
                        ) : (
                          <UnlockIcon className="mx-1 h-4 w-4 text-white/70" />
                        )}
                        {course.privacy === "private" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-sm text-white/70 hover:bg-emerald-400/20 hover:text-emerald-400"
                            onClick={(e) => handleOpenAssign(e, course)}
                            aria-label="Assign course"
                          >
                            <UserPlusIcon className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-sm text-white/70 hover:bg-white/20 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(e, course) }}
                          aria-label="Edit course"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-sm text-red-400 hover:bg-red-400/20 hover:text-red-300"
                          onClick={(e) => { e.stopPropagation(); handleOpenDelete(e, course) }}
                          aria-label="Delete course"
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* ── Body (fills remaining space) ── */}
                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-white">
                          {course.name}
                        </h3>
                        <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {formatDuration(course.duration)}
                        </div>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs capitalize text-white/50">
                        {course.level ? `Level: ${getLevelLabel(course.level)}` : " "}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-white/65">
                        {course.description || " "}
                      </p>
                    </div>

                    </div>{/* end top group */}

                    {/* ── Footer: pinned to bottom by justify-between ── */}
                    <div>
                      {/* Meta row */}
                      <div className="mb-2.5 flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-indigo-300">
                          <GraduationCapIcon className="h-3 w-3" />
                          {course.registrations_count ?? 0} enrolled
                        </span>
                        {startLabel !== "TBD" && (
                          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/60">
                            <CalendarIcon className="h-3 w-3" />
                            {startLabel}
                          </span>
                        )}
                        {sessionsCount > 0 && (
                          <span className="ml-auto text-white/40">
                            {sessionsCount} session{sessionsCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {/* Capacity bar — always rendered, filled only when data exists */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        {totalCapacity > 0 && (
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all"
                            style={{ width: `${fillPct}%` }}
                          />
                        )}
                      </div>
                      {totalCapacity > 0 && (
                        <p className="mt-1 text-right text-[10px] text-white/35">
                          {totalUsed}/{totalCapacity} seats · {Math.round(fillPct)}% filled
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </MouseTiltCard>
            )
          })}
        </div>
      )}

      {/* ─── List View ───────────────────────────────────────────────────────── */}
      {!isLoading && viewMode === "list" && items.length > 0 && (
        <div className="space-y-4">
          {items.map((course) => {
            const { parsed, totalCapacity, totalUsed, startLabel } =
              getAvailabilityMetrics(course.availabilities)
            const fillPercentage =
              totalCapacity > 0 ? Math.min(100, Math.max(0, (totalUsed / totalCapacity) * 100)) : 0

            return (
              <MouseTiltCard
                key={course.id}
                className="cursor-pointer overflow-hidden transition-all border-border/50 bg-card/60 rounded-2xl backdrop-blur-sm"
                onClick={() => handleCourseClick(course.id)}
              >
                <Card className="overflow-hidden border-0 bg-transparent rounded-2xl">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {/* Left: Thumbnail image */}
                  <div className="relative w-28 sm:w-32 h-28 sm:h-32 shrink-0 bg-muted/30 overflow-hidden border-r border-border/40 rounded-xl flex items-center justify-center">
                      {course.image_path ? (
                        <img
                          src={course.image_path}
                          alt={course.name}
                          className="w-full h-full object-cover transition-transform duration-700"
                        />
                      ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 flex items-center justify-center">
                        <BookOpenIcon className="h-7 w-7 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Status badge floating on image */}
                    <div className="absolute top-3 left-3">
                      <Badge variant={getStatusVariant(course.status)} className="shadow-sm backdrop-blur-md bg-background/80">
                        {course.status || "Unknown"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="outline" className="bg-background/70 backdrop-blur-sm">
                        {course.privacy === "private" ? "Private" : "Public"}
                      </Badge>
                    </div>
                  </div>

                  {/* Right: Course details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="text-xl font-semibold tracking-tight transition-colors line-clamp-2">
                            {course.name}
                          </h3>
                          {course.description && (
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {course.level && (
                              <span className="rounded-full bg-muted/20 px-3 py-1 capitalize">
                                {getLevelLabel(course.level)}
                              </span>
                            )}
                            <span className="rounded-full bg-muted/20 px-3 py-1">
                              {formatDuration(course.duration)}
                            </span>
                            <span className="rounded-full bg-muted/20 px-3 py-1">
                              {parsed.length} sessions
                            </span>
                            {course.registrations_count != null && (
                              <span className="rounded-full bg-indigo-500/10 text-indigo-300 px-3 py-1 flex items-center gap-1">
                                <GraduationCapIcon className="h-3 w-3" />
                                {course.registrations_count} enrolled
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {course.privacy === "private" && (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 hover:text-emerald-500 hover:border-emerald-500/50 hover:bg-emerald-500/10"
                              onClick={(e) => handleOpenAssign(e, course)}
                              aria-label="Assign course"
                              title="Assign to user"
                            >
                              <UserPlusIcon className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:text-primary hover:border-primary/50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(e, course)
                            }}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenDelete(e, course)
                            }}
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                        {parsed.length > 0 && (
                          <div className="rounded-2xl bg-muted/20 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Start</p>
                            <p className="mt-1 text-foreground">{startLabel}</p>
                          </div>
                        )}

                        <div className="rounded-2xl bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Seats</p>
                          <p className="mt-1 text-foreground">
                              {totalCapacity > 0
                                ? `${totalUsed} / ${totalCapacity}`
                                : "Unlimited"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-muted/20 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Capacity</p>
                          <p className="mt-1 text-foreground">
                            {totalCapacity > 0 ? `${Math.round(fillPercentage)}% filled` : "Open"}
                          </p>
                        </div>
                      </div>

                      {totalCapacity > 0 && (
                        <div className="space-y-2">
                          <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500 ease-out"
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{totalUsed} of {totalCapacity} seats used</p>
                        </div>
                      )}

                      {course.availabilities && (
                        <CourseAvailabilitiesCollapse availabilities={course.availabilities} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MouseTiltCard>
              )
            })}
        </div>
      )}

      {/* ─── Pagination ──────────────────────────────────────────────────────── */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {meta.from} to {meta.to} of {meta.total} courses
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.current_page - 1)}
              disabled={meta.current_page === 1 || isLoading}
            >
              Previous
            </Button>

            <span className="text-sm">
              Page {meta.current_page} of {meta.last_page}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.current_page + 1)}
              disabled={meta.current_page === meta.last_page || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ─── Course Details Sheet ─────────────────────────────────────────────── */}
      <CourseDetailsSheet
        courseId={detailSheetCourseId}
        onClose={() => setDetailSheetCourseId(null)}
        onDelete={(course) => setDeleteTarget(course)}
        onAssign={(course) => {
          setAssignTarget(course)
          setAssignDialogOpen(true)
        }}
      />

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────────── */}
      <DeleteCourseDialog
        open={deleteTarget !== null}
        course={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* ─── Assign Course Dialog ─────────────────────────────────────────────── */}
      <AssignCourseDialog
        open={assignDialogOpen}
        preselectedCourse={assignTarget}
        courses={items}
        onClose={() => {
          setAssignDialogOpen(false)
          setAssignTarget(null)
        }}
      />

      {/* ─── Course Assignments Sheet ─────────────────────────────────────────── */}
      <CourseAssignmentsSheet
        open={assignmentsSheetOpen}
        onClose={() => setAssignmentsSheetOpen(false)}
      />
    </div>
  )
}

