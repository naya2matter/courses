// ─── User Online Courses Page ─────────────────────────────────────────────────
// Displays all assigned online courses for the authenticated user.

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  FilterIcon,
  LayersIcon,
  Loader2Icon,
  PlayCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  TrophyIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

import { getMyOnlineCourses } from "@/services/userOnlineCourse.service"
import type {
  PaginationMeta,
  UserOnlineCourse,
  UserOnlineCourseFilters,
} from "@/types/user-online-course"

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "not_started" | "in_progress" | "completed"

interface SummaryStats {
  total: number
  notStarted: number
  inProgress: number
  completed: number
  avgProgress: number
  completedContentItems: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcStats(courses: UserOnlineCourse[]): SummaryStats {
  const total = courses.length
  const notStarted = courses.filter((c) => c.status === "not_started").length
  const inProgress = courses.filter((c) => c.status === "in_progress").length
  const completed = courses.filter((c) => c.status === "completed").length
  const avgProgress =
    total > 0
      ? Math.round(
          courses.reduce((acc, c) => acc + c.progress_percentage, 0) / total,
        )
      : 0
  const completedContentItems = courses.reduce(
    (acc, c) => acc + c.completed_content_items,
    0,
  )
  return { total, notStarted, inProgress, completed, avgProgress, completedContentItems }
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ── Summary stat card ─────────────────────────────────────────────────────────

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  glow: string
  ring: string
}

function SummaryCard({ stat }: { stat: StatCard }) {
  return (
    <div
      className="group relative flex items-center gap-4 overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#090912] shadow-xl px-5 py-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]"
    >
      {/* Subtle gradient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, ${stat.ring.replace("0.25", "0.15")}, transparent 65%)`,
        }}
      />

      {/* Icon bubble */}
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 transition-transform duration-500 group-hover:scale-110"
        style={{ boxShadow: stat.glow, outline: `1px solid ${stat.ring}` }}
      >
        <stat.icon className={`size-6 drop-shadow-md ${stat.color}`} />
      </div>

      {/* Text */}
      <div className="relative min-w-0 flex flex-col justify-center">
        <p className={`text-3xl font-extrabold tabular-nums leading-none tracking-tight drop-shadow-sm ${stat.color}`}>
          {stat.value}
        </p>
        <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
          {stat.label}
        </p>
      </div>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  not_started: {
    label: "Not Started",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/25",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  },
} as const

function StatusBadge({ status }: { status: UserOnlineCourse["status"] }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────

function OnlineCourseCard({ course }: { course: UserOnlineCourse }) {
  const navigate = useNavigate()
  const isNew = course.status === "not_started"
  const isCompleted = course.status === "completed"
  const btnLabel = isNew ? "Start Course" : isCompleted ? "Review Course" : "Continue"
  const BtnIcon = isCompleted ? CheckCircle2Icon : isNew ? PlayCircleIcon : PlayCircleIcon

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 ring-1 ring-white/5 bg-[#090912] shadow-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_24px_64px_-12px_rgba(99,102,241,0.25)]">

      {/* Thumbnail / placeholder */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-linear-to-b from-[#101018] to-[#090912]">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-500/10 via-violet-500/5 to-transparent">
            <BookOpenIcon className="size-16 text-white/5 transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(99,102,241,0.1),transparent_60%)] pointer-events-none" />
          </div>
        )}
        {/* Scrim */}
        <div className="absolute inset-0 bg-linear-to-t from-[#090912] via-[#090912]/60 to-transparent" />

        {/* Status badge overlaid top-right */}
        <div className="absolute right-4 top-4">
          <StatusBadge status={course.status} />
        </div>

        {/* Progress % badge bottom-left */}
        {course.status !== "not_started" && (
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-full bg-black/40 border border-white/10 px-3 py-1 text-xs font-semibold tabular-nums text-white/90 backdrop-blur-md shadow-lg">
            {course.status === "completed" ? (
              <CheckCircle2Icon className="size-3.5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            ) : (
              <CircleDotIcon className="size-3.5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
            )}
            {(Number(course.progress_percentage) || 0).toFixed(0)}%
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 flex-col gap-4 px-6 pb-6 pt-3">
        <h3 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-white drop-shadow-sm group-hover:text-indigo-200 transition-colors">
          {course.title}
        </h3>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2 text-xs font-medium text-white/50">
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
            <LayersIcon className="size-3.5 text-white/40" />
            {course.total_modules} module{course.total_modules !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
            <BookOpenIcon className="size-3.5 text-white/40" />
            {course.completed_content_items}/{course.total_content_items} items
          </div>
        </div>

        {/* Description */}
        {course.description && (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-white/40 group-hover:text-white/60 transition-colors">
            {course.description}
          </p>
        )}

        <div className="mt-auto pt-2 space-y-2">
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(99,102,241,0.4)] ${course.status === 'completed' ? 'bg-linear-to-r from-emerald-500 to-emerald-400' : 'bg-linear-to-r from-indigo-500 to-violet-400'}`}
              style={{ width: `${course.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30 hidden">
          {course.assigned_at && (
            <span className="flex items-center gap-1">
              <CalendarIcon className="size-3" />
              Assigned {formatDate(course.assigned_at)}
            </span>
          )}
          {course.last_accessed_at && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              Last accessed {formatDate(course.last_accessed_at)}
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(`/user/online-courses/${course.id}`)}
            className="group/btn relative flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition-all overflow-hidden"
            style={{
              background:
                course.status === "completed"
                  ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.02))"
                  : "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))",
            }}
          >
            {/* Outline ring */}
            <div className={`absolute inset-0 rounded-xl ring-1 ring-inset ${course.status === 'completed' ? 'ring-emerald-500/30 group-hover/btn:ring-emerald-500/60' : 'ring-indigo-500/30 group-hover/btn:ring-indigo-500/60'} transition-all`} />
            <BtnIcon className={`size-4 transition-transform group-hover/btn:scale-110 ${course.status === "completed" ? "text-emerald-400" : "text-indigo-400"}`} />
            <span className={course.status === "completed" ? "text-emerald-100" : "text-indigo-100"}>{btnLabel}</span>
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[1.5rem] border border-white/5 ring-1 ring-white/5 bg-[#090912] shadow-xl">
      <Skeleton className="h-48 w-full rounded-none bg-white/5" />
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-start pt-2">
          <Skeleton className="h-5 w-3/5 bg-white/8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full bg-white/5" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 bg-white/5" />
          <Skeleton className="h-6 w-20 bg-white/5" />
        </div>
        <Skeleton className="mt-4 h-12 w-full rounded-xl bg-white/5" />
      </div>
    </div>
  )
}

// ── Summary card skeletons ────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/5 bg-[#090912] px-5 py-6">
      <Skeleton className="h-14 w-14 rounded-2xl bg-white/8" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-14 bg-white/8" />
        <Skeleton className="h-3 w-24 bg-white/5" />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-5 py-24">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
        <BookOpenIcon className="size-9 text-white/18" />
      </div>
      <div className="space-y-1.5 text-center">
        <p className="text-base font-semibold text-white/55">
          {isFiltered ? "No courses match your filters" : "No courses assigned yet"}
        </p>
        <p className="text-sm text-white/30">
          {isFiltered
            ? "Try adjusting the search or status filter."
            : "Contact your administrator to get assigned to a course."}
        </p>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta
  onPage: (p: number) => void
}) {
  if (meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page <= 1}
        onClick={() => onPage(meta.current_page - 1)}
        className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        Previous
      </Button>
      <span className="px-2 text-xs text-white/40">
        Page {meta.current_page} of {meta.last_page}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={meta.current_page >= meta.last_page}
        onClick={() => onPage(meta.current_page + 1)}
        className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-30"
      >
        Next
      </Button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function UserOnlineCoursesPage() {
  // ── data state ──
  const [courses, setCourses] = useState<UserOnlineCourse[]>([])
  const [allCourses, setAllCourses] = useState<UserOnlineCourse[]>([]) // unfiltered first page for stats
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [stats, setStats] = useState<SummaryStats | null>(null)

  // ── ui state ──
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── filters ──
  const [searchInput, setSearchInput] = useState("")
  const [committedSearch, setCommittedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [perPage, setPerPage] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isFiltered =
    committedSearch !== "" || statusFilter !== "all"

  const activeFilterCount =
    (committedSearch ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)

  // ── fetch helpers ─────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      // Fetch a big chunk without filters to derive accurate totals
      const res = await getMyOnlineCourses({ per_page: 200 })
      setAllCourses(res.data)
      setStats(calcStats(res.data))
    } catch {
      // stats failure is non-critical
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchCourses = useCallback(
    async (page: number, search: string, status: StatusFilter, pp: number) => {
      setIsLoading(true)
      setError(null)
      try {
        const filters: UserOnlineCourseFilters = {
          page,
          per_page: pp,
          ...(search && { search }),
          ...(status !== "all" && { status }),
        }
        const res = await getMyOnlineCourses(filters)
        setCourses(res.data)
        setMeta(res.meta)
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Failed to load courses."
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // ── initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchCourses(currentPage, committedSearch, statusFilter, perPage)
  }, [currentPage, committedSearch, statusFilter, perPage, fetchCourses])

  // ── search debounce ───────────────────────────────────────────────────────

  function handleSearchChange(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setCommittedSearch(value)
      setCurrentPage(1)
    }, 400)
  }

  // ── filter handlers ───────────────────────────────────────────────────────

  function handleStatusChange(val: string) {
    setStatusFilter(val as StatusFilter)
    setCurrentPage(1)
  }

  function handlePerPageChange(val: string) {
    setPerPage(Number(val))
    setCurrentPage(1)
  }

  function clearFilters() {
    setSearchInput("")
    setCommittedSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  function handleRefresh() {
    fetchStats()
    fetchCourses(currentPage, committedSearch, statusFilter, perPage)
  }

  // ── summary stat definitions ──────────────────────────────────────────────

  const statCards: StatCard[] = stats
    ? [
        {
          label: "Total Courses",
          value: stats.total,
          icon: BookOpenIcon,
          color: "text-indigo-400",
          glow: "0 8px 24px rgba(99,102,241,0.35)",
          ring: "rgba(99,102,241,0.25)",
        },
        {
          label: "Not Started",
          value: stats.notStarted,
          icon: CircleDotIcon,
          color: "text-slate-400",
          glow: "0 8px 24px rgba(148,163,184,0.25)",
          ring: "rgba(148,163,184,0.18)",
        },
        {
          label: "In Progress",
          value: stats.inProgress,
          icon: Loader2Icon,
          color: "text-violet-400",
          glow: "0 8px 24px rgba(139,92,246,0.35)",
          ring: "rgba(139,92,246,0.25)",
        },
        {
          label: "Completed",
          value: stats.completed,
          icon: TrophyIcon,
          color: "text-emerald-400",
          glow: "0 8px 24px rgba(16,185,129,0.3)",
          ring: "rgba(16,185,129,0.20)",
        },
        {
          label: "Avg. Progress",
          value: `${stats.avgProgress}%`,
          icon: CheckCircle2Icon,
          color: "text-amber-400",
          glow: "0 8px 24px rgba(251,191,36,0.3)",
          ring: "rgba(251,191,36,0.20)",
        },
        {
          label: "Content Completed",
          value: stats.completedContentItems,
          icon: LayersIcon,
          color: "text-fuchsia-400",
          glow: "0 8px 24px rgba(217,70,239,0.3)",
          ring: "rgba(217,70,239,0.20)",
        },
      ]
    : []

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8 text-white">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            My Online Courses
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Continue learning, track progress, and access assigned courses.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || statsLoading}
          className="mt-3 self-start border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white sm:mt-0"
        >
          <RefreshCwIcon
            className={`mr-1.5 size-3.5 ${isLoading || statsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statsLoading
          ? Array.from({ length: 6 }).map((_, i) => <SummaryCardSkeleton key={i} />)
          : statCards.map((s) => <SummaryCard key={s.label} stat={s} />)}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-48 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search courses…"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 border-white/10 bg-white/5 pl-9 text-sm text-white placeholder:text-white/30 focus-visible:ring-indigo-500/50"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 w-40 border-white/10 bg-white/5 text-sm text-white focus:ring-indigo-500/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Per page */}
          <Select value={String(perPage)} onValueChange={handlePerPageChange}>
            <SelectTrigger className="h-9 w-28 border-white/10 bg-white/5 text-sm text-white focus:ring-indigo-500/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value="6">6 / page</SelectItem>
              <SelectItem value="12">12 / page</SelectItem>
              <SelectItem value="24">24 / page</SelectItem>
              <SelectItem value="48">48 / page</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 border border-white/10 bg-white/4 text-white/55 hover:bg-white/8 hover:text-white"
            >
              <XIcon className="mr-1.5 size-3.5" />
              Clear
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/60 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            </Button>
          )}
        </div>

        {/* Result count + active filter indicator */}
        <div className="flex items-center gap-2 text-xs text-white/35">
          {!isLoading && meta && (
            <span>
              {meta.total} course{meta.total !== 1 ? "s" : ""}
              {isFiltered ? " matching filters" : ""}
            </span>
          )}
          {isFiltered && activeFilterCount > 0 && (
            <span className="flex items-center gap-1">
              <FilterIcon className="size-3" />
              {activeFilterCount} active filter{activeFilterCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Grid ── */}
      {!error && (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: perPage > 6 ? 6 : perPage }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))
              : courses.length === 0
                ? <EmptyState isFiltered={isFiltered} />
                : courses.map((c) => <OnlineCourseCard key={c.id} course={c} />)}
          </div>

          {/* Pagination */}
          {!isLoading && meta && (
            <Pagination meta={meta} onPage={(p) => setCurrentPage(p)} />
          )}
        </>
      )}

      {/* ── All-courses data used for stat baseline (hidden) ── */}
      {allCourses.length === 0 && null}
    </div>
  )
}
