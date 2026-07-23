import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleDotIcon,
  SquareCheckIcon,
  TextIcon,
  ClockIcon,
  CalendarIcon,
  StarIcon,
  BookOpenCheckIcon,
  HelpCircleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { isApiError } from "@/lib/api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { getQuizResult } from "./service/user-quiz.service"
import type { UserQuizAttemptResource, UserQuizAnswer } from "./types/user-quiz.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatDurationMinutes(startIso?: string | null, endIso?: string | null): string {
  if (!startIso || !endIso) return "—"
  try {
    const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime()
    const m = Math.floor(diffMs / 60000)
    const s = Math.floor((diffMs % 60000) / 1000)
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  } catch {
    return "—"
  }
}

function formatSubmittedAnswer(answer: string | null | undefined): string {
  if (!answer) return ""
  const trimmed = answer.trim()
  if (!trimmed) return ""

  try {
    const decoded = JSON.parse(trimmed)
    if (Array.isArray(decoded)) {
      return decoded.map((item) => String(item)).join(", ")
    }
  } catch {
    // Keep plain text answers unchanged when not JSON.
  }

  return trimmed
}

const Q_ICONS: Record<string, React.ReactNode> = {
  radio: <CircleDotIcon className="size-3.5 text-indigo-400 shrink-0" />,
  checkbox: <SquareCheckIcon className="size-3.5 text-violet-400 shrink-0" />,
  text: <TextIcon className="size-3.5 text-sky-400 shrink-0" />,
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  total,
  passed,
  threshold,
  pending = false,
}: {
  score: number | null
  total: number | null
  passed: boolean | null
  threshold?: number | null
  pending?: boolean
}) {
  const pct = total && total > 0 ? Math.round(((score ?? 0) / total) * 100) : 0
  const circumference = 2 * Math.PI * 54
  // While any answer is under review the pass/fail result isn't final — show a
  // neutral "Under Review" state instead of a definitive Passed / Not Passed.
  const state: "pass" | "fail" | "pending" =
    pending ? "pending" : passed === true ? "pass" : passed === false ? "fail" : "pending"
  const ringColor = state === "pass" ? "#10b981" : state === "fail" ? "#ef4444" : "#f59e0b"
  const scoreTextCls =
    state === "pass" ? "text-emerald-400" : state === "fail" ? "text-red-400" : "text-amber-400"
  const scoreTone =
    state === "pass" ? "text-emerald-300" : state === "fail" ? "text-red-300" : "text-amber-300/80"

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative flex items-center justify-center">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
          />
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * pct) / 100}
            className="transition-all duration-700"
          />
        </svg>
        {state === "pass" && (
          <div className="absolute size-25 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
        )}
        <div className="absolute flex flex-col items-center">
          <span className={`text-3xl font-bold tabular-nums ${scoreTextCls}`}>{pct}%</span>
          <span className="text-xs text-white/40 mt-0.5">{state === "pending" ? "so far" : "score"}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        {state === "pass" ? (
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2Icon className="size-5" />
            <span className="text-lg font-bold">Passed!</span>
          </div>
        ) : state === "fail" ? (
          <div className="flex items-center gap-2 text-red-400">
            <XCircleIcon className="size-5" />
            <span className="text-lg font-bold">Not Passed</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-amber-400">
            <div className="flex items-center gap-2">
              <HelpCircleIcon className="size-5" />
              <span className="text-lg font-bold">Under Review</span>
            </div>
            <span className="text-[11px] text-amber-300/60">Final result pending manual grading</span>
          </div>
        )}
        {total != null && (
          <p className={`text-sm ${scoreTone}`}>
            {score ?? 0} / {total} points{state === "pending" ? " so far" : ""}
          </p>
        )}
        {threshold != null && (
          <p className="text-xs text-white/35">Passing threshold: {threshold}%</p>
        )}
      </div>
    </div>
  )
}

// ── Answer status ──────────────────────────────────────────────────────────────
// The backend always returns is_correct for auto-graded (choice) questions and
// leaves it null for open-text answers awaiting manual grading. So null (or
// missing) = "Under Review"; otherwise it's a definitive correct / wrong.
function answerStatus(answer: UserQuizAnswer): "correct" | "wrong" | "pending" {
  if (answer.is_correct == null) return "pending"
  return answer.is_correct ? "correct" : "wrong"
}

// ── Answer card ────────────────────────────────────────────────────────────────

function AnswerCard({ answer, index }: { answer: UserQuizAnswer; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const q = answer.question
  const status = answerStatus(answer)
  const isCorrect = status === "correct"
  const isWrong = status === "wrong"
  const isPending = status === "pending"

  const borderColor = isCorrect
    ? "border-emerald-500/25 bg-emerald-500/5"
    : isWrong
      ? "border-red-500/25 bg-red-500/5"
      : "border-amber-500/20 bg-amber-500/5"

  const correctAnswerArr = q?.correct_answer
  const showCorrectAnswer = Array.isArray(correctAnswerArr) && correctAnswerArr.length > 0
  const submittedAnswer = formatSubmittedAnswer(answer.answer)

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${borderColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/50 mt-0.5">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/80 leading-snug">
              {q?.question_text ?? "Question"}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {q?.type && (
                <span className="flex items-center gap-1 text-xs text-white/35">
                  {Q_ICONS[q.type]}
                  {q.type}
                </span>
              )}
              {q?.points != null && (
                <span className="text-xs text-white/35">
                  {isPending ? `Pending · ${q.points} pts` : `${answer.points_earned ?? 0} / ${q.points} pts`}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCorrect ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2Icon className="size-3.5" /> Correct
            </span>
          ) : isWrong ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-400">
              <XCircleIcon className="size-3.5" /> Incorrect
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
              <HelpCircleIcon className="size-3.5" /> Under Review
            </span>
          )}
          {(showCorrectAnswer || q?.correct_answer_explanation) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              {expanded ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            </button>
          )}
        </div>
      </div>

      {/* User's answer */}
      <div className="ml-8.5 space-y-1">
        <p className="text-xs text-white/35 uppercase tracking-wider">Your answer</p>
        <div
          className={`
            rounded-lg border px-3 py-2 text-sm
            ${isCorrect
              ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300/80"
              : isWrong
                ? "border-red-500/20 bg-red-500/8 text-red-300/80"
                : "border-white/8 bg-white/5 text-white/60"
            }
          `}
        >
          {submittedAnswer || <span className="italic text-white/30">No answer given</span>}
        </div>
      </div>

      {/* Expanded: correct answer + explanation */}
      {expanded && (
        <div className="ml-8.5 space-y-2">
          {showCorrectAnswer && (
            <div className="space-y-1">
              <p className="text-xs text-white/35 uppercase tracking-wider">Correct answer</p>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-300/80">
                {correctAnswerArr!.join(", ")}
              </div>
            </div>
          )}
          {q?.correct_answer_explanation && (
            <div className="space-y-1">
              <p className="text-xs text-white/35 uppercase tracking-wider">Explanation</p>
              <p className="text-sm text-white/50 leading-relaxed">{q.correct_answer_explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Skeleton className="size-36 rounded-full" />
      </div>
      <Skeleton className="h-6 w-48 rounded mx-auto" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuizResultPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const course = searchParams.get("course")
  const quizId = Number(id)
  const parsedAttemptId = Number(attemptId)

  // When opened from inside a course, navigation returns into the course.
  const quizIntroPath = course ? `/user/online-courses/${course}/quiz/${quizId}` : `/user/quizzes/${quizId}`
  const quizListPath = course ? `/user/online-courses/${course}` : "/user/quizzes"

  const [attempt, setAttempt] = useState<UserQuizAttemptResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResult = useCallback(async () => {
    if (isNaN(quizId) || isNaN(parsedAttemptId)) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getQuizResult(quizId, parsedAttemptId)
      setAttempt(res)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load results.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load results.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [quizId, parsedAttemptId])

  useEffect(() => {
    fetchResult()
  }, [fetchResult])

  const quiz = attempt?.quiz
  const answers = attempt?.answers ?? []
  const achievedScore = attempt?.total_score ?? attempt?.score ?? null
  const totalPoints = attempt?.total_points ?? quiz?.total_points ?? null
  const correctCount = answers.filter((a) => answerStatus(a) === "correct").length
  const wrongCount = answers.filter((a) => answerStatus(a) === "wrong").length
  const pendingCount = answers.filter((a) => answerStatus(a) === "pending").length
  const submittedAt = attempt?.submitted_at ?? attempt?.completed_at
  const duration = formatDurationMinutes(attempt?.started_at, submittedAt)

  return (
    <div className="space-y-7">
      {/* Back nav */}
      <div className="flex items-center gap-2 pb-5 border-b border-white/8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(quizIntroPath)}
          className="flex items-center gap-1.5 text-white/45 hover:text-white -ml-2 rounded-xl"
        >
          <ArrowLeftIcon className="size-4" />
          Quiz Details
        </Button>
        <span className="text-white/15">/</span>
        <span className="text-[13px] text-white/35 hidden sm:block font-medium">Results</span>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error Loading Results</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchResult}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && <ResultSkeleton />}

      {/* Loaded */}
      {!isLoading && !error && attempt && (
        <div className="space-y-7">
          {/* Quiz title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-indigo-600/20 border border-indigo-500/25">
              <BookOpenCheckIcon className="size-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <TooltipProvider delayDuration={400}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-105 cursor-default">
                      {quiz?.title ?? "Quiz Results"}
                    </h1>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black/90 border-white/10 text-white text-xs max-w-xs">
                    {quiz?.title ?? "Quiz Results"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {quiz?.description && (
                <p className="text-[13px] text-white/40 mt-0.5 line-clamp-1">{quiz.description}</p>
              )}
            </div>
          </div>

          {/* Score section */}
          <Card
            className={`rounded-2xl border ${
              pendingCount > 0
                ? "border-amber-500/20 bg-amber-500/4"
                : attempt.passed === true
                  ? "border-emerald-500/20 bg-emerald-500/4"
                  : attempt.passed === false
                    ? "border-rose-500/20 bg-rose-500/4"
                    : "border-white/8 bg-white/2"
            }`}
          >
            <CardContent className="py-8">
              <ScoreRing
                score={achievedScore}
                total={totalPoints}
                passed={attempt.passed ?? null}
                threshold={quiz?.pass_threshold}
                pending={pendingCount > 0}
              />
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                <CheckCircle2Icon className="size-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300 tabular-nums">{correctCount}</p>
                <p className="text-[11px] text-white/40 mt-0.5 font-medium uppercase tracking-wider">Correct</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/20">
                <XCircleIcon className="size-4 text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-300 tabular-nums">{wrongCount}</p>
                <p className="text-[11px] text-white/40 mt-0.5 font-medium uppercase tracking-wider">Wrong</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
                <HelpCircleIcon className="size-4 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-300 tabular-nums">{pendingCount}</p>
                <p className="text-[11px] text-white/40 mt-0.5 font-medium uppercase tracking-wider">Pending</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/2.5 p-4">
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/8 border border-white/10">
                <ClockIcon className="size-4 text-white/50" />
              </div>
              <div>
                <p className="text-xl font-bold text-white/70 tabular-nums">{duration}</p>
                <p className="text-[11px] text-white/40 mt-0.5 font-medium uppercase tracking-wider">Time Taken</p>
              </div>
            </div>
          </div>

          {/* Attempt metadata */}
          <div className="flex flex-wrap gap-4 text-[12px] text-white/30">
            {attempt.started_at && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Started: {formatDate(attempt.started_at)}
              </span>
            )}
            {submittedAt && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5" />
                Submitted: {formatDate(submittedAt)}
              </span>
            )}
          </div>

          <Separator className="bg-white/6" />

          {/* Answers breakdown */}
          {answers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StarIcon className="size-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                  Answer Review
                </h2>
                <span className="ml-auto text-xs text-white/30">
                  {answers.length} question{answers.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {answers.map((answer, i) => (
                  <AnswerCard key={answer.id} answer={answer} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Pending grading notice */}
          {pendingCount > 0 && (
            <Alert className="border-amber-500/30 bg-amber-500/8">
              <HelpCircleIcon className="size-4 text-amber-400" />
              <AlertTitle className="text-amber-400">Answers Under Review</AlertTitle>
              <AlertDescription className="text-amber-300/70">
                {pendingCount} open-text question{pendingCount !== 1 ? "s are" : " is"} awaiting
                manual review by your instructor. Your final score may change.
              </AlertDescription>
            </Alert>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(quizListPath)}
              className="flex items-center gap-2 border-white/15 text-white/60 hover:text-white bg-transparent"
            >
              <ArrowLeftIcon className="size-4" />
              {course ? "Back to course" : "My Quizzes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(quizIntroPath)}
              className="flex items-center gap-2 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 bg-transparent"
            >
              <BookOpenCheckIcon className="size-4" />
              View Quiz
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
