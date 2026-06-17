// ─── User Online Courses — List ───────────────────────────────────────────────
// Route: /user/online-courses

import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
  RefreshCwIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { PageHeader } from "@/components/user/page-header"

import { getAssignedOnlineCourses } from "./service/user-online-courses.service"
import type { OnlineCourseCard as CardType, LearningStatus } from "./types/user-online-courses.types"
import { OnlineCourseCard } from "./components/online-course-card"

const FILTERS: { value: LearningStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-white/5 bg-[#0a0a0f]">
      <Skeleton className="h-40 w-full rounded-none bg-white/5" />
      <div className="space-y-2.5 p-5">
        <Skeleton className="h-5 w-4/5 bg-white/5" />
        <Skeleton className="h-3 w-full bg-white/5" />
        <Skeleton className="h-1.5 w-full rounded-full bg-white/5" />
      </div>
    </div>
  )
}

export function UserOnlineCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<CardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<LearningStatus | "all">("all")
  const [search, setSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAssignedOnlineCourses({ per_page: 50 })
      setCourses(res.data ?? [])
    } catch (err) {
      if (isApiError(err)) setError(err.message || "Failed to load your online courses.")
      else if (err instanceof Error) setError(err.message)
      else setError("Failed to load your online courses.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCourses()
  }, [fetchCourses])

  // Debounced client-side search across the loaded set.
  const [query, setQuery] = useState("")
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setQuery(search.trim().toLowerCase()), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  const filtered = courses.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false
    if (query && !c.title.toLowerCase().includes(query) && !(c.description ?? "").toLowerCase().includes(query)) return false
    return true
  })

  // Stats
  const total = courses.length
  const completed = courses.filter((c) => c.status === "completed").length
  const inProgress = courses.filter((c) => c.status === "in_progress").length

  const STATS = [
    { label: "Assigned", value: total, icon: BookOpenIcon, color: "text-white" },
    { label: "In progress", value: inProgress, icon: PlayCircleIcon, color: "text-indigo-300" },
    { label: "Completed", value: completed, icon: CheckCircle2Icon, color: "text-emerald-400" },
  ]

  return (
    <div className="flex flex-col gap-6 text-white">
      {/* Header */}
      <PageHeader
        title="My Online Courses"
        description="Self-paced video & document courses assigned to you."
        onRefresh={fetchCourses}
        refreshing={isLoading}
      />

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-white/8 bg-card/40 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] text-white/40"><Icon className="size-3.5" />{s.label}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="h-9 rounded-full border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-indigo-500/50"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load courses</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={fetchCourses} className="shrink-0 text-red-400 hover:bg-red-500/10 hover:text-red-300">
              <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 && !error ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20">
            <div className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <BookOpenIcon className="size-9 text-white/20" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-base font-semibold text-white/60">
                {search || statusFilter !== "all" ? "No matching courses" : "No online courses assigned"}
              </p>
              <p className="text-sm text-white/30">
                {search || statusFilter !== "all" ? "Try a different filter or search." : "Courses assigned to you will appear here."}
              </p>
            </div>
          </div>
        ) : (
          filtered.map((c) => (
            <OnlineCourseCard key={c.id} course={c} onClick={() => navigate(`/user/online-courses/${c.id}`)} />
          ))
        )}
      </div>
    </div>
  )
}
