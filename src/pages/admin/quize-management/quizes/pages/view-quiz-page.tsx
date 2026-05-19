// ─── View Quiz Page ────────────────────────────────────────────────────────────
// Fetches and displays a single quiz with all its questions.

import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  ClipboardListIcon,
  ClockIcon,
  TargetIcon,
  RepeatIcon,
  CalendarIcon,
  CircleDotIcon,
  CheckSquareIcon,
  TypeIcon,
  CheckCircle2Icon,
  XIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  UsersIcon,
  ChevronRightIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { Badge } from "@/components/ui/badge"

import { isApiError } from "@/lib/api"
import { getQuizById, deleteQuiz, getQuizAttempts } from "../service/quiz.service"
import type { QuizQuestion, QuizResource, QuizStatus, QuestionType, QuizAttemptAdminResource } from "../types/quiz.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QuizStatus, string> = {
  draft: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived: "bg-slate-500/15 text-slate-400 border-slate-500/30",
}
const STATUS_LABELS: Record<QuizStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  radio: <CircleDotIcon className="h-4 w-4 text-indigo-400 shrink-0" />,
  checkbox: <CheckSquareIcon className="h-4 w-4 text-sky-400 shrink-0" />,
  text: <TypeIcon className="h-4 w-4 text-amber-400 shrink-0" />,
}
const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  radio: "Single choice",
  checkbox: "Multiple choice",
  text: "Open-ended",
}

const SHOW_CORRECT_LABELS: Record<string, string> = {
  never: "Never",
  after_pass: "After passing",
  after_max_attempts: "After all attempts used",
  always: "Always",
}

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

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
  const type = question.type as QuestionType
  const hasOptions = question.options && question.options.length > 0
  const correctSet = new Set(question.correct_answer ?? [])

  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-5 space-y-4">
      {/* Question header */}
      <div className="flex items-start gap-3">
        {QUESTION_TYPE_ICONS[type] ?? <ClipboardListIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Q{index + 1}</span>
            <span className="inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {QUESTION_TYPE_LABELS[type] ?? type}
            </span>
            {question.points != null && (
              <span className="inline-flex items-center rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                {question.points} pt{question.points !== 1 ? "s" : ""}
              </span>
            )}
            {question.points == null && type === "text" && (
              <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                Manual grading
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium leading-relaxed">{question.question_text}</p>
        </div>
      </div>

      {/* Options */}
      {hasOptions && (
        <ul className="space-y-1.5 pl-7">
          {question.options!.map((opt, i) => {
            const isCorrect = correctSet.has(opt)
            return (
              <li
                key={i}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isCorrect
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border border-white/5 bg-white/2 text-muted-foreground"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <XIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                )}
                {opt}
              </li>
            )
          })}
        </ul>
      )}

      {/* Explanation */}
      {question.correct_answer_explanation && (
        <div className="ml-7 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
          <p className="text-xs font-medium text-indigo-400 mb-1">Explanation</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {question.correct_answer_explanation}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ViewQuizSkeleton() {
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
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export function ViewQuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<QuizResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [attempts, setAttempts] = useState<QuizAttemptAdminResource[]>([])
  const [attemptsLoading, setAttemptsLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    setError(null)

    getQuizById(Number(id))
      .then((data) => {
        setQuiz(data)
        // Load attempts in the background
        setAttemptsLoading(true)
        return getQuizAttempts(Number(id))
      })
      .then((atts) => setAttempts(atts))
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        let message = "Failed to load quiz. Please try again."
        if (isApiError(err)) {
          if (err.status === 404) message = "Quiz not found."
          else message = err.message || message
        } else if (err instanceof Error) {
          message = err.message
        }
        setError(message)
      })
      .finally(() => {
        setIsLoading(false)
        setAttemptsLoading(false)
      })
  }, [id])

  if (isLoading) return <ViewQuizSkeleton />

  if (error) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link to="/admin/quiz-management/list-quizzes">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Quizzes
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

  async function handleDelete() {
    if (!id) return
    setIsDeleting(true)
    try {
      await deleteQuiz(Number(id))
      toast.success("Quiz deleted successfully.")
      navigate("/admin/quiz-management/list-quizzes")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let message = "Failed to delete quiz."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (!quiz) return null

  const status = (quiz.status ?? "draft") as QuizStatus
  const questions = quiz.questions ?? []

  const deadline = quiz.deadline
    ? new Date(quiz.deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No deadline"

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0 mt-0.5">
            <Link to="/admin/quiz-management/list-quizzes">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            </div>
            {quiz.description && (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{quiz.description}</p>
            )}
            <p className="mt-1.5 text-xs text-muted-foreground/60">Quiz ID: {quiz.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/admin/quiz-management/quizzes/${quiz.id}/edit`}>
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2Icon className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/quiz-management/quizzes/create">Create another</Link>
          </Button>
        </div>
      </div>

      {/* ── Delete confirmation dialog ─────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete <span className="font-medium text-foreground">{quiz.title}</span>.
              The quiz will no longer be visible to users. This action can be reversed by the system administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
              ) : (
                "Yes, delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Meta stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaStat
          icon={<ClipboardListIcon className="h-4 w-4" />}
          label="Questions"
          value={questions.length}
        />
        <MetaStat
          icon={<TargetIcon className="h-4 w-4" />}
          label="Pass threshold"
          value={quiz.pass_threshold != null ? `${quiz.pass_threshold}%` : "—"}
        />
        <MetaStat
          icon={<ClockIcon className="h-4 w-4" />}
          label="Time limit"
          value={quiz.time_limit_minutes != null ? `${quiz.time_limit_minutes} min` : "No limit"}
        />
        <MetaStat
          icon={<RepeatIcon className="h-4 w-4" />}
          label="Max attempts"
          value={quiz.max_attempts != null ? quiz.max_attempts : "Unlimited"}
        />
      </div>

      {/* ── Additional details ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <MetaStat
          icon={<CalendarIcon className="h-4 w-4" />}
          label="Deadline"
          value={deadline}
        />
        <MetaStat
          icon={<RepeatIcon className="h-4 w-4" />}
          label="Retry delay"
          value={quiz.retry_delay_hours != null ? `${quiz.retry_delay_hours}h between attempts` : "No delay"}
        />
        <MetaStat
          icon={<CheckCircle2Icon className="h-4 w-4" />}
          label="Show correct answers"
          value={SHOW_CORRECT_LABELS[quiz.show_correct_answers ?? "never"] ?? quiz.show_correct_answers ?? "—"}
        />
      </div>

      <Separator />

      {/* ── Questions ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Questions{" "}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              ({questions.length})
            </span>
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/2 py-12 text-center">
            <ClipboardListIcon className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No questions added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((q, i) => (
                <QuestionCard key={q.id ?? i} question={q} index={i} />
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* ── Attempts ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            Attempts
            {!attemptsLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({attempts.length})
              </span>
            )}
          </h2>
        </div>

        {attemptsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : attempts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/2 py-10 text-center">
            <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No attempts yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt) => {
              const submittedAt = attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "In progress"

              const hasPending = attempt.answers?.some(
                (a) => {
                  const q = a.question
                  return q?.type === "text" && a.points_earned == null
                }
              )

              return (
                <Link
                  key={attempt.id}
                  to={`/admin/quiz-management/quizzes/${quiz.id}/attempts/${attempt.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/2 px-4 py-3.5 transition-colors hover:bg-white/5 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-semibold text-muted-foreground">
                      #{attempt.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attempt.user?.name ?? `User #${attempt.user_id}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{submittedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {attempt.submitted_at && attempt.score != null && (
                      <Badge
                        variant="outline"
                        className={
                          attempt.passed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }
                      >
                        {attempt.score}
                        {attempt.total_points != null ? `/${attempt.total_points}` : ""} pts
                      </Badge>
                    )}
                    {hasPending && (
                      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
                        Needs grading
                      </Badge>
                    )}
                    {!attempt.submitted_at && (
                      <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-400">
                        In progress
                      </Badge>
                    )}
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
