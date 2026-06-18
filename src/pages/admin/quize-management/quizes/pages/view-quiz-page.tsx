// ─── View Quiz Page ────────────────────────────────────────────────────────────

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
  XCircleIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  UsersIcon,
  ChevronRightIcon,
  EyeIcon,
  ShieldCheckIcon,
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

/** Normalise `options` to string[]. Backend sometimes returns a JSON string. */
function normalizeOptions(opts: unknown): string[] {
  if (!opts) return []
  if (Array.isArray(opts)) return opts.map(String)
  if (typeof opts === "string") {
    try {
      const parsed = JSON.parse(opts)
      return Array.isArray(parsed) ? parsed.map(String) : []
    } catch {
      return []
    }
  }
  return []
}

/** Normalise `correct_answer` to string[]. Same JSON-string issue. */
function normalizeCorrectAnswer(ca: unknown): string[] {
  if (!ca) return []
  if (Array.isArray(ca)) return ca.map(String)
  if (typeof ca === "string") {
    try {
      const parsed = JSON.parse(ca)
      return Array.isArray(parsed) ? parsed.map(String) : [ca]
    } catch {
      return [ca]
    }
  }
  return []
}

const STATUS_STYLES: Record<QuizStatus, string> = {
  draft:     "bg-amber-500/15 text-amber-400 border-amber-500/30",
  published: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  archived:  "bg-slate-500/15 text-slate-400 border-slate-500/30",
}
const STATUS_LABELS: Record<QuizStatus, string> = {
  draft: "Draft", published: "Published", archived: "Archived",
}

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  radio:    <CircleDotIcon className="h-4 w-4 text-indigo-400 shrink-0" />,
  checkbox: <CheckSquareIcon className="h-4 w-4 text-sky-400 shrink-0" />,
  text:     <TypeIcon className="h-4 w-4 text-amber-400 shrink-0" />,
}
const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  radio:    "Single choice",
  checkbox: "Multiple choice",
  text:     "Open-ended",
}

const SHOW_CORRECT_LABELS: Record<string, string> = {
  never:             "Never",
  after_pass:        "After passing",
  after_max_attempts:"After all attempts used",
  always:            "Always",
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent = "indigo",
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  accent?: "indigo" | "violet" | "sky" | "emerald" | "amber"
}) {
  const ring: Record<string, string> = {
    indigo:  "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
    violet:  "border-violet-500/20 bg-violet-500/10 text-violet-400",
    sky:     "border-sky-500/20 bg-sky-500/10 text-sky-400",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    amber:   "border-amber-500/20 bg-amber-500/10 text-amber-400",
  }
  return (
    <div className="flex flex-col items-center text-center p-5 rounded-2xl border border-white/8 bg-card/60 shadow-sm ring-1 ring-white/5 backdrop-blur-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border mb-3 ${ring[accent]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{value}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.20em] text-muted-foreground">{label}</p>
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
  const type = question.type as QuestionType
  const options = normalizeOptions(question.options)
  const correctSet = new Set(normalizeCorrectAnswer(question.correct_answer))
  const hasOptions = options.length > 0
  const hasCorrect = correctSet.size > 0

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden shadow-sm ring-1 ring-white/5">
      {/* ── Question header ── */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {QUESTION_TYPE_ICONS[type] ?? <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
            <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {QUESTION_TYPE_LABELS[type] ?? type}
            </span>
            {question.points != null && (
              <span className="inline-flex items-center rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
                {question.points} pt{question.points !== 1 ? "s" : ""}
              </span>
            )}
            {question.points == null && type === "text" && (
              <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                Manual grading
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium leading-relaxed">{question.question_text}</p>
        </div>
      </div>

      {/* ── Options ── */}
      {hasOptions && (
        <div className="px-5 pb-4 space-y-2">
          {options.map((opt, i) => {
            const isCorrect = correctSet.has(opt)
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  isCorrect
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border border-white/6 bg-white/3 text-muted-foreground"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2Icon className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                )}
                <span className={isCorrect ? "font-medium" : ""}>{opt}</span>
                {isCorrect && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Correct
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Admin: correct answer for text/open questions ── */}
      {type === "text" && hasCorrect && (
        <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 py-3">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 mb-1">
              Correct Answer (Admin)
            </p>
            {[...correctSet].map((ans, i) => (
              <p key={i} className="text-sm text-emerald-200 leading-relaxed">{ans}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Explanation ── */}
      {question.correct_answer_explanation && (
        <div className="mx-5 mb-5 flex items-start gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3">
          <EyeIcon className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400 mb-1">
              Explanation
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {question.correct_answer_explanation}
            </p>
          </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
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
            <ArrowLeftIcon className="h-4 w-4" /> Back to Quizzes
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
  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 0), 0)

  const deadline = quiz.deadline
    ? new Date(quiz.deadline).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "No deadline"

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="shrink-0 mt-0.5">
            <Link to="/admin/quiz-management/list-quizzes">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{quiz.title}</h1>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
            {quiz.description && (
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{quiz.description}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground/50">ID #{quiz.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start shrink-0 flex-wrap">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/admin/quiz-management/quizzes/${quiz.id}/edit`}>
              <PencilIcon className="h-3.5 w-3.5" /> Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting
              ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              : <Trash2Icon className="h-3.5 w-3.5" />}
            Delete
          </Button>
          <Button asChild size="sm">
            <Link to="/admin/quiz-management/quizzes/create">Create another</Link>
          </Button>
        </div>
      </div>

      {/* ── Delete confirmation ─────────────────────────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete{" "}
              <span className="font-medium text-foreground">{quiz.title}</span>.
              The quiz will no longer be visible to users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting
                ? <><Loader2Icon className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
                : "Yes, delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Primary stat cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<ClipboardListIcon className="h-5 w-5" />}
          label="Questions"
          value={questions.length}
          accent="indigo"
        />
        <StatCard
          icon={<TargetIcon className="h-5 w-5" />}
          label="Pass Threshold"
          value={quiz.pass_threshold != null ? `${quiz.pass_threshold}%` : "—"}
          accent="violet"
        />
        <StatCard
          icon={<ClockIcon className="h-5 w-5" />}
          label="Time Limit"
          value={quiz.time_limit_minutes != null ? `${quiz.time_limit_minutes}m` : "None"}
          accent="sky"
        />
        <StatCard
          icon={<RepeatIcon className="h-5 w-5" />}
          label="Max Attempts"
          value={quiz.max_attempts != null ? quiz.max_attempts : "∞"}
          accent="emerald"
        />
      </div>

      {/* ── Secondary details strip ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          label="Deadline"
          value={<span className="text-base">{deadline}</span>}
          accent="amber"
        />
        <StatCard
          icon={<RepeatIcon className="h-5 w-5" />}
          label="Retry Delay"
          value={quiz.retry_delay_hours != null ? `${quiz.retry_delay_hours}h` : "None"}
          accent="violet"
        />
        <StatCard
          icon={<CheckCircle2Icon className="h-5 w-5" />}
          label="Show Correct Answers"
          value={
            <span className="text-sm">
              {SHOW_CORRECT_LABELS[quiz.show_correct_answers ?? "never"] ?? "—"}
            </span>
          }
          accent="emerald"
        />
      </div>

      <Separator className="opacity-30" />

      {/* ── Questions ──────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4 text-muted-foreground" />
            Questions
            <span className="text-sm font-normal text-muted-foreground">({questions.length})</span>
            {totalPoints > 0 && (
              <span className="text-xs text-muted-foreground/60 font-normal">
                · {totalPoints} pts total
              </span>
            )}
          </h2>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/40 py-14 text-center">
            <ClipboardListIcon className="mx-auto h-9 w-9 text-muted-foreground/30" />
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

      <Separator className="opacity-30" />

      {/* ── Attempts ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          Attempts
          {!attemptsLoading && (
            <span className="text-sm font-normal text-muted-foreground">({attempts.length})</span>
          )}
        </h2>

        {attemptsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : attempts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-card/40 py-10 text-center">
            <UsersIcon className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">No attempts yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt) => {
              const submittedAt = attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })
                : "In progress"

              const hasPending = attempt.answers?.some(
                (a) => a.question?.type === "text" && a.points_earned == null,
              )

              return (
                <Link
                  key={attempt.id}
                  to={`/admin/quiz-management/quizzes/${quiz.id}/attempts/${attempt.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/2 px-4 py-3.5 transition-colors hover:bg-white/4"
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
                        {attempt.score}{attempt.total_points != null ? `/${attempt.total_points}` : ""} pts
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
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50" />
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
