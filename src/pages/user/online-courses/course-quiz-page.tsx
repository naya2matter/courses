// ─── User Online Course — Module Quiz Intro ───────────────────────────────────
// Route: /user/online-courses/:courseId/quiz/:quizId
//
// A dedicated, course-scoped landing page for a module quiz. Shows quiz metadata
// (questions, time limit, pass threshold, attempts, deadline) and a Start button
// that opens a new attempt, then hands off to the shared take/result screens with
// a ?course= param so navigation returns into the course (not /user/quizzes).
//
// Access requires only COURSE enrollment — the backend guard
// (QuizAttemptService::canUserAttempt) resolves enrollment from the quiz's module.

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  BookOpenCheckIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  CircleDotIcon,
  ClockIcon,
  EyeOffIcon,
  InfoIcon,
  LayersIcon,
  ListChecksIcon,
  Loader2Icon,
  LockIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  SquareCheckIcon,
  TextIcon,
  TrophyIcon,
  XCircleIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"
import { useDynamicBreadcrumb } from "@/context/breadcrumb"

import { getUserQuizById, startQuizAttempt } from "@/pages/user/quiz/service/user-quiz.service"
import type { UserQuizDetail, UserQuizQuestion } from "@/pages/user/quiz/types/user-quiz.types"

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

// ── Info chip ──────────────────────────────────────────────────────────────────

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

// ── Question preview row ──────────────────────────────────────────────────────

function QuestionRow({ q, index }: { q: UserQuizQuestion; index: number }) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10 text-xs font-bold text-indigo-400">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium leading-snug text-white/80">{q.question_text}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-white/40">
            {QUESTION_ICONS[q.type]}
            {QUESTION_LABELS[q.type] ?? q.type}
          </span>
          {q.points != null && (
            <span className="inline-flex rounded-full border border-amber-500/15 bg-amber-500/8 px-2 py-0.5 text-[11px] font-semibold text-amber-400/80">
              {q.points} pt{q.points !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function QuizIntroSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded" />
      <Skeleton className="h-4 w-full max-w-lg rounded" />
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

export function CourseQuizPage() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>()
  const navigate = useNavigate()
  const numericQuizId = Number(quizId)

  const [quiz, setQuiz] = useState<UserQuizDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const backToCourse = useCallback(
    () => navigate(`/user/online-courses/${courseId}`),
    [navigate, courseId],
  )

  const fetchQuiz = useCallback(async () => {
    if (isNaN(numericQuizId)) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getUserQuizById(numericQuizId)
      setQuiz(res.data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(
          err.status === 403
            ? "This quiz is locked — finish the previous module first."
            : err.status === 404
              ? "Quiz not found."
              : err.message || "Failed to load quiz.",
        )
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load quiz.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [numericQuizId])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  useDynamicBreadcrumb(quiz?.title)

  const handleStart = async () => {
    if (!quiz) return
    setIsStarting(true)
    setStartError(null)
    try {
      const attempt = await startQuizAttempt(quiz.id)
      navigate(`/user/quizzes/${quiz.id}/take/${attempt.id}?course=${courseId}`)
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
  const totalPoints = quiz?.questions?.reduce((s, q) => s + (q.points ?? 0), 0) ?? null
  const alreadyPassed = quiz?.user_passed === true

  return (
    <div className="space-y-7">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={backToCourse}
          className="-ml-2 flex items-center gap-1.5 text-white/50 hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          Back to course
        </Button>
        <span className="text-white/20">/</span>
        <span className="max-w-xs truncate text-sm text-white/50">
          {isLoading ? "Loading…" : (quiz?.title ?? "Quiz")}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Unable to open quiz</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuiz}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && <QuizIntroSkeleton />}

      {/* Loaded */}
      {!isLoading && !error && quiz && (
        <div className="space-y-7">
          {/* Title + status */}
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/25 bg-indigo-600/20 shadow-md shadow-indigo-500/10">
              <BookOpenCheckIcon className="size-6 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="min-w-0 flex-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {quiz.title}
                </h1>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 rounded-full border-purple-500/25 bg-purple-500/10 text-purple-300"
                >
                  Module Quiz
                </Badge>
              </div>
              {quiz.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-white/50">{quiz.description}</p>
              )}
            </div>
          </div>

          {/* Pass/Fail status */}
          {quiz.user_passed != null && (
            <Card
              className={`rounded-2xl border ${
                quiz.user_passed
                  ? "border-emerald-500/20 bg-emerald-500/8"
                  : "border-rose-500/20 bg-rose-500/8"
              }`}
            >
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-2xl border ${
                      quiz.user_passed
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {quiz.user_passed ? (
                      <CheckCircle2Icon className="size-5" />
                    ) : (
                      <XCircleIcon className="size-5" />
                    )}
                  </div>
                  <div>
                    <p className={`text-lg font-semibold ${quiz.user_passed ? "text-emerald-300" : "text-rose-300"}`}>
                      {quiz.user_passed ? "Passed" : "Not passed yet"}
                    </p>
                    {quiz.user_total_score != null && (
                      <p className="text-sm text-white/50">Best score: {quiz.user_total_score} pts</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info grid */}
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
                value={`${quiz.time_limit_minutes} minutes`}
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
            {quiz.max_attempts != null && (
              <InfoChip
                icon={<LayersIcon className="size-3.5" />}
                label="Max Attempts"
                value={`${quiz.max_attempts} attempt${quiz.max_attempts !== 1 ? "s" : ""}`}
              />
            )}
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

          {/* Overdue warning */}
          {overdue && (
            <Alert className="border-red-500/30 bg-red-500/8">
              <AlertCircleIcon className="size-4 text-red-400" />
              <AlertTitle className="text-red-400">Deadline Passed</AlertTitle>
              <AlertDescription className="text-red-300/70">
                The deadline for this quiz has passed. You may not be able to submit new attempts.
              </AlertDescription>
            </Alert>
          )}

          {/* Start error */}
          {startError && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Could Not Start Quiz</AlertTitle>
              <AlertDescription>{startError}</AlertDescription>
            </Alert>
          )}

          {/* Questions preview */}
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
              <CardContent className="divide-y divide-white/5 px-5 py-0">
                {quiz.questions.map((q, i) => (
                  <QuestionRow key={q.id} q={q} index={i} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Instruction card */}
          <Card className="rounded-2xl border-indigo-500/20 bg-indigo-500/6">
            <CardContent className="flex items-start gap-3.5 px-5 py-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/15">
                <InfoIcon className="size-4 text-indigo-400" />
              </div>
              <div className="space-y-1 pt-0.5 text-sm leading-relaxed text-white/50">
                <p>
                  Once you start the quiz, a new attempt will be created.
                  {quiz.time_limit_minutes != null &&
                    ` You will have ${quiz.time_limit_minutes} minutes to complete it.`}
                </p>
                {quiz.max_attempts != null && (
                  <p>
                    You have up to{" "}
                    <span className="font-medium text-white/80">
                      {quiz.max_attempts} attempt{quiz.max_attempts !== 1 ? "s" : ""}
                    </span>{" "}
                    for this quiz.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={isStarting}
              className="flex h-12 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-8 text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
            >
              {isStarting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <PlayCircleIcon className="size-5" />
                  {alreadyPassed ? "Retake Quiz" : "Start Quiz"}
                  <ChevronRightIcon className="size-4" />
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={backToCourse}
              className="h-12 rounded-xl border-white/15 bg-transparent text-white/60 hover:border-white/30 hover:text-white"
            >
              <ArrowLeftIcon className="mr-2 size-4" />
              Back
            </Button>
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
              onClick={backToCourse}
              className="border-white/15 text-white/60 hover:text-white"
            >
              <ArrowLeftIcon className="mr-2 size-4" />
              Back to course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
