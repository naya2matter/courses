// ─── User Courses Page ────────────────────────────────────────────────────────
// Displays all accessible courses for the authenticated user with a detail sheet.

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  GlobeIcon,
  LockIcon,
  RefreshCwIcon,
  SearchIcon,
  StarIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"
import { stripHtml } from "@/lib/utils"

import { PageHeader } from "@/components/user/page-header"

import { getAllCourses, getMyEnrollments } from "./service/courses.service"
import type { Course, CoursePaginationMeta, CourseRegistration } from "./types/courses.types"
import { EnrollmentStatusBadge } from "./components/enrollment-status-badge"

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course, onClick, registration }: { course: Course; onClick: () => void; registration?: CourseRegistration | null }) {
  const activeAvs = course.availabilities?.filter((a) => a.status === "active") ?? []
  const totalSpots = activeAvs.reduce((acc, a) => acc + a.available_spots, 0)
  const totalCapacity = activeAvs.reduce((acc, a) => acc + a.capacity, 0)
  const totalFilled = totalCapacity - totalSpots
  const fillPercent = totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 100) : 0
  const hasSpotsAvailable = totalSpots > 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[320px] w-full overflow-hidden rounded-2xl border border-white/8 text-left transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {/* Full-bleed background image + dark fade */}
      <div className="absolute inset-0 z-0 bg-[#0c0c14]">
        {course.image_path ? (
          <img
            src={course.image_path}
            alt={course.name}
            className="h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-500/10 to-purple-500/10">
            <BookOpenIcon className="size-16 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0f] via-[#0a0a0f]/85 to-[#0a0a0f]/25" />
      </div>

      {/* Content — header pinned top, batch + footer pinned bottom */}
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        {/* Top group */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {course.level && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${LEVEL_STYLES[course.level] ?? LEVEL_STYLES.beginner}`}
                >
                  <StarIcon className="size-2.5 mr-1" />
                  {capitalize(course.level)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[course.status] ?? STATUS_STYLES.draft}`}
              >
                {capitalize(course.status)}
              </Badge>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 flex items-center rounded-full border border-white/10 bg-[#0a0a0f]/60 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-white/70 backdrop-blur-md"
            >
              {course.privacy === "private" ? (
                <LockIcon className="size-3 mr-1.5 opacity-60" />
              ) : (
                <GlobeIcon className="size-3 mr-1.5 opacity-60" />
              )}
              {capitalize(course.privacy)}
            </Badge>
          </div>

          <h3 className="mt-3 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-white">
            {course.name}
          </h3>

          {course.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/45">
              {stripHtml(course.description)}
            </p>
          )}

          {registration && (
            <div className="mt-2.5">
              <EnrollmentStatusBadge status={registration.status} rating={registration.rating} />
            </div>
          )}
        </div>

        {/* Bottom group */}
        <div>
          {totalCapacity > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end justify-between text-[11px] font-medium text-white/55">
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5 text-white/35" />
                  Upcoming Dates
                </span>
                <span className="font-semibold text-white/75">{fillPercent}% filled</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-linear-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p className="text-[10px] font-medium text-white/35">
                {totalFilled} of {totalCapacity} seats · {activeAvs.length} session{activeAvs.length !== 1 ? "s" : ""}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 py-3">
              <span className="text-[11px] font-medium text-white/30">No active seating available</span>
            </div>
          )}

          {/* Footer info */}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/8 pt-3 text-xs font-medium text-white/45">
            <div className="flex items-center gap-4">
              {course.duration != null && (
                <span className="flex items-center gap-1.5">
                  <ClockIcon className="size-3.5 text-white/30" />
                  {course.duration}m
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-white/30" />
                {activeAvs.length} date{activeAvs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <span className={`font-semibold ${hasSpotsAvailable ? "text-emerald-400" : "text-amber-400"}`}>
              {hasSpotsAvailable ? `${totalSpots} spots` : "Full"}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex h-[320px] flex-col justify-between overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="space-y-2.5">
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
        <BookOpenIcon className="size-9 text-white/20" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-white/60">
          {search ? "No courses found" : "No courses available"}
        </p>
        <p className="text-sm text-white/30">
          {search
            ? `No courses match "${search}"`
            : "You don't have any accessible courses yet."}
        </p>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({ meta, onPageChange }: { meta: CoursePaginationMeta; onPageChange: (p: number) => void }) {
  if (meta.last_page <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page <= 1}
        onClick={() => onPageChange(meta.current_page - 1)}
        className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        Previous
      </Button>
      <span className="text-xs text-white/40 px-2">
        Page {meta.current_page} of {meta.last_page}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPageChange(meta.current_page + 1)}
        className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        Next
      </Button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function UserCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [meta, setMeta] = useState<CoursePaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [myRegs, setMyRegs] = useState<Record<number, CourseRegistration | null>>({})

  const fetchCourses = useCallback(async (page: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const [result, enrollments] = await Promise.all([
        getAllCourses(page, 12),
        getMyEnrollments().catch(() => [] as CourseRegistration[]),
      ])
      setCourses(result.data)
      setMeta(result.meta)

      const regsMap: Record<number, CourseRegistration> = {}
      enrollments.forEach((r) => {
        const existing = regsMap[r.course_id]
        if (!existing || new Date(r.created_at).getTime() > new Date(existing.created_at).getTime()) {
          regsMap[r.course_id] = r
        }
      })
      setMyRegs(regsMap)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load courses.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load courses.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCourses(1)
  }, [fetchCourses])

  // Client-side search filter (debounced)
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!searchInput.trim()) {
        setFilteredCourses(courses)
      } else {
        const q = searchInput.toLowerCase()
        setFilteredCourses(
          courses.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.description ?? "").toLowerCase().includes(q) ||
              (c.level ?? "").toLowerCase().includes(q),
          ),
        )
      }
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, courses])

  function handlePageChange(page: number) {
    setCurrentPage(page)
    void fetchCourses(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function openDetail(id: number) {
    navigate(`/user/courses/${id}`)
  }

  // Stats derived (reserved for future stats strip)
  // const totalCourses = meta?.total ?? courses.length
  // const activeBatches = courses.reduce(
  //   (acc, c) => acc + (c.availabilities?.filter((a) => a.status === "active").length ?? 0),
  //   0,
  // )

  return (
    <div className="flex flex-col gap-6 text-white">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Courses"
        description="Browse all courses accessible to you."
        onRefresh={() => fetchCourses(currentPage)}
        refreshing={isLoading}
      />

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      {/* {!isLoading && !error && courses.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 space-y-0.5">
            <p className="text-[11px] text-white/40 flex items-center gap-1.5">
              <BookOpenIcon className="size-3.5" /> Total Courses
            </p>
            <p className="text-xl font-bold text-white">{totalCourses}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 space-y-0.5">
            <p className="text-[11px] text-white/40 flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" /> Active Dates
            </p>
            <p className="text-xl font-bold text-white">{activeBatches}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 space-y-0.5 col-span-2 sm:col-span-1">
            <p className="text-[11px] text-white/40 flex items-center gap-1.5">
              <SparklesIcon className="size-3.5" /> Showing
            </p>
            <p className="text-xl font-bold text-white">{filteredCourses.length}</p>
          </div>
        </div>
      )} */}

      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search courses..."
          className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 h-10 rounded-full focus-visible:ring-1 focus-visible:ring-indigo-500/50"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          variant="destructive"
          className="bg-red-500/10 border-red-500/20 text-red-400"
        >
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => fetchCourses(currentPage)}
            >
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          : filteredCourses.length === 0 && !error
          ? <EmptyState search={searchInput} />
          : filteredCourses.map((c) => (
              <CourseCard key={c.id} course={c} registration={myRegs[c.id]} onClick={() => openDetail(c.id)} />
            ))}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────────── */}
      {!isLoading && meta && !searchInput && (
        <Pagination meta={meta} onPageChange={handlePageChange} />
      )}
    </div>
  )
}
