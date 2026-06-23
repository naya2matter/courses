// ─── Edit Quiz Page ───────────────────────────────────────────────────────────
// Loads an existing quiz, lets admin update metadata AND manage questions.

import { useEffect, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
  ArrowLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  CheckSquareIcon,
  CircleDotIcon,
  TypeIcon,
  CheckCircle2Icon,
  XIcon,
  SaveIcon,
  XCircleIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  LightbulbIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateTimePickerField } from "@/components/ui/date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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

import { isApiError } from "@/lib/api"
import {
  getQuizById,
  updateQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../service/quiz.service"
import { getAllCourses } from "@/pages/admin/course-management/live-courses/service/course.service"
import type { CourseResource } from "@/pages/admin/course-management/live-courses/types/course.types"
import { getOnlineCourses, getOnlineCourseById } from "@/pages/admin/course-management/online-courses/service/online-course.service"
import type { OnlineCourse, OnlineCourseModule } from "@/pages/admin/course-management/online-courses/types/online-course.types"
import type {
  CreateQuizPayload,
  QuizStatus,
  ShowCorrectAnswers,
  QuizQuestion,
  QuestionType,
} from "../types/quiz.types"

// ── Error helper ──────────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
      if (err.data.message) return err.data.message
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    if (err.status === 404) return "Quiz not found."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function EditQuizSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/2 p-6 space-y-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/2 p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ── Question type constants ───────────────────────────────────────────────────

const TYPE_ICONS: Record<QuestionType, React.ReactNode> = {
  radio: <CircleDotIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />,
  checkbox: <CheckSquareIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" />,
  text: <TypeIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />,
}

const TYPE_LABELS: Record<QuestionType, string> = {
  radio: "Single choice (radio)",
  checkbox: "Multiple choice (checkbox)",
  text: "Open-ended (text)",
}

// ── Normalizers (backend sometimes returns options/correct_answer as JSON string) ──

function normalizeStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {}
    return raw.trim() ? [raw] : []
  }
  return []
}

// ── Question form state ───────────────────────────────────────────────────────

interface QuestionFormData {
  question_text: string
  type: QuestionType
  points: string
  options: string[]
  correct_answer: string[]
  correct_answer_explanation: string
  order: string
}

function emptyQuestionForm(nextOrder: number): QuestionFormData {
  return {
    question_text: "",
    type: "radio",
    points: "10",
    options: ["", ""],
    correct_answer: [],
    correct_answer_explanation: "",
    order: String(nextOrder),
  }
}

function questionToFormData(q: QuizQuestion): QuestionFormData {
  return {
    question_text: q.question_text,
    type: q.type,
    points: q.points != null ? String(q.points) : "",
    options: q.options?.length ? [...q.options] : ["", ""],
    correct_answer: q.correct_answer ? [...q.correct_answer] : [],
    correct_answer_explanation: q.correct_answer_explanation ?? "",
    order: q.order != null ? String(q.order) : "",
  }
}

// ── Inline question form ──────────────────────────────────────────────────────

interface QuestionInlineFormProps {
  data: QuestionFormData
  onChange: (data: QuestionFormData) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  error: string | null
  title: string
}

function QuestionInlineForm({
  data,
  onChange,
  onSave,
  onCancel,
  isSaving,
  error,
  title,
}: QuestionInlineFormProps) {
  const needsOptions = data.type === "radio" || data.type === "checkbox"

  function update<K extends keyof QuestionFormData>(key: K, value: QuestionFormData[K]) {
    onChange({ ...data, [key]: value })
  }

  function handleTypeChange(type: QuestionType) {
    onChange({
      ...data,
      type,
      options: type !== "text" ? (data.options.length ? data.options : ["", ""]) : [],
      correct_answer: [],
    })
  }

  function handleOptionText(idx: number, value: string) {
    const opts = [...data.options]
    opts[idx] = value
    onChange({ ...data, options: opts })
  }

  function handleCorrectToggle(idx: number, checked: boolean) {
    const optText = data.options[idx]
    if (!optText.trim()) return
    let answers = [...data.correct_answer]
    if (data.type === "radio") {
      answers = checked ? [optText] : []
    } else {
      if (checked) {
        if (!answers.includes(optText)) answers.push(optText)
      } else {
        answers = answers.filter((a) => a !== optText)
      }
    }
    onChange({ ...data, correct_answer: answers })
  }

  function addOption() {
    onChange({ ...data, options: [...data.options, ""] })
  }

  function removeOption(idx: number) {
    const removed = data.options[idx]
    const opts = data.options.filter((_, i) => i !== idx)
    const correct = data.correct_answer.filter((a) => a !== removed)
    onChange({ ...data, options: opts, correct_answer: correct })
  }

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-4">
      <p className="text-sm font-semibold text-indigo-300">{title}</p>

      {error && (
        <Alert variant="destructive" className="py-2.5">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {/* Question text */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Question text *</Label>
        <Textarea
          value={data.question_text}
          onChange={(e) => update("question_text", e.target.value)}
          placeholder="Enter the question…"
          disabled={isSaving}
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      {/* Type + Points + Order */}
      <div className={`grid gap-4 ${
        data.type === "text" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
      }`}>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Type *</Label>
          <Select
            value={data.type}
            onValueChange={(v) => handleTypeChange(v as QuestionType)}
            disabled={isSaving}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["radio", "checkbox", "text"] as QuestionType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  <span className="flex items-center gap-2">
                    {TYPE_ICONS[t]}
                    {TYPE_LABELS[t]}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.type !== "text" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Points *</Label>
            <Input
              type="number"
              min={0}
              value={data.points}
              onChange={(e) => update("points", e.target.value)}
              placeholder="e.g. 10"
              disabled={isSaving}
              className="h-9 text-sm"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Order (optional)</Label>
          <Input
            type="number"
            min={0}
            value={data.order}
            onChange={(e) => update("order", e.target.value)}
            placeholder="e.g. 1"
            disabled={isSaving}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {data.type === "text" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <span className="mt-0.5 text-amber-400">&#9432;</span>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            <span className="font-semibold text-amber-400">Manual grading.</span>{" "}
            The admin will review this answer and assign points after the user submits.
          </p>
        </div>
      )}

      {/* Options (radio / checkbox) */}
      {needsOptions && (
        <div className="space-y-2.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Options — tick the correct answer(s)
          </Label>
          <div className="space-y-2">
            {data.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Checkbox
                  checked={data.correct_answer.includes(opt) && opt.trim() !== ""}
                  onCheckedChange={(checked) => handleCorrectToggle(idx, Boolean(checked))}
                  disabled={isSaving}
                  aria-label={`Mark option ${idx + 1} as correct`}
                  className="shrink-0"
                />
                <Input
                  value={opt}
                  onChange={(e) => handleOptionText(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  disabled={isSaving}
                  className="h-8 text-sm"
                />
                {data.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(idx)}
                    disabled={isSaving}
                    aria-label="Remove option"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={addOption}
            disabled={isSaving}
          >
            <PlusIcon className="h-3 w-3" />
            Add option
          </Button>
        </div>
      )}

      {/* Explanation */}
      {needsOptions && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Correct answer explanation (optional)
          </Label>
          <Textarea
            value={data.correct_answer_explanation}
            onChange={(e) => update("correct_answer_explanation", e.target.value)}
            placeholder="Explain why the answer is correct…"
            disabled={isSaving}
            rows={2}
            className="resize-none text-sm"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
        <Button type="button" size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
          {isSaving ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SaveIcon className="h-3.5 w-3.5" />
          )}
          {isSaving ? "Saving…" : "Save question"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="gap-1.5"
        >
          <XCircleIcon className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

// ── Question view card ────────────────────────────────────────────────────────

interface QuestionViewCardProps {
  question: QuizQuestion
  index: number
  dimmed?: boolean
  onEdit: () => void
  onDelete: () => void
}

function QuestionViewCard({ question, index, dimmed, onEdit, onDelete }: QuestionViewCardProps) {
  const type = question.type as QuestionType
  const options = normalizeStringArray(question.options)
  const correctAnswers = normalizeStringArray(question.correct_answer)
  const hasOptions = options.length > 0
  const correctSet = new Set(correctAnswers)

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-opacity ${
        dimmed ? "border-white/5 opacity-40 pointer-events-none" : "border-white/10"
      }`}
    >
      {/* Card top stripe — admin correct-answer indicator */}
      {!dimmed && hasOptions && correctAnswers.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-emerald-500/20 bg-emerald-500/8 px-5 py-1.5">
          <ShieldCheckIcon className="h-3 w-3 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            Admin view — correct answer highlighted
          </span>
        </div>
      )}

      <div className="bg-white/2 p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            {TYPE_ICONS[type] ?? <BookOpenIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-xs text-muted-foreground">Q{index + 1}</span>
                <span className="inline-flex items-center rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {TYPE_LABELS[type] ?? type}
                </span>
                {question.points != null ? (
                  <span className="inline-flex items-center rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400">
                    {question.points} pt{question.points !== 1 ? "s" : ""}
                  </span>
                ) : type === "text" ? (
                  <span className="inline-flex items-center rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                    Manual grading
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>
            </div>
          </div>

          {/* Edit / Delete */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
              aria-label="Edit question"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
              aria-label="Delete question"
            >
              <Trash2Icon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Options */}
        {hasOptions && (
          <ul className="space-y-1.5 pl-7">
            {options.map((opt, i) => {
              const isCorrect = correctSet.has(opt)
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                    isCorrect
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                      : "border border-white/5 bg-white/2 text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <XIcon className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                    {opt}
                  </span>
                  {isCorrect && (
                    <span className="shrink-0 rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                      Correct
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {/* Explanation */}
        {question.correct_answer_explanation && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 pl-7 pr-3 py-2.5">
            <LightbulbIcon className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 italic leading-relaxed">
              {question.correct_answer_explanation}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export function EditQuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  type CourseTarget = "none" | "online" | "live"

  // ── Load state ─────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // ── Quiz metadata form ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<QuizStatus>("draft")
  const [passThreshold, setPassThreshold] = useState<string>("70")
  const [maxAttempts, setMaxAttempts] = useState<string>("")
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("")
  const [retryDelayHours, setRetryDelayHours] = useState<string>("0")
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<ShowCorrectAnswers>("after_pass")
  const [requiredToProceed, setRequiredToProceed] = useState(false)
  const [deadline, setDeadline] = useState("")
  const [courseTarget, setCourseTarget] = useState<CourseTarget>("none")
  const [courseId, setCourseId] = useState<string>("none")
  const [liveCourses, setLiveCourses] = useState<CourseResource[]>([])
  const [liveCoursesLoading, setLiveCoursesLoading] = useState(false)
  const [courseOnlineId, setCourseOnlineId] = useState<string>("none")
  const [onlineCourses, setOnlineCourses] = useState<OnlineCourse[]>([])
  const [onlineCoursesLoading, setOnlineCoursesLoading] = useState(false)
  const [moduleId, setModuleId] = useState<string>("none")
  const [quizModules, setQuizModules] = useState<OnlineCourseModule[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Questions state ────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuizQuestion[]>([])

  // Adding a new question
  const [addingNew, setAddingNew] = useState(false)
  const [newForm, setNewForm] = useState<QuestionFormData>(emptyQuestionForm(1))
  const [isSavingNew, setIsSavingNew] = useState(false)
  const [newFormError, setNewFormError] = useState<string | null>(null)

  // Editing an existing question
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<QuestionFormData | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editFormError, setEditFormError] = useState<string | null>(null)

  // Deleting a question
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ── Fetch quiz + online courses on mount ──────────────────────────────────
  useEffect(() => {
    if (!id) return
    let active = true
    setIsLoading(true)
    setLoadError(null)
    setLiveCoursesLoading(true)
    setOnlineCoursesLoading(true)

    async function load() {
      try {
        const [quiz, liveCoursesResult, onlineCoursesResult] = await Promise.all([
          getQuizById(Number(id!)),
          getAllCourses({ per_page: 200 }),
          getOnlineCourses({ per_page: 200 }),
        ])

        if (!active) return

        setTitle(quiz.title ?? "")
        setDescription(quiz.description ?? "")
        setStatus((quiz.status ?? "draft") as QuizStatus)
        setPassThreshold(quiz.pass_threshold != null ? String(quiz.pass_threshold) : "70")
        setMaxAttempts(quiz.max_attempts != null ? String(quiz.max_attempts) : "")
        setTimeLimitMinutes(quiz.time_limit_minutes != null ? String(quiz.time_limit_minutes) : "")
        setRetryDelayHours(quiz.retry_delay_hours != null ? String(quiz.retry_delay_hours) : "0")
        setShowCorrectAnswers((quiz.show_correct_answers ?? "after_pass") as ShowCorrectAnswers)
        setRequiredToProceed(quiz.required_to_proceed ?? false)
        setCourseTarget(
          quiz.course_online_id != null
            ? "online"
            : quiz.course_id != null
              ? "live"
              : "none",
        )
        setCourseId(quiz.course_id != null ? String(quiz.course_id) : "none")
        setCourseOnlineId(quiz.course_online_id != null ? String(quiz.course_online_id) : "none")
        setModuleId(quiz.module_id != null ? String(quiz.module_id) : "none")

        if (quiz.deadline) {
          const dt = new Date(quiz.deadline)
          const pad = (n: number) => String(n).padStart(2, "0")
          setDeadline(
            `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
          )
        }

        setQuestions(quiz.questions ?? [])
        setNewForm(emptyQuestionForm((quiz.questions?.length ?? 0) + 1))
        setLiveCourses(liveCoursesResult.data)
        setOnlineCourses(onlineCoursesResult.data)

        if (quiz.course_online_id != null) {
          try {
            const detail = await getOnlineCourseById(quiz.course_online_id)
            if (!active) return
            setQuizModules(detail.modules.filter((m) => m.has_quiz && m.quiz_required))
          } catch {
            if (!active) return
            setQuizModules([])
          }
        }
      } catch (err) {
        if (!active) return
        if (err instanceof DOMException && err.name === "AbortError") return
        setLoadError(extractError(err))
      } finally {
        if (!active) return
        setIsLoading(false)
        setLiveCoursesLoading(false)
        setOnlineCoursesLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id])

  async function fetchModulesForCourse(courseId: number) {
    setModulesLoading(true)
    setQuizModules([])
    try {
      const detail = await getOnlineCourseById(courseId)
      setQuizModules(detail.modules.filter((m) => m.has_quiz && m.quiz_required))
    } catch {
      setQuizModules([])
    } finally {
      setModulesLoading(false)
    }
  }

  // ── Quiz metadata submit ───────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!title.trim()) {
      setSubmitError("Title is required.")
      return
    }

    const payload: Partial<CreateQuizPayload> = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      pass_threshold: passThreshold !== "" ? Number(passThreshold) : undefined,
      max_attempts: maxAttempts !== "" ? Number(maxAttempts) : null,
      time_limit_minutes: timeLimitMinutes !== "" ? Number(timeLimitMinutes) : null,
      retry_delay_hours: retryDelayHours !== "" ? Number(retryDelayHours) : null,
      show_correct_answers: showCorrectAnswers,
      required_to_proceed: requiredToProceed,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      course_id: courseTarget === "live" && courseId !== "none" ? Number(courseId) : null,
      course_online_id:
        courseTarget === "online" && courseOnlineId !== "none" ? Number(courseOnlineId) : null,
      module_id: courseTarget === "online" && moduleId !== "none" ? Number(moduleId) : null,
    }

    if (courseTarget === "online" && moduleId !== "none") {
      payload.course_online_id = null
    }

    setIsSubmitting(true)
    try {
      await updateQuiz(Number(id), payload)
      toast.success("Quiz updated successfully!")
      navigate(`/admin/quiz-management/quizzes/${id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setSubmitError(extractError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Question payload builder ───────────────────────────────────────────────

  function buildQuestionPayload(form: QuestionFormData) {
    const needsOptions = form.type === "radio" || form.type === "checkbox"
    const isText = form.type === "text"
    return {
      question_text: form.question_text.trim(),
      type: form.type,
      // Text questions are always manually graded — no points
      points: isText ? null : (form.points !== "" ? Number(form.points) : null),
      order: form.order !== "" ? Number(form.order) : undefined,
      options: needsOptions ? form.options.filter((o) => o.trim() !== "") : undefined,
      correct_answer: needsOptions
        ? form.correct_answer.filter((a) => a.trim() !== "")
        : undefined,
      correct_answer_explanation:
        needsOptions && form.correct_answer_explanation.trim()
          ? form.correct_answer_explanation.trim()
          : null,
    }
  }

  // ── Add new question ───────────────────────────────────────────────────────

  function handleOpenAddForm() {
    setAddingNew(true)
    setNewForm(emptyQuestionForm(questions.length + 1))
    setNewFormError(null)
    setEditingId(null)
    setEditForm(null)
  }

  async function handleSaveNewQuestion() {
    if (!newForm.question_text.trim()) {
      setNewFormError("Question text is required.")
      return
    }
    setNewFormError(null)
    setIsSavingNew(true)
    try {
      const created = await createQuestion(Number(id), buildQuestionPayload(newForm))
      setQuestions((prev) => [...prev, created])
      setAddingNew(false)
      setNewForm(emptyQuestionForm(questions.length + 2))
      toast.success("Question added.")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setNewFormError(extractError(err))
    } finally {
      setIsSavingNew(false)
    }
  }

  // ── Edit existing question ─────────────────────────────────────────────────

  function handleOpenEdit(question: QuizQuestion) {
    setEditingId(question.id!)
    setEditForm(questionToFormData(question))
    setEditFormError(null)
    setAddingNew(false)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setEditForm(null)
    setEditFormError(null)
  }

  async function handleSaveEdit() {
    if (!editForm || editingId == null) return
    if (!editForm.question_text.trim()) {
      setEditFormError("Question text is required.")
      return
    }
    setEditFormError(null)
    setIsSavingEdit(true)
    try {
      const updated = await updateQuestion(Number(id), editingId, buildQuestionPayload(editForm))
      setQuestions((prev) => prev.map((q) => (q.id === editingId ? updated : q)))
      setEditingId(null)
      setEditForm(null)
      toast.success("Question updated.")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setEditFormError(extractError(err))
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ── Delete question ────────────────────────────────────────────────────────

  async function handleConfirmDelete() {
    if (deletingId == null) return
    setIsDeleting(true)
    try {
      await deleteQuestion(Number(id), deletingId)
      setQuestions((prev) => prev.filter((q) => q.id !== deletingId))
      if (editingId === deletingId) {
        setEditingId(null)
        setEditForm(null)
      }
      toast.success("Question deleted.")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      toast.error(extractError(err))
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) return <EditQuizSkeleton />

  if (loadError) {
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
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const anyQuestionBusy = isSavingNew || isSavingEdit || isDeleting

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link to={`/admin/quiz-management/quizzes/${id}`}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PencilIcon className="h-5 w-5 text-indigo-400" />
            Edit Quiz
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update quiz details and manage questions below.
          </p>
        </div>
      </div>

      {/* ── Submit error ────────────────────────────────────────────────────── */}
      {submitError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* ── Quiz Details form ───────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-xl border border-white/10 bg-white/2 p-6 space-y-5">
          <h2 className="text-base font-semibold">Quiz Details</h2>

          <Field label="Title *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PHP Fundamentals Quiz"
              disabled={isSubmitting}
              className="h-10"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this quiz…"
              disabled={isSubmitting}
              rows={3}
              className="resize-none"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Status">
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as QuizStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Show correct answers">
              <Select
                value={showCorrectAnswers}
                onValueChange={(v) => setShowCorrectAnswers(v as ShowCorrectAnswers)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="after_pass">After passing</SelectItem>
                  <SelectItem value="after_max_attempts">After all attempts used</SelectItem>
                  <SelectItem value="always">Always</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Pass threshold (%)" hint="0–100">
              <Input
                type="number"
                min={0}
                max={100}
                value={passThreshold}
                onChange={(e) => setPassThreshold(e.target.value)}
                placeholder="e.g. 70"
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>

            <Field label="Time limit (minutes)" hint="Leave blank for no limit">
              <Input
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                placeholder="e.g. 30"
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Max attempts" hint="Leave blank for unlimited">
              <Input
                type="number"
                min={1}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="e.g. 3"
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>

            <Field label="Retry delay (hours)" hint="Hours to wait between failed attempts">
              <Input
                type="number"
                min={0}
                value={retryDelayHours}
                onChange={(e) => setRetryDelayHours(e.target.value)}
                placeholder="e.g. 24"
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Deadline" hint="Optional">
              <DateTimePickerField
                value={deadline}
                onChange={setDeadline}
                placeholder="Pick deadline"
                disabled={isSubmitting}
              />
            </Field>

            <Field label="Quiz For" hint="Choose whether this quiz is for an online or live course">
              <Select
                value={courseTarget}
                onValueChange={(value) => {
                  const next = value as CourseTarget
                  setCourseTarget(next)
                  setCourseId("none")
                  setCourseOnlineId("none")
                  setModuleId("none")
                  setQuizModules([])
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder="Select course type"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  <SelectItem value="online">Online course</SelectItem>
                  <SelectItem value="live">Live course</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {courseTarget === "live" && (
            <Field label="Live Course" hint="Select the live course name">
              <Select
                value={courseId}
                onValueChange={(value) => setCourseId(value)}
                disabled={isSubmitting || liveCoursesLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={liveCoursesLoading ? "Loading courses…" : "Select a live course"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {liveCourses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {courseTarget === "online" && (
            <Field label="Online Course" hint="Select the online course name">
              <Select
                value={courseOnlineId}
                onValueChange={(value) => {
                  setCourseOnlineId(value)
                  setModuleId("none")
                  if (value && value !== "none") {
                    fetchModulesForCourse(Number(value))
                  } else {
                    setQuizModules([])
                  }
                }}
                disabled={isSubmitting || onlineCoursesLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue
                    placeholder={onlineCoursesLoading ? "Loading courses…" : "Select an online course"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {onlineCourses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {/* Module (appears once an online course is selected) */}
          {courseTarget === "online" && courseOnlineId !== "none" && (
            <Field label="Module" hint="Only modules with quiz enabled are shown">
              <Select
                value={moduleId}
                onValueChange={(value) => setModuleId(value)}
                disabled={isSubmitting || modulesLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={modulesLoading ? "Loading modules…" : "Select a module"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No module</SelectItem>
                  {quizModules.map((mod) => (
                    <SelectItem key={mod.id} value={String(mod.id)}>
                      {mod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!modulesLoading && quizModules.length === 0 && (
                <p className="text-xs text-amber-400/80 mt-1">
                  No quiz-enabled modules found in this course.
                </p>
              )}
            </Field>
          )}

          <div className="flex items-center gap-3">
            <Checkbox
              id="required_to_proceed"
              checked={requiredToProceed}
              onCheckedChange={(checked) => setRequiredToProceed(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="required_to_proceed" className="cursor-pointer text-sm font-normal">
              Required to proceed — users must pass this quiz to advance
            </Label>
          </div>
        </section>

        <Separator />

        {/* ── Questions section ───────────────────────────────────────────────── */}
        <section className="space-y-4">
        {/* Section header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Questions</h2>
            <Badge variant="secondary" className="text-xs">
              {questions.length}
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleOpenAddForm}
            disabled={addingNew || anyQuestionBusy}
          >
            <PlusIcon className="h-4 w-4" />
            Add question
          </Button>
        </div>

        {/* Empty state */}
        {questions.length === 0 && !addingNew && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/2 py-12 px-6 flex flex-col items-center gap-3 text-center">
            <BookOpenIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No questions yet.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 mt-1"
              onClick={handleOpenAddForm}
            >
              <PlusIcon className="h-4 w-4" />
              Add first question
            </Button>
          </div>
        )}

        {/* Question list */}
        <div className="space-y-3">
          {questions.map((q, idx) =>
            editingId === q.id && editForm ? (
              <QuestionInlineForm
                key={q.id}
                title={`Edit Question ${idx + 1}`}
                data={editForm}
                onChange={setEditForm}
                onSave={handleSaveEdit}
                onCancel={handleCancelEdit}
                isSaving={isSavingEdit}
                error={editFormError}
              />
            ) : (
              <QuestionViewCard
                key={q.id}
                question={q}
                index={idx}
                dimmed={editingId != null && editingId !== q.id}
                onEdit={() => handleOpenEdit(q)}
                onDelete={() => setDeletingId(q.id!)}
              />
            ),
          )}

          {/* New question form */}
          {addingNew && (
            <QuestionInlineForm
              title="New Question"
              data={newForm}
              onChange={setNewForm}
              onSave={handleSaveNewQuestion}
              onCancel={() => {
                setAddingNew(false)
                setNewFormError(null)
              }}
              isSaving={isSavingNew}
              error={newFormError}
            />
          )}
        </div>
      </section>

      <Separator />

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        <Button asChild variant="outline" disabled={isSubmitting}>
          <Link to={`/admin/quiz-management/quizzes/${id}`}>Cancel</Link>
        </Button>
      </div>
    </form>

      {/* ── Delete confirmation dialog ──────────────────────────────────────── */}
      <AlertDialog
        open={deletingId != null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeletingId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the question from the quiz. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {isDeleting && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
