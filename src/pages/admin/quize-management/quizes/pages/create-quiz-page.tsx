// ─── Create Quiz Page ─────────────────────────────────────────────────────────
// Form for creating a new quiz with optional inline questions.

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  ArrowLeftIcon,
  Loader2Icon,
  AlertCircleIcon,
  ClipboardPlusIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

import { isApiError } from "@/lib/api"
import { createQuiz } from "../service/quiz.service"
import { QuestionBuilder } from "../components/question-builder"
import { getAllCourses } from "@/pages/admin/course-management/live-courses/service/course.service"
import type { CourseResource } from "@/pages/admin/course-management/live-courses/types/course.types"
import type { CreateQuizPayload, CreateQuizQuestion, QuizStatus, ShowCorrectAnswers } from "../types/quiz.types"

// ── Error helpers ─────────────────────────────────────────────────────────────

function extractError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
      if (err.data.message) return err.data.message
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── Field component helpers ───────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CreateQuizPage() {
  const navigate = useNavigate()

  // ── Form state ─────────────────────────────────────────────────────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<QuizStatus>("draft")
  const [passThreshold, setPassThreshold] = useState<string>("70")
  const [maxAttempts, setMaxAttempts] = useState<string>("3")
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("")
  const [retryDelayHours, setRetryDelayHours] = useState<string>("0")
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<ShowCorrectAnswers>("after_pass")
  const [requiredToProceed, setRequiredToProceed] = useState(false)
  const [deadline, setDeadline] = useState("")
  const [courseId, setCourseId] = useState<string>("")
  const [courses, setCourses] = useState<CourseResource[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [questions, setQuestions] = useState<CreateQuizQuestion[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setCoursesLoading(true)

    getAllCourses({ per_page: 100 })
      .then((result) => {
        if (!active) return
        setCourses(result.data)
      })
      .catch(() => {
        if (!active) return
        setCourses([])
      })
      .finally(() => {
        if (!active) return
        setCoursesLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    const payload: CreateQuizPayload = {
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
      course_id: courseId && courseId !== "none" ? Number(courseId) : null,
      questions: questions.length > 0 ? questions : undefined,
    }

    setIsSubmitting(true)
    try {
      const quiz = await createQuiz(payload)
      toast.success("Quiz created successfully!")
      navigate(`/admin/quiz-management/quizzes/${quiz.id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractError(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link to="/admin/quiz-management/list-quizzes">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardPlusIcon className="h-6 w-6 text-indigo-400" />
            Create Quiz
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Fill in the details below and optionally add questions.
          </p>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Quiz details ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-white/10 bg-white/2 p-6 space-y-5">
          <h2 className="text-base font-semibold">Quiz Details</h2>

          {/* Title */}
          <Field label="Title *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PHP Fundamentals Quiz"
              disabled={isSubmitting}
              className="h-10"
            />
          </Field>

          {/* Description */}
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

          {/* Status + Show correct answers */}
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

          {/* Pass threshold + Time limit */}
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

          {/* Max attempts + Retry delay */}
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

          {/* Deadline + Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Deadline" hint="Optional">
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>

            <Field label="Select a course" hint="Optional — link this quiz to a course by name">
              <Select
                value={courseId}
                onValueChange={(value) => setCourseId(value)}
                disabled={isSubmitting || coursesLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No course</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={String(course.id)}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Required to proceed */}
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

        {/* ── Questions ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Questions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Optional — you can add questions later too.
              </p>
            </div>
            <span className="text-sm text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </span>
          </div>

          <QuestionBuilder
            questions={questions}
            disabled={isSubmitting}
            onChange={setQuestions}
          />
        </section>

        <Separator />

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Creating…" : "Create Quiz"}
          </Button>
          <Button asChild variant="outline" disabled={isSubmitting}>
            <Link to="/admin/quiz-management/list-quizzes">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
