// ─── Course Detail Page ───────────────────────────────────────────────────────
// Route: /user/courses/:id
// Full-page course details with enrollment, rating, and completion flow.
// Layout: single column on mobile, main + sticky sidebar on desktop (lg+).
//   • Not enrolled  → sidebar shows enroll form; left shows all batches
//   • Enrolled      → left shows "Your Session" card with rating + completion;
//                     sidebar shows course stats only
//   • Completed     → left shows completion state; sidebar shows course stats

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { getCourseById, getMyEnrollments } from "../service/courses.service"
import type { Course, CourseAvailability, CourseRegistration } from "../types/courses.types"
import { EnrollSection } from "../components/enroll-section"
import { RatingSection } from "../components/rating-section"
import { CompleteSection } from "../components/complete-section"
import { EnrollmentStatusBadge } from "../components/enrollment-status-badge"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
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

// ── Availability card ─────────────────────────────────────────────────────────

function AvailabilityCard({ av }: { av: CourseAvailability }) {
  const shifts = [
    av.session_time_shift_1,
    av.session_time_shift_2,
    av.session_time_shift_3,
  ].filter(Boolean)

  const spotsPercent =
    av.capacity > 0
      ? Math.round(((av.capacity - av.available_spots) / av.capacity) * 100)
      : 0

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={`text-[10px] px-2 py-0.5 border font-medium ${STATUS_STYLES[av.status] ?? STATUS_STYLES.draft}`}
          >
            {capitalize(av.status)}
          </Badge>
          {av.is_full && (
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 border bg-red-500/15 text-red-400 border-red-500/20"
            >
              Full
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-white/40">{av.duration_weeks}w</span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 text-xs text-white/60">
        <CalendarIcon className="size-3.5 shrink-0 text-white/30" />
        <span>
          {formatDate(av.start_date)} → {formatDate(av.end_date)}
        </span>
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

      {/* Time shifts */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shifts.map((s, i) => (
            <div key={i} className="flex items-center gap-1 text-[11px] text-white/60">
              <ClockIcon className="size-3 text-white/30" />
              <span>{formatTime(s)}</span>
            </div>
          ))}
          <span className="text-[10px] text-white/40 self-center">
            {av.session_duration_minutes}min each
          </span>
        </div>
      )}

      {/* Capacity */}
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

// ── Page skeleton ─────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-40 sm:h-52 w-full rounded-2xl bg-white/5" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4 order-2 lg:order-1">
          <Skeleton className="h-9 w-2/3 bg-white/5" />
          <Skeleton className="h-4 w-1/3 bg-white/5" />
          <Skeleton className="h-4 w-full bg-white/5" />
          <Skeleton className="h-4 w-5/6 bg-white/5" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
        <div className="space-y-3 order-1 lg:order-2">
          <Skeleton className="h-48 rounded-2xl bg-white/5" />
          <Skeleton className="h-32 rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}

// ── Course stats card (sidebar) ───────────────────────────────────────────────

function CourseStatsCard({ course }: { course: Course }) {
  const activeAvs = course.availabilities?.filter((a) => a.status === "active") ?? []
  const totalSpots = activeAvs.reduce((acc, a) => acc + a.available_spots, 0)

  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-3">
      <h3 className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
        Course Info
      </h3>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <ClockIcon className="size-3.5" />
            Duration
          </div>
          <p className="text-sm font-semibold text-white">
            {course.duration != null ? `${course.duration}h` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <SparklesIcon className="size-3.5" />
            Level
          </div>
          <p className="text-sm font-semibold text-white capitalize">
            {course.level ?? "—"}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <CalendarIcon className="size-3.5" />
            Batches
          </div>
          <p className="text-sm font-semibold text-white">{activeAvs.length} active</p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-white/40">
            <UsersIcon className="size-3.5" />
            Spots
          </div>
          <p className="text-sm font-semibold text-white">{totalSpots} left</p>
        </div>
      </div>
    </div>
  )
}

// ── Enroll sidebar card (only shown when not enrolled) ────────────────────────

function CourseEnrollCard({
  course,
  onEnrolled,
}: {
  course: Course
  onEnrolled: (reg: CourseRegistration) => void
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-white">Enroll in this Course</h3>
        <p className="text-xs text-white/40">
          Select an available batch to get started.
        </p>
      </div>
      <EnrollSection
        courseId={course.id}
        availabilities={course.availabilities ?? []}
        onEnrolled={onEnrolled}
      />
    </div>
  )
}

// ── Enrolled session card (replaces batch list after enrollment) ──────────────
// Shows the enrolled session details + rating + completion in one focused view.

interface EnrolledSessionCardProps {
  course: Course
  latestReg: CourseRegistration
  availability: CourseAvailability | null
  onRated: (reg: CourseRegistration) => void
  onCompleted: (reg: CourseRegistration) => void
}

function EnrolledSessionCard({
  course,
  latestReg,
  availability,
  onRated,
  onCompleted,
}: EnrolledSessionCardProps) {
  const isCompleted = latestReg.status === "completed"
  const hasRating   = latestReg.rating != null

  return (
    <section aria-labelledby="enrolled-session-heading" className="space-y-4">
      {/* Heading row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2
          id="enrolled-session-heading"
          className="text-sm font-semibold text-white/70 flex items-center gap-2"
        >
          <BookOpenIcon className="size-3.5 text-indigo-400 shrink-0" />
          Your Session
        </h2>
        <EnrollmentStatusBadge status={latestReg.status} rating={latestReg.rating} />
      </div>

      {/* Session details — reuses AvailabilityCard with updated optimistic data */}
      {availability ? (
        <AvailabilityCard av={availability} />
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/2 p-4 text-xs text-white/40">
          Session #{latestReg.course_availability_id}
        </div>
      )}

      {/* Enrollment / completion dates */}
      {(latestReg.enrolled_at ?? latestReg.completed_at) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/30">
          {latestReg.enrolled_at && (
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="size-3 text-white/20" />
              Enrolled {formatDate(latestReg.enrolled_at)}
            </span>
          )}
          {latestReg.completed_at && (
            <span className="flex items-center gap-1.5 text-emerald-400/60">
              <TrophyIcon className="size-3" />
              Completed {formatDate(latestReg.completed_at)}
            </span>
          )}
        </div>
      )}

      {/* ── Completed state ─────────────────────────────────────────────── */}
      {isCompleted ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
              <TrophyIcon className="size-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-300">Course Completed</p>
              {latestReg.completed_at && (
                <p className="text-xs text-emerald-400/60">
                  {formatDate(latestReg.completed_at)}
                </p>
              )}
            </div>
          </div>
          {hasRating && (
            <div className="flex items-center gap-2 pt-1 border-t border-emerald-500/10">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon
                    key={s}
                    className={`size-4 ${s <= latestReg.rating! ? "text-amber-400" : "text-white/15"}`}
                    fill={s <= latestReg.rating! ? "currentColor" : "none"}
                  />
                ))}
              </div>
              {latestReg.feedback && (
                <span className="text-xs text-white/35 italic truncate max-w-xs">
                  "{latestReg.feedback}"
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        // ── Active: rating + completion actions ────────────────────────────
        <>
          <Separator className="bg-white/8" />

          {/* Rate this Course */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <StarIcon className="size-3.5 text-amber-400 shrink-0" />
              Rate this Course
            </h3>
            <RatingSection
              courseId={course.id}
              existingRating={latestReg.rating}
              existingFeedback={latestReg.feedback}
              onRated={onRated}
            />
          </div>

          <Separator className="bg-white/8" />

          {/* Mark as Complete */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <CheckCircle2Icon className="size-3.5 text-emerald-400 shrink-0" />
              Mark as Complete
            </h3>
            {!hasRating ? (
              <div className="space-y-3">
                <div
                  className="flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5 px-3.5 py-3"
                  role="note"
                >
                  <LockIcon className="size-3.5 text-amber-400/70 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-amber-300/70 leading-relaxed">
                    Please rate this session before marking it as complete.
                  </p>
                </div>
                <Button
                  disabled
                  variant="outline"
                  className="w-full h-9 rounded-xl border-white/8 bg-white/3 text-white/25 font-medium"
                  aria-disabled="true"
                >
                  <CheckCircle2Icon className="size-4 mr-1.5 opacity-40" />
                  Mark as Complete
                </Button>
              </div>
            ) : (
              <CompleteSection courseId={course.id} onCompleted={onCompleted} />
            )}
          </div>
        </>
      )}
    </section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CourseDetailPage() {
  const navigate  = useNavigate()
  const { id }    = useParams<{ id: string }>()
  const courseId  = Number(id)
  const isValidId = Number.isInteger(courseId) && courseId > 0

  const [course,    setCourse]    = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [latestReg, setLatestReg] = useState<CourseRegistration | null>(null)

  const load = useCallback(async () => {
    if (!isValidId) {
      setError("Invalid course ID.")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    setCourse(null)
    setLatestReg(null)
    try {
      const [courseData, enrollments] = await Promise.all([
        getCourseById(courseId),
        getMyEnrollments().catch(() => [] as CourseRegistration[]),
      ])
      setCourse(courseData)
      // Find the most recent enrollment for this specific course
      const myReg =
        enrollments
          .filter((r) => r.course_id === courseId)
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0] ?? null
      setLatestReg(myReg)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load course.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load course.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [courseId, isValidId])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Called immediately after a successful enrollment.
   * 1. Sets latestReg so the UI switches to the enrolled view.
   * 2. Optimistically decrements available_spots for the enrolled availability
   *    so the seat count updates without a server roundtrip.
   */
  function handleEnrolled(reg: CourseRegistration) {
    setLatestReg(reg)
    setCourse((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        availabilities: prev.availabilities.map((av) =>
          av.id === reg.course_availability_id
            ? {
                ...av,
                available_spots: Math.max(0, av.available_spots - 1),
                is_full: av.available_spots - 1 <= 0,
              }
            : av,
        ),
      }
    })
  }

  // Derive the availability the user enrolled in (uses updated optimistic data)
  const enrolledAvailability =
    latestReg && course
      ? (course.availabilities.find((av) => av.id === latestReg.course_availability_id) ?? null)
      : null

  const isEnrolledOrCompleted = latestReg != null

  return (
    <div className="flex flex-col gap-6 text-white pb-10">
      {/* ── Back navigation ──────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/user/courses")}
        className="self-start text-white/50 hover:text-white hover:bg-white/8 rounded-xl -ml-2 gap-1.5"
      >
        <ArrowLeftIcon className="size-4" />
        All Courses
      </Button>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && !isLoading && (
        <Alert className="bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load course</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => void load()}
            >
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {isLoading && <PageSkeleton />}

      {/* ── Page content ─────────────────────────────────────────────────── */}
      {!isLoading && course && (
        <div className="space-y-6">
          {/* ── Hero image ─────────────────────────────────────────────────── */}
          <div className="group relative w-full h-40 sm:h-52 rounded-2xl overflow-hidden border border-white/8 bg-[#0c0c14]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)] z-10" />

            {course.image_path ? (
              <img
                src={course.image_path}
                alt={course.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-linear-to-br from-indigo-500/10 to-purple-500/10">
                <BookOpenIcon className="size-20 text-white/5" />
              </div>
            )}

            <div className="absolute inset-0 bg-linear-to-b from-[#0a0a0f]/5 via-[#0a0a0f]/25 to-[#080713]/75 z-10" />

            {/* Privacy badge — top right */}
            <div className="absolute top-4 right-4 z-20">
              <Badge
                variant="outline"
                className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/10 bg-[#0a0a0f]/60 backdrop-blur-md text-white/70 font-medium tracking-wide flex items-center"
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
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium bg-[#0a0a0f]/80 backdrop-blur-md ${LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner}`}
                >
                  <StarIcon className="size-2.5 mr-1" />
                  {capitalize(course.level)}
                </Badge>
              )}
              {course.status && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium bg-[#0a0a0f]/80 backdrop-blur-md ${STATUS_STYLES[course.status] ?? STATUS_STYLES.draft}`}
                >
                  {capitalize(course.status)}
                </Badge>
              )}
            </div>
          </div>

          {/* ── Two-column body ─────────────────────────────────────────────── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">

            {/* ── Main content ─────────────────────────────────────────────── */}
            {/*
                Mobile order:
                  • Not enrolled  → sidebar (enroll form) first, then main
                  • Enrolled      → main (your session) first, then sidebar (stats)
                Desktop: always left = main, right = sidebar
            */}
            <div
              className={`space-y-6 min-w-0 ${
                isEnrolledOrCompleted ? "order-1 lg:order-1" : "order-2 lg:order-1"
              }`}
            >
              {/* Title + meta */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  {course.name}
                </h1>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/40">
                  {course.duration != null && (
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="size-3.5 text-white/25" />
                      {course.duration}h total
                    </span>
                  )}
                  {(course.availabilities?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="size-3.5 text-white/25" />
                      {course.availabilities.length} batch
                      {course.availabilities.length !== 1 ? "es" : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <UsersIcon className="size-3.5 text-white/25" />
                    {course.availabilities?.reduce((acc, a) => acc + a.available_spots, 0) ?? 0}{" "}
                    spots available
                  </span>
                </div>
              </div>

              {/* About */}
              {course.description && (
                <section
                  aria-labelledby="about-heading"
                  className="rounded-2xl border border-white/8 bg-white/2 p-5 space-y-2"
                >
                  <h2
                    id="about-heading"
                    className="text-sm font-semibold text-white/70 flex items-center gap-2"
                  >
                    <BookOpenIcon className="size-3.5 text-indigo-400 shrink-0" />
                    About this Course
                  </h2>
                  <p className="text-sm text-white/55 leading-relaxed">
                    {course.description}
                  </p>
                </section>
              )}

              {/* ── Enrolled: show "Your Session" card with rating + completion ── */}
              {/* ── Not enrolled: show all scheduled batches ──────────────────── */}
              {isEnrolledOrCompleted ? (
                <EnrolledSessionCard
                  course={course}
                  latestReg={latestReg!}
                  availability={enrolledAvailability}
                  onRated={setLatestReg}
                  onCompleted={setLatestReg}
                />
              ) : (
                <section aria-labelledby="batches-heading" className="space-y-3">
                  <h2
                    id="batches-heading"
                    className="text-sm font-semibold text-white/70 flex items-center gap-2"
                  >
                    <CalendarIcon className="size-3.5 text-indigo-400 shrink-0" />
                    Scheduled Batches
                    <span className="text-xs font-normal text-white/30">
                      ({course.availabilities?.length ?? 0})
                    </span>
                  </h2>

                  {(course.availabilities?.length ?? 0) > 0 ? (
                    <div className="space-y-3">
                      {course.availabilities.map((av) => (
                        <AvailabilityCard key={av.id} av={av} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-white/8 bg-white/2 p-8 flex flex-col items-center gap-3 text-center">
                      <CalendarIcon className="size-8 text-white/15" />
                      <p className="text-sm text-white/35">No batches scheduled yet.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Footer meta */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/25 pt-2 border-t border-white/5">
                <span>Created {formatDate(course.created_at)}</span>
                <span>Updated {formatDate(course.updated_at)}</span>
              </div>
            </div>

            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <div
              className={`space-y-4 ${
                isEnrolledOrCompleted ? "order-2 lg:order-2" : "order-1 lg:order-2"
              } lg:sticky lg:top-6`}
            >
              {/* Enroll card — only when not yet enrolled/completed */}
              {!isEnrolledOrCompleted && (
                <CourseEnrollCard course={course} onEnrolled={handleEnrolled} />
              )}

              {/* Course stats — always visible */}
              <CourseStatsCard course={course} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

