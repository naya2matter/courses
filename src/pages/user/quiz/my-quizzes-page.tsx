import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpenCheckIcon,
  ClockIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  TrophyIcon,
  CalendarIcon,
  LayersIcon,
  CheckCircle2Icon,
  XCircleIcon,
  LockIcon,
  PlayCircleIcon,
  ListChecksIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isApiError } from "@/lib/api"

import { getUserQuizList } from "./service/user-quiz.service"
import type { UserQuizListItem } from "./types/user-quiz.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return ""
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

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

function getStatusLabel(quiz: UserQuizListItem): {
  label: string
  variant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ReactNode
} {
  const attempt = quiz.last_attempt
  if (!attempt) {
    return { label: "Not Started", variant: "outline", icon: <PlayCircleIcon className="size-3" /> }
  }
  if (attempt.submitted_at == null) {
    return { label: "In Progress", variant: "default", icon: <ClockIcon className="size-3" /> }
  }
  if (attempt.passed === true) {
    return { label: "Passed", variant: "default", icon: <CheckCircle2Icon className="size-3" /> }
  }
  if (attempt.passed === false) {
    return { label: "Failed", variant: "destructive", icon: <XCircleIcon className="size-3" /> }
  }
  return { label: "Completed", variant: "secondary", icon: <CheckCircle2Icon className="size-3" /> }
}

function getAttemptsLeft(quiz: UserQuizListItem): number | null {
  if (quiz.max_attempts == null) return null
  const used = quiz.attempts_count ?? 0
  return Math.max(0, quiz.max_attempts - used)
}

// ── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReturnType<typeof getStatusLabel> }) {
  const cls =
    status.label === "Passed"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : status.label === "Failed"
        ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
        : status.label === "In Progress"
          ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
          : status.label === "Completed"
            ? "bg-sky-500/10 text-sky-300 border-sky-500/20"
            : "bg-white/8 text-white/50 border-white/10"
  return (
    <span
      aria-label={`Status: ${status.label}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${cls}`}
    >
      {status.icon}
      {status.label}
    </span>
  )
}

// ── MetaChip ──────────────────────────────────────────────────────────────────

function MetaChip({
  icon,
  label,
  accent,
}: {
  icon: React.ReactNode
  label: string
  accent?: "amber" | "red"
}) {
  const cls =
    accent === "red"
      ? "border-rose-500/20 bg-rose-500/8 text-rose-400/80"
      : accent === "amber"
        ? "border-amber-500/20 bg-amber-500/8 text-amber-400/80"
        : "border-white/8 bg-white/3 text-white/45"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function QuizCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/2.5 p-5 space-y-4 overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-48 rounded-lg bg-white/8" />
        <Skeleton className="h-5 w-20 rounded-full bg-white/8" />
      </div>
      <Skeleton className="h-4 w-full rounded-lg bg-white/8" />
      <Skeleton className="h-4 w-3/4 rounded-lg bg-white/8" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full bg-white/8" />
        <Skeleton className="h-5 w-16 rounded-full bg-white/8" />
        <Skeleton className="h-5 w-20 rounded-full bg-white/8" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl bg-white/8" />
    </div>
  )
}

// ── Quiz card ─────────────────────────────────────────────────────────────────

interface QuizCardProps {
  quiz: UserQuizListItem
  onOpen: (id: number) => void
  index: number
}

function QuizCard({ quiz, onOpen, index }: QuizCardProps) {
  const status = getStatusLabel(quiz)
  const attemptsLeft = getAttemptsLeft(quiz)
  const overdue = isOverdue(quiz.deadline)
  const canAttempt = attemptsLeft === null || attemptsLeft > 0
  const passed = quiz.last_attempt?.passed === true
  const attempted = (quiz.attempts_count ?? 0) > 0

  const accentBg =
    status.label === "Passed"
      ? "bg-emerald-400"
      : status.label === "Failed"
        ? "bg-rose-400"
        : status.label === "In Progress"
          ? "bg-violet-400"
          : status.label === "Completed"
            ? "bg-sky-400"
            : "bg-slate-500/60"

  return (
    <div
      className={[
        "relative flex flex-col gap-4 rounded-2xl border overflow-hidden p-5",
        "animate-in fade-in slide-in-from-bottom-4",
        passed
          ? "border-emerald-500/20 bg-emerald-500/4"
          : "border-white/8 bg-white/2.5",
      ].join(" ")}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      {/* Left accent strip */}
      <div className={`absolute inset-y-0 left-0 w-0.75 ${accentBg}`} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pl-3">
        <TooltipProvider delayDuration={400}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 className="flex-1 min-w-0 text-[15px] font-semibold text-white leading-snug truncate cursor-default">
                {quiz.title}
              </h3>
            </TooltipTrigger>
            <TooltipContent className="max-w-70 bg-black/90 border-white/10 text-white text-xs leading-relaxed">
              {quiz.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <StatusBadge status={status} />
      </div>

      {/* Description */}
      {quiz.description && (
        <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2 pl-3">
          {quiz.description}
        </p>
      )}

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-1.5 pl-3">
        {quiz.questions_count != null && (
          <MetaChip
            icon={<ListChecksIcon className="size-3 shrink-0" />}
            label={`${quiz.questions_count} question${quiz.questions_count !== 1 ? "s" : ""}`}
          />
        )}
        {quiz.time_limit_minutes != null && (
          <MetaChip
            icon={<ClockIcon className="size-3 shrink-0" />}
            label={`${quiz.time_limit_minutes} min`}
          />
        )}
        {quiz.pass_threshold != null && (
          <MetaChip
            icon={<TrophyIcon className="size-3 shrink-0" />}
            label={`Pass: ${quiz.pass_threshold}%`}
            accent="amber"
          />
        )}
        {quiz.max_attempts != null && (
          <MetaChip
            icon={<LayersIcon className="size-3 shrink-0" />}
            label={
              attemptsLeft != null
                ? `${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} left`
                : `${quiz.max_attempts} max`
            }
          />
        )}
        {quiz.deadline && (
          <MetaChip
            icon={<CalendarIcon className="size-3 shrink-0" />}
            label={`${overdue ? "Overdue · " : "Due · "}${formatDeadline(quiz.deadline)}`}
            accent={overdue ? "red" : undefined}
          />
        )}
      </div>

      {/* Score strip (if attempted) */}
      {attempted && quiz.last_attempt?.score != null && (
        <div className="flex items-center gap-2 text-xs rounded-lg border border-white/6 bg-white/2 px-3 py-2 ml-3">
          <span className="text-white/35">Last score</span>
          <span className="text-white/20">·</span>
          <span
            className={`font-bold tabular-nums ${
              quiz.last_attempt.passed ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {quiz.last_attempt.score}
            {quiz.last_attempt.total_points != null
              ? ` / ${quiz.last_attempt.total_points}`
              : ""}
            {" pts"}
          </span>
        </div>
      )}

      {/* Action button */}
      <Button
        size="sm"
        onClick={() => onOpen(quiz.id)}
        className={[
          "mt-auto ml-3 h-10 rounded-xl text-sm font-semibold gap-2 transition-all duration-200",
          canAttempt && !passed
            ? "bg-indigo-600 hover:bg-indigo-500 border-0 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30"
            : passed
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20"
              : "bg-white/5 border border-white/10 text-white/40",
        ].join(" ")}
      >
        {passed ? (
          "View Results"
        ) : canAttempt ? (
          <>
            <PlayCircleIcon className="size-4" />
            {quiz.last_attempt?.submitted_at == null && (quiz.attempts_count ?? 0) > 0
              ? "Continue Quiz"
              : "Open Quiz"}
            <ChevronRightIcon className="size-4 ml-auto" />
          </>
        ) : (
          <>
            <LockIcon className="size-4" />
            No Attempts Left
          </>
        )}
      </Button>
    </div>
  )
}

// ── Summary stats ─────────────────────────────────────────────────────────────

function SummaryStats({ quizzes }: { quizzes: UserQuizListItem[] }) {
  const total = quizzes.length
  const passed = quizzes.filter((q) => q.last_attempt?.passed === true).length
  const inProgress = quizzes.filter(
    (q) => q.last_attempt && q.last_attempt.submitted_at == null,
  ).length
  const notStarted = quizzes.filter((q) => !q.last_attempt).length

  const stats = [
    {
      label: "Total Assigned",
      value: total,
      icon: <BookOpenCheckIcon className="size-4.5" />,
      iconCls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
      valueCls: "text-indigo-300",
      // cardCls: "border-indigo-500/12 bg-indigo-500/[0.05]",
    },
    {
      label: "Passed",
      value: passed,
      icon: <CheckCircle2Icon className="size-4.5" />,
      iconCls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
      valueCls: "text-emerald-300",
      // cardCls: "border-emerald-500/12 bg-emerald-500/5",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: <ClockIcon className="size-4.5" />,
      iconCls: "bg-amber-500/15 text-amber-400 border-amber-500/20",
      valueCls: "text-amber-300",
      // cardCls: "border-amber-500/12 bg-amber-500/5",
    },
    {
      label: "Not Started",
      value: notStarted,
      icon: <PlayCircleIcon className="size-4.5" />,
      iconCls: "bg-white/8 text-white/45 border-white/10",
      valueCls: "text-white/60",
      // cardCls: "border-white/8 bg-white/2.5",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex flex-col items-center text-center rounded-3xl p-4 transition  `}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${s.iconCls}`}
          >
            {s.icon}
          </span>
          <p className={`mt-4 text-4xl font-semibold tabular-nums tracking-tight ${s.valueCls}`}>
            {s.value}
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-white/50">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MyQuizzesPage() {
  const navigate = useNavigate()

  const [quizzes, setQuizzes] = useState<UserQuizListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUserQuizList()
      setQuizzes(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load quizzes.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load quizzes.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  const handleOpen = (id: number) => {
    navigate(`/user/quizzes/${id}`)
  }

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-indigo-600/20 border border-indigo-500/25 shadow-md shadow-indigo-500/10">
            <BookOpenCheckIcon className="size-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Quizzes</h1>
            <p className="text-[13px] text-white/40 mt-0.5">
              Track your progress and scores
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchQuizzes}
          disabled={isLoading}
          className="flex items-center gap-2 shrink-0 border-white/12 text-white/60 hover:text-white hover:border-white/25 bg-transparent rounded-xl"
        >
          <RefreshCwIcon className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuizzes}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading skeletons */}
      {isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <QuizCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : !error && quizzes.length === 0 ? (
        /* Empty state */
        <Card className="border-white/8 bg-white/2 rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-5 py-20 text-center">
            <div className="flex items-center justify-center size-16 rounded-2xl bg-white/5 border border-white/8 shadow-inner">
              <BookOpenCheckIcon className="size-8 text-white/25" />
            </div>
            <div className="space-y-1.5">
              <CardTitle className="text-white/60 text-lg font-semibold">No Quizzes Assigned</CardTitle>
              <p className="text-sm text-white/35 max-w-xs leading-relaxed">
                You have no quizzes assigned yet. Check back later or contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !error ? (
        /* Loaded state */
        <div className="space-y-6">
          <SummaryStats quizzes={quizzes} />

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} assigned
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quizzes.map((quiz, i) => (
                <QuizCard key={quiz.id} quiz={quiz} onOpen={handleOpen} index={i} />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
