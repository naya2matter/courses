import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  ClockIcon,
  TrophyIcon,
  LayersIcon,
  CalendarIcon,
  ListChecksIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  ChevronRightIcon,
  InfoIcon,
  LockIcon,
  TextIcon,
  SquareCheckIcon,
  CircleDotIcon,
  EyeOffIcon,
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
  radio: "Multiple Choice",
  checkbox: "Checkboxes",
  text: "Open Text",
}

const SHOW_ANSWERS_LABELS: Record<string, string> = {
  never: "Never shown",
  after_pass: "Shown after passing",
  after_max_attempts: "Shown after all attempts used",
  always: "Always shown",
}

// ── Question preview row ──────────────────────────────────────────────────────

function QuestionRow({ q, index }: { q: UserQuizQuestion; index: number }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/6 border border-white/10 text-xs font-semibold text-white/60">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-white/80 leading-snug">{q.question_text}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-white/40">
            {QUESTION_ICONS[q.type]}
            {QUESTION_LABELS[q.type] ?? q.type}
          </span>
          {q.points != null && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-xs text-white/40">
                {q.points} pt{q.points !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
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
    <div className="flex flex-col gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="flex items-center gap-1.5 text-white/40 text-xs">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-semibold ${highlight ?? "text-white/80"}`}>{value}</p>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function QuizDetailSkeleton() {
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
  const attemptsLeft =
    quiz?.max_attempts != null ? quiz.max_attempts : null

  return (
    <div className="space-y-7">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/user/quizzes")}
          className="flex items-center gap-1.5 text-white/50 hover:text-white -ml-2"
        >
          <ArrowLeftIcon className="size-4" />
          My Quizzes
        </Button>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white/50 truncate max-w-xs">
          {isLoading ? "Loading…" : (quiz?.title ?? "Quiz")}
        </span>
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
        <div className="space-y-7">
          {/* Title + status */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex-1 min-w-0">
                {quiz.title}
              </h1>
              {quiz.status && (
                <Badge
                  variant="outline"
                  className={`shrink-0 capitalize border-white/15 ${
                    quiz.status === "published"
                      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      : "text-white/50"
                  }`}
                >
                  {quiz.status}
                </Badge>
              )}
            </div>
            {quiz.description && (
              <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

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
            <Card className="border-white/8 bg-white/[0.02]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-white/80 flex items-center gap-2">
                  <ListChecksIcon className="size-4 text-indigo-400" />
                  Questions Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-white/6">
                {quiz.questions.map((q, i) => (
                  <QuestionRow key={q.id} q={q} index={i} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Instruction card */}
          <Card className="border-indigo-500/20 bg-indigo-500/5">
            <CardContent className="flex items-start gap-3 py-4">
              <InfoIcon className="size-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-sm text-white/50 space-y-1 leading-relaxed">
                <p>
                  Once you start the quiz, a new attempt will be created.
                  {quiz.time_limit_minutes != null &&
                    ` You will have ${quiz.time_limit_minutes} minutes to complete it.`}
                </p>
                {attemptsLeft != null && (
                  <p>
                    You have <span className="text-white/80 font-medium">{attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""}</span>{" "}
                    remaining.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={isStarting}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 px-8"
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
              className="border-white/15 text-white/60 hover:text-white hover:border-white/30 bg-transparent"
            >
              <ArrowLeftIcon className="size-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Not found */}
      {!isLoading && !error && !quiz && (
        <Card className="border-white/8 bg-white/[0.02]">
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
