import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import {
  ActivityIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  LayersIcon,
  LogInIcon,
  LogOutIcon,
  PlayCircleIcon,
  StarIcon,
  TimerIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { PageHeader } from "@/components/user/page-header"
import { getActiveSession, getClockingHistory } from "./service/clocking.service"
import { ClockInDialog } from "./components/clock-in-dialog"
import { ClockOutDialog } from "./components/clock-out-dialog"
import type { ClockingHistoryResult, ClockingRecord } from "./types/clocking.types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try { return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" }) } catch { return iso }
}

function formatDateGroupLabel(iso: string | null | undefined): string {
  if (!iso) return "Unknown Date"
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Period filter ─────────────────────────────────────────────────────────────

const PERIODS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
] as const
type Period = typeof PERIODS[number]["value"]

function filterByPeriod(records: ClockingRecord[], period: Period): ClockingRecord[] {
  if (period === "all") return records
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  return records.filter((r) => {
    if (!r.clock_in) return false
    const d = new Date(r.clock_in)
    switch (period) {
      case "today": return d >= today
      case "week":  return d >= weekStart
      case "month": return d >= monthStart
      default:      return true
    }
  })
}

// ─── Live timer hook ───────────────────────────────────────────────────────────

function useLiveTimer(clockIn: string | null) {
  const [display, setDisplay] = useState("00:00:00")
  const [progressPct, setProgressPct] = useState(0)
  useEffect(() => {
    if (!clockIn) return
    function update() {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(clockIn!).getTime()) / 1000))
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setDisplay(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      )
      setProgressPct(Math.min(100, ((diff % 3600) / 3600) * 100))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [clockIn])
  return { display, progressPct }
}

// ─── Header ───────────────────────────────────────────────────────────────────

function AttendanceHeader({ onRefresh }: { onRefresh: () => void }) {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return (
    <PageHeader
      title="Attendance"
      description="Track your learning sessions and monitor your productivity over time."
      onRefresh={onRefresh}
      actions={
        <div className="hidden items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/60 sm:flex">
          <CalendarIcon className="h-4 w-4 text-white/40" />
          <span>{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
          <span className="mx-1 text-white/20">|</span>
          <span className="tabular-nums">{now.toLocaleTimeString(undefined, { timeStyle: "short" })}</span>
        </div>
      }
    />
  )
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

function StatsCards({ history, isLoading }: { history: ClockingHistoryResult; isLoading: boolean }) {
  const total = history.meta.total
  const totalMinutes = history.data.reduce((s, r) => s + (r.duration ?? 0), 0)
  const ratedRecords = history.data.filter((r) => r.rating != null && r.rating > 0)
  const avgRating = ratedRecords.length
    ? (ratedRecords.reduce((s, r) => s + r.rating!, 0) / ratedRecords.length).toFixed(1)
    : null

  const CARDS = [
    { label: "Total Sessions", value: String(total), Icon: LayersIcon },
    { label: "Time Logged", value: formatDuration(totalMinutes), Icon: TimerIcon },
    { label: "Avg Rating", value: avgRating ? `${avgRating}/5` : "—", Icon: StarIcon },
  ]

  if (isLoading && total === 0) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    )
  }

  return (
    <section className="grid grid-cols-3 gap-6 items-center">
      {CARDS.map(({ label, value, Icon }) => (
        <div key={label} className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/6 bg-white/5">
            <Icon className="h-6 w-6 text-indigo-400" />
          </div>
          {isLoading ? (
            <Skeleton className="mt-3 h-8 w-20" />
          ) : (
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">{value}</p>
          )}
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        </div>
      ))}
    </section>
  )
}

// ─── Active Session Card ───────────────────────────────────────────────────────

function ActiveSessionCard({
  session,
  onClockOut,
}: {
  session: ClockingRecord
  onClockOut: () => void
}) {
  const { display, progressPct } = useLiveTimer(session.clock_in ?? null)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/50 via-[#0a0a14] to-[#0a0a14] p-6">
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-emerald-400 to-emerald-600" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/8 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live Session</span>
          </div>

          <h2 className="font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground sm:text-6xl">
            {display}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-white/10 bg-white/5 py-1 text-white/60">
              <PlayCircleIcon className="h-3.5 w-3.5" />
              {formatTime(session.clock_in)}
            </Badge>
            {session.course && (
              <Badge variant="outline" className="gap-1.5 border-emerald-500/25 bg-emerald-500/12 py-1 text-emerald-400">
                <BookOpenIcon className="h-3.5 w-3.5" />
                {session.course.name}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <div className="hidden flex-col items-end gap-2 md:flex">
            <span className="text-xs text-white/30">Hour Progress</span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-white/30">{Math.round(progressPct)}%</span>
          </div>
          <Button
            size="lg"
            onClick={onClockOut}
            className="w-full bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-600/50 hover:bg-emerald-700 sm:w-auto"
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            Clock Out
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── No Session State ──────────────────────────────────────────────────────────

function NoSessionState({ onClockIn }: { onClockIn: () => void }) {
  return (
    <div className="relative flex min-h-52 flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-white/8 bg-white/2 p-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10">
        <ActivityIcon className="h-7 w-7 text-indigo-400" />
      </div>
      <div className="relative space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">Ready to focus?</h3>
        <p className="max-w-xs text-sm text-white/40">
          Start a new learning session to track your time and progress.
        </p>
      </div>
      <Button
        size="lg"
        onClick={onClockIn}
        className="relative bg-indigo-600 text-white shadow-lg ring-1 ring-indigo-600/50 hover:bg-indigo-700"
      >
        <LogInIcon className="mr-2 h-4 w-4" />
        Start Session
      </Button>
    </div>
  )
}

// ─── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({ record }: { record: ClockingRecord }) {
  const isActive = !record.clock_out

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        isActive
          ? "border-emerald-500/25 bg-emerald-950/15"
          : "border-white/8 bg-white/3 hover:border-white/12 hover:bg-white/[0.04]"
      }`}
    >
      {/* Top: course + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {record.course ? (
            <p className="truncate text-base font-semibold text-foreground">{record.course.name}</p>
          ) : (
            <p className="text-sm font-medium text-white/40">General Session</p>
          )}
          <p className="mt-0.5 text-xs text-white/30">
            {formatTime(record.clock_in)}
            {record.clock_out ? ` → ${formatTime(record.clock_out)}` : " → Now"}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            isActive
              ? "border-emerald-500/30 bg-emerald-500/12 text-[10px] uppercase text-emerald-400"
              : "border-white/10 bg-white/5 text-[10px] uppercase text-white/35"
          }
        >
          {isActive ? "Live" : "Completed"}
        </Badge>
      </div>

      {/* Duration + rating */}
      <div className="mt-4 flex items-end justify-between">
        <p className="font-mono text-3xl font-bold tabular-nums text-foreground">
          {isActive ? "—" : formatDuration(record.duration)}
        </p>
        {record.rating != null && record.rating > 0 && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon
                key={s}
                className={`h-4 w-4 ${s <= record.rating! ? "fill-amber-400 text-amber-400" : "text-white/12"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment */}
      {record.comment && (
        <div className="mt-4 border-t border-white/6 pt-4">
          <p className="line-clamp-2 text-sm italic text-white/35">"{record.comment}"</p>
        </div>
      )}
    </div>
  )
}

// ─── History Section ───────────────────────────────────────────────────────────

interface HistorySectionProps {
  history: ClockingHistoryResult
  isLoading: boolean
  page: number
  onPageChange: (p: number) => void
}

function HistorySection({ history, isLoading, page, onPageChange }: HistorySectionProps) {
  const [period, setPeriod] = useState<Period>("all")
  const { data, meta } = history

  const filtered = useMemo(() => filterByPeriod(data, period), [data, period])

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ClockingRecord[]> = {}
    filtered.forEach((record) => {
      const key = formatDateGroupLabel(record.clock_in)
      if (!groups[key]) groups[key] = []
      groups[key].push(record)
    })
    return groups
  }, [filtered])

  const counts = useMemo(
    () => ({
      all:   data.length,
      today: filterByPeriod(data, "today").length,
      week:  filterByPeriod(data, "week").length,
      month: filterByPeriod(data, "month").length,
    }),
    [data],
  )

  return (
    <section className="space-y-5">
      {/* Section header + filter chips */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Session History</h2>
          <p className="mt-0.5 text-sm text-white/35">
            {meta.total} session{meta.total !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Period filter chips */}
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => {
            const count = counts[p.value]
            const isActiveFilter = period === p.value
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActiveFilter
                    ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                    : "border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:bg-white/8 hover:text-white/70"
                }`}
              >
                {p.label}
                {count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ${
                      isActiveFilter
                        ? "bg-indigo-400/25 text-indigo-300"
                        : "bg-white/10 text-white/35"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-px bg-white/6" />

      {/* Loading skeletons */}
      {isLoading && data.length === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/10 bg-white/2 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <ClockIcon className="h-6 w-6 text-white/20" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-white/40">
              {period !== "all" ? "No sessions in this period" : "No sessions yet"}
            </p>
            <p className="text-sm text-white/25">
              {period !== "all"
                ? "Try a different time range."
                : "Clock in to start building your history."}
            </p>
          </div>
          {period !== "all" && (
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className="text-xs text-indigo-400 underline-offset-2 hover:underline"
            >
              Show all sessions
            </button>
          )}
        </div>
      )}

      {/* Date groups */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([dateLabel, records]) => (
            <div key={dateLabel}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/55">{dateLabel}</h3>
                <span className="text-xs text-white/30">
                  {records.length} session{records.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {records.map((record) => (
                  <SessionCard key={record.id} record={record} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-5">
          <span className="text-sm text-white/35">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeftIcon className="mr-1 h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.last_page || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              Next <ChevronRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PER_PAGE = 15

export function UserClockingPage() {
  const [activeSession, setActiveSession] = useState<ClockingRecord | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [history, setHistory] = useState<ClockingHistoryResult>({
    data: [],
    meta: {
      current_page: 1,
      from: null,
      last_page: 1,
      per_page: PER_PAGE,
      to: null,
      total: 0,
      path: "",
    },
    links: { first: null, last: null, prev: null, next: null },
  })
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [isClockInOpen, setIsClockInOpen] = useState(false)
  const [isClockOutOpen, setIsClockOutOpen] = useState(false)

  const historyAbortRef = useRef<AbortController | null>(null)

  const fetchActiveSession = useCallback(async () => {
    setIsSessionLoading(true)
    setSessionError(null)
    try {
      const session = await getActiveSession()
      setActiveSession(session)
    } catch (err) {
      if (!isCanceledError(err)) setSessionError("Unable to check for an active session.")
    } finally {
      setIsSessionLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async (targetPage: number) => {
    historyAbortRef.current?.abort()
    const controller = new AbortController()
    historyAbortRef.current = controller
    setIsHistoryLoading(true)
    setHistoryError(null)
    try {
      const result = await getClockingHistory(targetPage, PER_PAGE)
      setHistory(result)
    } catch (err) {
      if (!isCanceledError(err)) setHistoryError("Unable to load session history. Please try again.")
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  useEffect(() => { fetchActiveSession() }, [fetchActiveSession])
  useEffect(() => {
    fetchHistory(page)
    return () => historyAbortRef.current?.abort()
  }, [fetchHistory, page])

  function handleClockIn(record: ClockingRecord) {
    setActiveSession(record)
    if (page === 1) fetchHistory(1)
    else setPage(1)
  }

  function handleClockOut() {
    setActiveSession(null)
    if (page === 1) fetchHistory(1)
    else setPage(1)
  }

  return (
    <div className="flex flex-col gap-8 text-white">
      <AttendanceHeader onRefresh={() => { fetchActiveSession(); fetchHistory(page) }} />

      {sessionError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{sessionError}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <StatsCards history={history} isLoading={isHistoryLoading} />

      {/* Active session / no session */}
      <section>
        {isSessionLoading ? (
          <Skeleton className="h-52 w-full rounded-2xl" />
        ) : activeSession ? (
          <ActiveSessionCard session={activeSession} onClockOut={() => setIsClockOutOpen(true)} />
        ) : !sessionError ? (
          <NoSessionState onClockIn={() => setIsClockInOpen(true)} />
        ) : null}
      </section>

      {/* History */}
      {historyError ? (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>History Error</AlertTitle>
          <AlertDescription className="flex items-center gap-3">
            {historyError}
            <Button size="sm" variant="outline" onClick={() => fetchHistory(page)}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <HistorySection
          history={history}
          isLoading={isHistoryLoading}
          page={page}
          onPageChange={(p) => {
            setPage(p)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        />
      )}

      <ClockInDialog
        open={isClockInOpen}
        onClose={() => setIsClockInOpen(false)}
        onClockIn={handleClockIn}
      />
      <ClockOutDialog
        open={isClockOutOpen}
        clockInTime={activeSession?.clock_in ?? null}
        onClose={() => setIsClockOutOpen(false)}
        onClockOut={handleClockOut}
      />
    </div>
  )
}
