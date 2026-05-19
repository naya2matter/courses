// ─── View Attempt Page ────────────────────────────────────────────────────────
// Shows the full detail of a quiz attempt — all answers — and lets admins
// manually grade open-ended (text) answers via POST /admin/quiz-answers/grade/{answerId}.

import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  CircleDotIcon,
  CheckSquareIcon,
  TypeIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClipboardListIcon,
  Loader2Icon,
  SaveIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

import { isApiError } from "@/lib/api"
import { getQuizAttemptById, gradeAnswer } from "../service/quiz.service"
import type {
  QuizAttemptAdminResource,
  QuizAnswerAdminResource,
  QuestionType,
} from "../types/quiz.types"

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  radio: <CircleDotIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />,
  checkbox: <CheckSquareIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" />,
  text: <TypeIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />,
}

const TYPE_LABELS: Record<QuestionType, string> = {
  radio: "Single choice",
  checkbox: "Multiple choice",
  text: "Open-ended",
}

// ── Error extractor ───────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function AttemptSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Meta stat card ────────────────────────────────────────────────────────────

function MetaStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/2 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

// ── Grading form for one text answer ─────────────────────────────────────────

function TextGradeForm({
  answer,
  onGraded,
}: {
  answer: QuizAnswerAdminResource
  onGraded: (updated: QuizAnswerAdminResource) => void
}) {
  const [points, setPoints] = useState<string>(
    answer.points_earned != null ? String(answer.points_earned) : "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const maxPoints = answer.question?.points ?? null

  async function handleGrade() {
    const value = Number(points)
    if (points.trim() === "" || isNaN(value) || value < 0) {
      setError("Please enter a valid non-negative number of points.")
      return
    }
    if (maxPoints != null && value > maxPoints) {
      setError(`Points cannot exceed the question maximum of ${maxPoints}.`)
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const updated = await gradeAnswer(answer.id, value)
      onGraded(updated)
      toast.success("Answer graded successfully.")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractError(err))
      toast.error("Failed to save grade.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2">
        <StarIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <p className="text-xs font-semibold text-amber-400">
          {answer.points_earned != null ? "Update grade" : "Grade this answer"}
        </p>
        {maxPoints != null && (
          <span className="ml-auto text-xs text-muted-foreground">Max: {maxPoints} pts</span>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircleIcon className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">Points earned</Label>
          <Input
            type="number"
            min={0}
            max={maxPoints ?? undefined}
            value={points}
            onChange={(e) => {
              setPoints(e.target.value)
              setError(null)
            }}
            placeholder={maxPoints != null ? `0 – ${maxPoints}` : "e.g. 8"}
            disabled={isSaving}
            className="h-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          onClick={handleGrade}
          disabled={isSaving}
          className="gap-1.5 shrink-0"
        >
          {isSaving ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SaveIcon className="h-3.5 w-3.5" />
          )}
          {isSaving ? "Saving…" : "Save grade"}
        </Button>
      </div>
    </div>
  )
}

// ── Single answer card ────────────────────────────────────────────────────────

function AnswerCard({
  answer,
  index,
  onGraded,
}: {
  answer: QuizAnswerAdminResource
  index: number
  onGraded: (updated: QuizAnswerAdminResource) => void
}) {
  const questionType = (answer.question?.type ?? "text") as QuestionType
  const isText = questionType === "text"
  const hasAnswer = answer.answer != null && answer.answer.trim() !== ""
  const isGraded = answer.points_earned != null

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-5 space-y-4">
      {/* Question header */}
      <div className="flex items-start gap-3">
        {TYPE_ICONS[questionType] ?? <ClipboardListIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
            <span className="inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {TYPE_LABELS[questionType]}
            </span>
            {answer.question?.points != null && (
              <span className="inline-flex items-center rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                {answer.question.points} pt{answer.question.points !== 1 ? "s" : ""}
              </span>
            )}

            {/* Grading status badge */}
            {isText && (
              isGraded ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5"
                >
                  Graded · {answer.points_earned} pts
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.5"
                >
                  Needs grading
                </Badge>
              )
            )}

            {/* Auto-graded status */}
            {!isText && answer.is_correct != null && (
              answer.is_correct ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 gap-1"
                >
                  <CheckCircle2Icon className="h-2.5 w-2.5" />
                  Correct · {answer.points_earned ?? 0} pts
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-red-500/30 bg-red-500/10 text-red-400 text-[10px] px-1.5 py-0.5 gap-1"
                >
                  <XCircleIcon className="h-2.5 w-2.5" />
                  Incorrect · 0 pts
                </Badge>
              )
            )}
          </div>

          {answer.question?.question_text ? (
            <p className="text-sm font-medium leading-relaxed">{answer.question.question_text}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">
              Question #{answer.quiz_question_id}
            </p>
          )}
        </div>
      </div>

      {/* User's answer */}
      <div className="rounded-lg border border-white/8 bg-white/2 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">User's answer</p>
        {hasAnswer ? (
          <p className="text-sm leading-relaxed">{answer.answer}</p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">No answer provided.</p>
        )}
      </div>

      {/* Manual grading form — text questions only */}
      {isText && (
        <TextGradeForm answer={answer} onGraded={onGraded} />
      )}
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export function ViewAttemptPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
  const [attempt, setAttempt] = useState<QuizAttemptAdminResource | null>(null)
  const [answers, setAnswers] = useState<QuizAnswerAdminResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !attemptId) return
    setIsLoading(true)
    setError(null)

    getQuizAttemptById(Number(id), Number(attemptId))
      .then((data) => {
        setAttempt(data)
        setAnswers(data.answers ?? [])
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        let message = "Failed to load attempt."
        if (isApiError(err)) {
          if (err.status === 404) message = "Attempt not found."
          else message = err.message || message
        } else if (err instanceof Error) {
          message = err.message
        }
        setError(message)
      })
      .finally(() => setIsLoading(false))
  }, [id, attemptId])

  function handleGraded(updated: QuizAnswerAdminResource) {
    setAnswers((prev) =>
      prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
    )
  }

  const pendingCount = answers.filter(
    (a) => (a.question?.type ?? "text") === "text" && a.points_earned == null,
  ).length

  if (isLoading) return <AttemptSkeleton />

  if (error) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to={`/admin/quiz-management/quizzes/${id}`}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Quiz
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!attempt) return null

  const submittedAt = attempt.submitted_at
    ? new Date(attempt.submitted_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  const startedAt = attempt.started_at
    ? new Date(attempt.started_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0 mt-0.5">
            <Link to={`/admin/quiz-management/quizzes/${id}`}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                Attempt #{attempt.id}
              </h1>
              {attempt.submitted_at ? (
                attempt.passed != null ? (
                  attempt.passed ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                      Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400">
                      Failed
                    </span>
                  )
                ) : null
              ) : (
                <span className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                  In progress
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                  {pendingCount} answer{pendingCount !== 1 ? "s" : ""} need grading
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Quiz ID: {attempt.quiz_id}</p>
          </div>
        </div>
      </div>

      {/* ── Meta stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaStat
          icon={<UserIcon className="h-4 w-4" />}
          label="Student"
          value={attempt.user?.name ?? `User #${attempt.user_id}`}
        />
        <MetaStat
          icon={<StarIcon className="h-4 w-4" />}
          label="Score"
          value={
            attempt.score != null
              ? `${attempt.score}${attempt.total_points != null ? ` / ${attempt.total_points}` : ""} pts`
              : "—"
          }
        />
        <MetaStat
          icon={<ClockIcon className="h-4 w-4" />}
          label="Started"
          value={startedAt}
        />
        <MetaStat
          icon={<ClockIcon className="h-4 w-4" />}
          label="Submitted"
          value={submittedAt ?? "Not submitted"}
        />
      </div>

      {attempt.user?.email && (
        <p className="text-xs text-muted-foreground">
          Email: <span className="font-medium text-foreground">{attempt.user.email}</span>
        </p>
      )}

      <Separator />

      {/* ── Answers ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
          Answers
          <span className="text-sm font-normal text-muted-foreground">({answers.length})</span>
        </h2>

        {answers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/2 py-12 text-center">
            <ClipboardListIcon className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No answers recorded for this attempt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer, i) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                index={i}
                onGraded={handleGraded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
