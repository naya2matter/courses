import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
  ClockIcon,
  TrophyIcon,
  LayersIcon,
  CalendarIcon,
  ListChecksIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  LockIcon,
  TextIcon,
  SquareCheckIcon,
  CircleDotIcon,
  EyeOffIcon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { getUserQuizById, startQuizAttempt } from "./service/user-quiz.service"
import type { UserQuizDetail, UserQuizQuestion } from "./types/user-quiz.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false
  return new Date(iso) < new Date()
}

const QUESTION_ICONS: Record<string, React.ReactNode> = {
  radio: <CircleDotIcon className="size-3.5 text-indigo-400" />,
  checkbox: <SquareCheckIcon className="size-3.5 text-violet-400" />,
  text: <TextIcon className="size-3.5 text-sky-400" />,
}

const QUESTION_LABELS: Record<string, string> = {
  radio: "Single Choice",
  checkbox: "Multiple Choice",
  text: "Open Text",
}

const SHOW_ANSWERS_LABELS: Record<string, string> = {
  never: "Never shown",
  after_pass: "Shown after passing",
  after_max_attempts: "Shown after all attempts used",
  always: "Always shown",
}

// ── Question type summary ─────────────────────────────────────────────────────
// Compact overview: how many questions of each type, without revealing the
// question text or point breakdown before the quiz starts.

function QuestionTypeSummary({ questions }: { questions: UserQuizQuestion[] }) {
  const counts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1
    return acc
  }, {})
  const order = ["radio", "checkbox", "text"]
  const types = Object.keys(counts).sort((a, b) => order.indexOf(a) - order.indexOf(b))
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {types.map((type) => (
        <div
          key={type}
          className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            {QUESTION_ICONS[type]}
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-none tabular-nums text-white">{counts[type]}</p>
            <p className="mt-1 truncate text-[11px] text-white/45">{QUESTION_LABELS[type] ?? type}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Info chip ─────────────────────────────────────────────────────────────────

function InfoChip({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/8 bg-white/3 p-4 transition-colors hover:bg-white/5">
      <div className="flex items-center gap-2 text-white/35">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-[15px] font-semibold leading-snug ${highlight ?? "text-white/85"}`}>{value}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function QuizDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuizDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const quizId = Number(id)

  const [quiz, setQuiz] = useState<UserQuizDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const fetchQuiz = useCallback(async () => {
    if (isNaN(quizId)) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUserQuizById(quizId)
      setQuiz(res.data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load quiz.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load quiz.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  const handleStart = async () => {
    if (!quiz) return
    setIsStarting(true)
    setStartError(null)
    try {
      const attempt = await startQuizAttempt(quiz.id)
      navigate(`/user/quizzes/${quiz.id}/take/${attempt.id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setStartError(err.message || "Failed to start quiz.")
      } else if (err instanceof Error) {
        setStartError(err.message)
      } else {
        setStartError("Failed to start quiz.")
      }
    } finally {
      setIsStarting(false)
    }
  }

  const overdue = isOverdue(quiz?.deadline)
  const totalPoints =
    quiz?.questions?.reduce((s, q) => s + (q.points ?? 0), 0) ?? null
  // Remaining = configured max minus attempts already used. null = unlimited.
  const attemptsLeft =
    quiz?.max_attempts != null
      ? Math.max(0, quiz.max_attempts - (quiz.attempts_count ?? 0))
      : null

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/user/quizzes")}
        className="-ml-2 flex items-center gap-1.5 text-white/45 hover:text-white"
      >
        <ArrowLeftIcon className="size-4" />
        My Quizzes
      </Button>

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
              onClick={fetchQuiz}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && <QuizDetailSkeleton />}

      {/* Loaded */}
      {!isLoading && !error && quiz && (
        <div className="space-y-6">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {quiz.title}
              </h1>
              {quiz.status && (
                <Badge
                  variant="outline"
                  className={`shrink-0 capitalize border-white/15 ${
                    quiz.status === "published"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "text-white/50"
                  }`}
                >
                  {quiz.status}
                </Badge>
              )}
            </div>
            {quiz.description && (
              <p className="max-w-2xl text-sm leading-relaxed text-white/50">
                {quiz.description}
              </p>
            )}
          </div>

          {/* ── Result banner (Under Review / Passed / Failed) ───────────────── */}
          {(quiz.user_result_pending || quiz.user_passed != null) && (
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                quiz.user_result_pending
                  ? "border-amber-500/20 bg-amber-500/8"
                  : quiz.user_passed
                    ? "border-emerald-500/20 bg-emerald-500/8"
                    : "border-rose-500/20 bg-rose-500/8"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {quiz.user_result_pending ? (
                  <HelpCircleIcon className="size-5 shrink-0 text-amber-400" />
                ) : quiz.user_passed ? (
                  <CheckCircle2Icon className="size-5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircleIcon className="size-5 shrink-0 text-rose-400" />
                )}
                <span
                  className={`font-semibold ${
                    quiz.user_result_pending
                      ? "text-amber-300"
                      : quiz.user_passed
                        ? "text-emerald-300"
                        : "text-rose-300"
                  }`}
                >
                  {quiz.user_result_pending ? "Under Review" : quiz.user_passed ? "Passed" : "Failed"}
                </span>
                {quiz.user_total_score != null && (
                  <span className="text-sm text-white/45">
                    · Score: {quiz.user_total_score} pts{quiz.user_result_pending ? " so far" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">
                {quiz.user_result_pending
                  ? "Some answers are awaiting manual grading — your final result may change."
                  : "Your result is recorded and available here."}
              </p>
            </div>
          )}

          {/* ── Info grid ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quiz.questions_count != null && (
              <InfoChip
                icon={<ListChecksIcon className="size-3.5" />}
                label="Questions"
                value={`${quiz.questions_count} question${quiz.questions_count !== 1 ? "s" : ""}`}
              />
            )}
            {quiz.time_limit_minutes != null && (
              <InfoChip
                icon={<ClockIcon className="size-3.5" />}
                label="Time Limit"
                value={`${quiz.time_limit_minutes} min`}
              />
            )}
            {quiz.pass_threshold != null && (
              <InfoChip
                icon={<TrophyIcon className="size-3.5" />}
                label="Passing Score"
                value={`${quiz.pass_threshold}%`}
                highlight="text-amber-400"
              />
            )}
            {totalPoints != null && totalPoints > 0 && (
              <InfoChip
                icon={<TrophyIcon className="size-3.5" />}
                label="Total Points"
                value={`${totalPoints} pts`}
              />
            )}
            <InfoChip
              icon={<LayersIcon className="size-3.5" />}
              label={quiz.max_attempts != null ? "Attempts Left" : "Attempts Made"}
              value={
                quiz.max_attempts != null
                  ? `${attemptsLeft} of ${quiz.max_attempts}`
                  : `${quiz.attempts_count ?? 0} · Unlimited`
              }
              highlight={
                quiz.max_attempts != null && attemptsLeft === 0 ? "text-red-400" : undefined
              }
            />
            {quiz.show_correct_answers && (
              <InfoChip
                icon={<EyeOffIcon className="size-3.5" />}
                label="Correct Answers"
                value={SHOW_ANSWERS_LABELS[quiz.show_correct_answers] ?? quiz.show_correct_answers}
              />
            )}
            {quiz.deadline && (
              <InfoChip
                icon={<CalendarIcon className="size-3.5" />}
                label="Deadline"
                value={formatDeadline(quiz.deadline)}
                highlight={overdue ? "text-red-400" : undefined}
              />
            )}
          </div>

          {/* ── Overdue warning ──────────────────────────────────────────── */}
          {overdue && (
            <Alert className="border-red-500/30 bg-red-500/8">
              <AlertCircleIcon className="size-4 text-red-400" />
              <AlertTitle className="text-red-400">Deadline Passed</AlertTitle>
              <AlertDescription className="text-red-300/70">
                The deadline for this quiz has passed. You may not be able to submit new attempts.
              </AlertDescription>
            </Alert>
          )}

          {/* ── Questions overview ───────────────────────────────────────── */}
          {quiz.questions && quiz.questions.length > 0 && (
            <Card className="overflow-hidden border-white/8 bg-white/2">
              <CardHeader className="border-b border-white/6 pb-3">
                <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                  <ListChecksIcon className="size-4 text-indigo-400" />
                  Questions Overview
                  <span className="ml-auto text-xs font-medium normal-case tracking-normal text-white/30">
                    {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-4">
                <QuestionTypeSummary questions={quiz.questions} />
              </CardContent>
            </Card>
          )}

          {/* ── Start error ──────────────────────────────────────────────── */}
          {startError && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Could Not Start Quiz</AlertTitle>
              <AlertDescription>{startError}</AlertDescription>
            </Alert>
          )}

          {/* ── CTA ──────────────────────────────────────────────────────── */}
          <div className="space-y-3 pt-1">
            <p className="text-sm text-white/45">
              Once you start, a new attempt will be created.
              {quiz.time_limit_minutes != null && ` You will have ${quiz.time_limit_minutes} minutes to complete it.`}
              {attemptsLeft != null && (
                <> You have <span className="font-medium text-white/70">{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""}</span> remaining.</>
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={handleStart}
                disabled={isStarting}
                className="flex items-center gap-2 rounded-xl border-0 bg-indigo-600 px-8 text-white hover:bg-indigo-500"
              >
                {isStarting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  <>
                    <PlayCircleIcon className="size-5" />
                    Start Quiz
                    <ChevronRightIcon className="size-4" />
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/user/quizzes")}
                className="rounded-xl border-white/15 bg-transparent text-white/60 hover:border-white/30 hover:text-white"
              >
                <ArrowLeftIcon className="mr-2 size-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Not found */}
      {!isLoading && !error && !quiz && (
        <Card className="border-white/8 bg-white/2">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <LockIcon className="size-10 text-white/20" />
            <p className="text-white/50">Quiz not found or you do not have access to it.</p>
            <Button
              variant="outline"
              onClick={() => navigate("/user/quizzes")}
              className="border-white/15 text-white/60 hover:text-white"
            >
              <ArrowLeftIcon className="size-4 mr-2" />
              Back to My Quizzes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
