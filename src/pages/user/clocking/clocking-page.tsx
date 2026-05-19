import { useCallback, useEffect, useRef, useState, useMemo } from "react"
import {
  ActivityIcon,
  AlertCircleIcon,
  BookOpenIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  LogInIcon,
  LogOutIcon,
  RefreshCwIcon,
  StarIcon,
  BriefcaseIcon,
  
  
  PlayCircleIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { getActiveSession, getClockingHistory } from "./service/clocking.service"
import { ClockInDialog } from "./components/clock-in-dialog"
import { ClockOutDialog } from "./components/clock-out-dialog"
import type { ClockingHistoryResult, ClockingRecord } from "./types/clocking.types"

// -- Helpers -------------------------------------------------------------------

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "�"
  try {
    return new Date(iso).toLocaleTimeString(undefined, { timeStyle: "short" })
  } catch {
    return iso
  }
}

function formatDateKey(iso: string | null | undefined): string {
  if (!iso) return "Unknown Date"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "�"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// -- Components ----------------------------------------------------------------

// 1. HEADER
function AttendanceHeader({ onRefresh }: { onRefresh: () => void }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  const displayDate = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const displayTime = now.toLocaleTimeString(undefined, { timeStyle: 'short' })

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/40 pb-6 mb-6">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Attendance
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg">
          Track your learning sessions and monitor your productivity over time.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary/40 border border-border/50 text-sm font-medium text-secondary-foreground">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>{displayDate}</span>
          <span className="text-border mx-1">|</span>
          <span className="tabular-nums">{displayTime}</span>
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh Data" className="h-9 w-9">
          <RefreshCwIcon className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}

// 2. ACTIVE SESSION CARD
function ActiveSessionCard({ session, onClockOut }: { session: ClockingRecord; onClockOut: () => void }) {
  const [tick, setTick] = useState({ h: 0, m: 0, s: 0, display: "00:00:00" })

  useEffect(() => {
    function update() {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(session.clock_in!).getTime()) / 1000))
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setTick({
        h, m, s,
        display: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [session.clock_in])

  const progressPct = Math.min(100, ((tick.m * 60 + tick.s) / 3600) * 100)

  return (
    <div className="relative overflow-hidden group border border-emerald-500/20 bg-linear-to-br from-emerald-950/40 to-background rounded-xl p-6 shadow-xs transition-all hover:shadow-md">
      <div className="absolute top-0 left-0 w-1 bg-emerald-500 h-full" />
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        {/* Left: Info */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Live Session Active</span>
          </div>

          <div className="flex items-baseline gap-4">
            <h2 className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-foreground tabular-nums">
              {tick.display}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="bg-background/50 text-muted-foreground gap-1.5 py-1">
              <PlayCircleIcon className="h-3.5 w-3.5" /> Start: {formatTime(session.clock_in)}
            </Badge>
            {session.course && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 gap-1.5 py-1 border-emerald-500/20">
                <BookOpenIcon className="h-3.5 w-3.5" />
                {session.course.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-xs text-muted-foreground mb-1.5 block">Current Hour Progress</span>
            <div className="w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-linear" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <Button size="lg" onClick={onClockOut} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-600/50">
            <LogOutIcon className="mr-2 h-4 w-4" /> Clock Out
          </Button>
        </div>
      </div>
    </div>
  )
}

function NoSessionState({ onClockIn }: { onClockIn: () => void }) {
  return (
    <div className="relative border border-border/50 bg-secondary/20 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-55">
      <div className="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-xl" />
      <div className="h-14 w-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 relative">
        <ActivityIcon className="h-6 w-6 text-indigo-500" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1.5">Ready to focus?</h3>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Start a new learning session to track your time and progress towards your goals.
      </p>
      <Button size="lg" onClick={onClockIn} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
        <LogInIcon className="mr-2 h-4 w-4" /> Start Session Now
      </Button>
    </div>
  )
}

// 3. STATS SECTION
// function AttendanceStatsGrid({ history, isLoading }: { history: ClockingHistoryResult; isLoading: boolean }) {
//   const totalSessions = history.meta.total
//   const pageMinutes = history.data.reduce((s, r) => s + (r.duration ?? 0), 0)
//   const ratedRecords = history.data.filter((r) => r.rating != null && r.rating > 0)
//   const avgRating = ratedRecords.length
//     ? (ratedRecords.reduce((s, r) => s + r.rating!, 0) / ratedRecords.length).toFixed(1)
//     : "�"

//   if (isLoading) {
//     return (
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//         {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
//       </div>
//     )
//   }

//   if (totalSessions === 0) return null

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//       <StatCard
//         title="Total Sessions"
//         value={totalSessions}
//         icon={LayersIcon}
//         trend="+1 this week" // placeholder
//         color="indigo"
//       />
//       <StatCard
//         title="Time Tracked"
//         value={formatTotalTime(pageMinutes)}
//         icon={TimerIcon}
//         trend="This page"
//         color="emerald"
//       />
//       <StatCard
//         title="Avg Quality"
//         value={avgRating}
//         icon={StarIcon}
//         trend={`${ratedRecords.length} rated`}
//         color="amber"
//       />
//     </div>
//   )
// }

// 4. TIMELINE HISTORY
function SessionTimelineItem({ record }: { record: ClockingRecord }) {
  const isActive = !record.clock_out

  return (
    <div className="group relative flex gap-6 pb-8 last:pb-0">
      {/* Timeline connector */}
      <div className="absolute left-6 top-10 bottom-0 w-px bg-border/40 group-last:hidden" />
      
      {/* Time column (Left) */}
      <div className="w-24 pt-1 shrink-0 text-right hidden sm:block">
        <div className="text-sm font-medium text-foreground">{formatTime(record.clock_in)}</div>
        {record.clock_out && (
          <div className="text-xs text-muted-foreground mt-0.5">{formatTime(record.clock_out)}</div>
        )}
      </div>

      {/* Node indicator */}
      <div className="relative z-10 shrink-0 mt-2">
        <div className={`h-3 w-3 rounded-full ring-4 ring-background ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
      </div>

      {/* Mobile Time (Top of card on small screens) */}
      <div className="flex-1 min-w-0">
        <div className="bg-card border border-border/40 hover:border-border transition-colors rounded-xl p-4 sm:p-5 shadow-xs relative">
          
          {/* Header Row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="sm:hidden text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md">
                  {formatTime(record.clock_in)} {record.clock_out ? `- ${formatTime(record.clock_out)}` : ''}
                </span>
                {isActive ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase">
                    In Progress
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-secondary/50 text-[10px] uppercase text-muted-foreground">
                    Completed
                  </Badge>
                )}
              </div>
              
              {record.course ? (
                <div className="font-medium text-base text-foreground flex items-center gap-1.5 mt-1">
                  <BriefcaseIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{record.course.name}</span>
                </div>
              ) : (
                <div className="font-medium text-base text-muted-foreground mt-1">General Session</div>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {record.duration != null ? (
                <div className="text-sm font-mono font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md">
                  {formatDuration(record.duration)}
                </div>
              ) : (
                <div className="text-sm font-mono text-emerald-500">Live</div>
              )}
              {record.rating != null && record.rating > 0 && (
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <StarIcon key={s} className={`h-3 w-3 ${s <= record.rating! ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted/30"}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Row */}
          {record.comment && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-sm font-serif italic text-muted-foreground line-clamp-2">
                "{record.comment}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionTimeline({ history, isLoading, page, onPageChange }: { history: ClockingHistoryResult, isLoading: boolean, page: number, onPageChange: (p: number) => void }) {
  const { data, meta } = history

  const groupedByDate = useMemo(() => {
    const groups: Record<string, ClockingRecord[]> = {}
    data.forEach(record => {
      const dateKey = formatDateKey(record.clock_in)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(record)
    })
    return groups
  }, [data])

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-4 mt-8">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-xl mt-8 bg-secondary/10">
        <ClockIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">No sessions recorded</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
          Your timeline is empty. Clock in to start building your attendance history.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-10 space-y-10">
      {Object.entries(groupedByDate).map(([dateLabel, records]) => (
        <div key={dateLabel} className="space-y-6">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-20 py-2 border-b border-border/40 mb-4 sm:ml-24 pl-5 sm:pl-8 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground tracking-tight uppercase">
              {dateLabel}
            </h3>
            <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              {records.length} {records.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>
          
          <div className="space-y-0">
            {records.map(record => (
              <SessionTimelineItem key={record.id} record={record} />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-6 mt-8 sm:ml-24 pl-5 sm:pl-8">
          <span className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeftIcon className="h-4 w-4 mr-1" /> Prev
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={page >= meta.last_page || isLoading}
              onClick={() => onPageChange(page + 1)}
            >
              Next <ChevronRightIcon className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// -- Main Page -----------------------------------------------------------------

const PER_PAGE = 15

export function UserClockingPage() {
  const [activeSession, setActiveSession] = useState<ClockingRecord | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [history, setHistory] = useState<ClockingHistoryResult>({ data: [], meta: { current_page: 1, from: null, last_page: 1, per_page: PER_PAGE, to: null, total: 0, path: "" }, links: { first: null, last: null, prev: null, next: null } })
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
  useEffect(() => { fetchHistory(page); return () => historyAbortRef.current?.abort() }, [fetchHistory, page])

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
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 space-y-8 animate-in fade-in duration-500 text-foreground bg-background min-h-screen">
      
      <AttendanceHeader onRefresh={() => { fetchActiveSession(); fetchHistory(page); }} />

      {sessionError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{sessionError}</AlertDescription>
        </Alert>
      )}

      {/* Main Focus Area */}
      <section className="mt-8">
        {isSessionLoading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : activeSession ? (
          <ActiveSessionCard session={activeSession} onClockOut={() => setIsClockOutOpen(true)} />
        ) : !sessionError ? (
          <NoSessionState onClockIn={() => setIsClockInOpen(true)} />
        ) : null}
      </section>

      {/* Stats Overview
      <section className="mt-8">
        <AttendanceStatsGrid history={history} isLoading={isHistoryLoading} />
      </section> */}

      {/* Timeline History */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-foreground tracking-tight">Timeline</h2>
        </div>
        <div className="bg-border/30 h-px w-full" />
        
        {historyError ? (
          <Alert variant="destructive" className="mt-6">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>History Error</AlertTitle>
            <AlertDescription className="flex items-center gap-3">
              {historyError}
              <Button size="sm" variant="outline" onClick={() => fetchHistory(page)}>Retry</Button>
            </AlertDescription>
          </Alert>
        ) : (
          <SessionTimeline 
            history={history} 
            isLoading={isHistoryLoading} 
            page={page} 
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} 
          />
        )}
      </section>

      {/* Dialogs */}
      <ClockInDialog open={isClockInOpen} onClose={() => setIsClockInOpen(false)} onClockIn={handleClockIn} />
      <ClockOutDialog open={isClockOutOpen} clockInTime={activeSession?.clock_in ?? null} onClose={() => setIsClockOutOpen(false)} onClockOut={handleClockOut} />
      
    </div>
  )
}
