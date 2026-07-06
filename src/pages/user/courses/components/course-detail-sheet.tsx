// ─── Course Detail Sheet ──────────────────────────────────────────────────────
// Side sheet: course info + enroll + complete + rate + my enrollments tabs.

import { useCallback, useEffect, useState } from "react"
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  GlobeIcon,
  Loader2Icon,
  LockIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { isApiError } from "@/lib/api"

import { getCourseById } from "../service/courses.service"
import type { Course, CourseAvailability, CourseRegistration } from "../types/courses.types"
import { EnrollSection } from "./enroll-section"
import { RatingSection } from "./rating-section"
import { CompleteSection } from "./complete-section"
import { MyEnrollmentsPanel } from "./my-enrollments-panel"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function formatTime(t: string | null): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—"

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`

  return `${hours}h ${mins}m`
}

const LEVEL_STYLES: Record<string, string> = {
  beginner:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  intermediate: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  advanced:     "bg-rose-500/15 text-rose-400 border-rose-500/20",
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  draft:     "bg-slate-500/15 text-slate-400 border-slate-500/20",
  archived:  "bg-orange-500/15 text-orange-400 border-orange-500/20",
  published: "bg-blue-500/15 text-blue-400 border-blue-500/20",
}

// ── Availability Card ─────────────────────────────────────────────────────────

function AvailabilityCard({ av }: { av: CourseAvailability }) {
  const shifts = [av.session_time_shift_1, av.session_time_shift_2, av.session_time_shift_3].filter(Boolean)
  const spotsPercent = av.capacity > 0 ? Math.round(((av.capacity - av.available_spots) / av.capacity) * 100) : 0

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            className={`text-[10px] px-2 py-0.5 border font-medium ${STATUS_STYLES[av.status] ?? STATUS_STYLES.draft}`}
            variant="outline"
          >
            {capitalize(av.status)}
          </Badge>
          {av.is_full && (
            <Badge className="text-[10px] px-2 py-0.5 border bg-red-500/15 text-red-400 border-red-500/20" variant="outline">
              Full
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-white/40">{av.duration_weeks}w</span>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-2 text-xs text-white/60">
        <CalendarIcon className="size-3.5 shrink-0 text-white/30" />
        <span>{formatDate(av.start_date)} → {formatDate(av.end_date)}</span>
      </div>

      {/* Days of week */}
      <div className="flex flex-wrap gap-1.5">
        {av.days_of_week.map((d) => (
          <span
            key={d}
            className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300 capitalize"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Session shifts */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shifts.map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] text-white/60">
              <ClockIcon className="size-3 text-white/30" />
              <span>{formatTime(s)}</span>
            </div>
          ))}
          <span className="text-[10px] text-white/40 self-center">{av.session_duration_minutes}min each</span>
        </div>
      )}

      {/* Capacity row */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-white/50">
          <span className="flex items-center gap-1">
            <UsersIcon className="size-3 text-white/30" />
            {av.available_spots}/{av.capacity} spots left
          </span>
          <span>{av.sessions} sessions</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${av.is_full ? "bg-red-500" : "bg-indigo-500"}`}
            style={{ width: `${spotsPercent}%` }}
          />
        </div>
      </div>

      {/* Notes */}
      {av.notes && (
        <p className="text-[11px] text-white/40 italic border-t border-white/5 pt-2">
          {av.notes}
        </p>
      )}
    </div>
  )
}

// ── Detail skeleton ───────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-45 sm:h-55 w-full rounded-2xl bg-white/5" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3 bg-white/5" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-5/6 bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CourseDetailSheetProps {
  courseId: number | null
  open: boolean
  onClose: () => void
}

export function CourseDetailSheet({ courseId, open, onClose }: CourseDetailSheetProps) {
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track the latest enrollment from this session so we can reflect
  // status (enrolled → can complete/rate) without a full refetch.
  const [latestReg, setLatestReg] = useState<CourseRegistration | null>(null)

  const fetchCourse = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)
    setCourse(null)
    setLatestReg(null)
    try {
      const data = await getCourseById(id)
      setCourse(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load course details.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load course details.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && courseId != null) {
      void fetchCourse(courseId)
    } else if (!open) {
      setCourse(null)
      setError(null)
      setLatestReg(null)
    }
  }, [open, courseId, fetchCourse])

  const isEnrolled   = latestReg?.status === "enrolled"
  const isCompleted  = latestReg?.status === "completed"
  const hasRating    = latestReg?.rating != null

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col gap-0 p-0 border-l border-white/10 bg-background"
      >
        {/* Visually-hidden title for a11y when course not yet loaded */}
        {(!course || isLoading) && (
          <SheetHeader className="sr-only">
            <SheetTitle>Course Details</SheetTitle>
          </SheetHeader>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 thin-scrollbar">
          {/* Error */}
          {error && !isLoading && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={() => courseId != null && fetchCourse(courseId)}
                >
                  <Loader2Icon className="size-3.5" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {isLoading && <DetailSkeleton />}

          {/* Content */}
          {!isLoading && course && (
            <>
              {/* ── Image hero ─────────────────────────────────────────────── */}
              <div className="group relative w-full h-45 sm:h-55 rounded-2xl overflow-hidden border border-white/5 bg-[#0c0c14] shadow-[0_8px_32px_rgba(99,102,241,0.08)] shrink-0 transition-all duration-500">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)] z-10" />
                {course.image_path ? (
                  <img
                    src={course.image_path}
                    alt={course.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-indigo-500/10 to-purple-500/10">
                    <BookOpenIcon className="size-16 text-white/5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0f]/10 via-[#0a0a0f]/20 to-[#0d0d1a] z-10" />

                {/* Privacy badge — top right */}
                <div className="absolute top-4 right-4 z-20">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-md text-white/70 font-medium tracking-wide flex items-center shadow-xs"
                  >
                    {course.privacy === "private" ? (
                      <LockIcon className="size-3 mr-1.5 opacity-60" />
                    ) : (
                      <GlobeIcon className="size-3 mr-1.5 opacity-60" />
                    )}
                    {capitalize(course.privacy ?? "public")}
                  </Badge>
                </div>

                {/* Level + status — bottom left */}
                <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2">
                  {course.level && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium bg-[#0a0a0f]/80 backdrop-blur-md shadow-xs ${LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner}`}
                    >
                      <StarIcon className="size-2.5 mr-1" />
                      {capitalize(course.level)}
                    </Badge>
                  )}
                  {course.status && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-medium bg-[#0a0a0f]/80 backdrop-blur-md shadow-xs ${STATUS_STYLES[course.status] ?? STATUS_STYLES.draft}`}
                    >
                      {capitalize(course.status)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* ── Title ─────────────────────────────────────────────────── */}
              <SheetHeader className="space-y-1">
                <SheetTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight drop-shadow-md">
                  {course.name}
                </SheetTitle>
              </SheetHeader>

              {/* ── Tabs ──────────────────────────────────────────────────── */}
              <Tabs defaultValue="overview" className="space-y-5">
                <TabsList className="w-full grid grid-cols-4 gap-0.5 bg-white/5 border border-white/8 rounded-xl p-1 h-auto">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white/50 hover:text-white/80 transition-all"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="enroll"
                    className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white/50 hover:text-white/80 transition-all"
                  >
                    Enroll
                  </TabsTrigger>
                  <TabsTrigger
                    value="actions"
                    className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white/50 hover:text-white/80 transition-all"
                  >
                    Actions
                  </TabsTrigger>
                  <TabsTrigger
                    value="mine"
                    className="rounded-lg text-xs font-medium py-1.5 data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-white/50 hover:text-white/80 transition-all"
                  >
                    Mine
                  </TabsTrigger>
                </TabsList>

                {/* ── Overview tab ─────────────────────────────────────────── */}
                <TabsContent value="overview" className="space-y-5 mt-0">
                  {course.description && (
                    <p className="text-sm text-white/60 leading-relaxed">{course.description}</p>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                        <ClockIcon className="size-3.5" />
                        Duration
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatDuration(course.duration)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                        <CalendarIcon className="size-3.5" />
                        Availabilities
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {course.availabilities?.length ?? 0} batch{course.availabilities?.length !== 1 ? "es" : ""}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                        <SparklesIcon className="size-3.5" />
                        Level
                      </div>
                      <p className="text-sm font-semibold text-white capitalize">
                        {course.level ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/3 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                        <BookOpenIcon className="size-3.5" />
                        Total spots
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {course.availabilities?.reduce((acc, a) => acc + a.available_spots, 0) ?? 0} available
                      </p>
                    </div>
                  </div>

                  {/* Batches list */}
                  {course.availabilities?.length > 0 && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                          <CalendarIcon className="size-4 text-indigo-400" />
                          Scheduled Batches ({course.availabilities.length})
                        </h3>
                        <div className="space-y-3">
                          {course.availabilities.map((av) => (
                            <AvailabilityCard key={av.id} av={av} />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {course.availabilities?.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-white/3 p-6 text-center space-y-2">
                      <CalendarIcon className="size-8 text-white/20 mx-auto" />
                      <p className="text-sm text-white/40">No scheduled batches yet.</p>
                    </div>
                  )}

                  {/* Footer meta */}
                  <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30">
                    <span>Created {formatDate(course.created_at)}</span>
                    <span>Updated {formatDate(course.updated_at)}</span>
                  </div>
                </TabsContent>

                {/* ── Enroll tab ────────────────────────────────────────────── */}
                <TabsContent value="enroll" className="space-y-4 mt-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CalendarIcon className="size-4 text-indigo-400" />
                      Choose a Batch
                    </h3>
                    <p className="text-xs text-white/40">
                      Select an open session below and confirm your enrollment.
                    </p>
                  </div>
                  <EnrollSection
                    courseId={course.id}
                    availabilities={course.availabilities ?? []}
                    onEnrolled={(reg) => setLatestReg(reg)}
                  />
                </TabsContent>

                {/* ── Actions tab ───────────────────────────────────────────── */}
                <TabsContent value="actions" className="space-y-6 mt-0">
                  {/* Complete section */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <CheckCircle2Icon className="size-4 text-emerald-400" />
                        Mark as Completed
                      </h3>
                      <p className="text-xs text-white/40">
                        Confirm that you have finished this course.
                      </p>
                    </div>
                    <CompleteSection
                      courseId={course.id}
                      alreadyCompleted={isCompleted}
                      onCompleted={(reg) => setLatestReg(reg)}
                    />
                  </div>

                  <Separator className="bg-white/8" />

                  {/* Rating section */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <StarIcon className="size-4 text-amber-400" />
                        Rate this Course
                      </h3>
                      <p className="text-xs text-white/40">
                        {isCompleted || isEnrolled
                          ? "Share your experience and help others."
                          : "Available after you enroll in or complete this course."}
                      </p>
                    </div>
                    {(isCompleted || isEnrolled) ? (
                      <RatingSection
                        courseId={course.id}
                        existingRating={hasRating ? latestReg?.rating : undefined}
                        existingFeedback={hasRating ? latestReg?.feedback : undefined}
                        onRated={(reg) => setLatestReg(reg)}
                      />
                    ) : (
                      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col items-center gap-3 text-center">
                        <StarIcon className="size-8 text-white/15" />
                        <p className="text-xs text-white/35">
                          Enroll in this course first to leave a rating.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── Mine tab ──────────────────────────────────────────────── */}
                <TabsContent value="mine" className="space-y-4 mt-0">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BookOpenIcon className="size-4 text-indigo-400" />
                      My Enrollments
                    </h3>
                    <p className="text-xs text-white/40">
                      All courses you're currently enrolled in or have completed.
                    </p>
                  </div>
                  <MyEnrollmentsPanel />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
