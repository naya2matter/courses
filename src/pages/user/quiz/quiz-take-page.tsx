import { useCallback, useEffect, useReducer, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  Loader2Icon,
  SendIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  SquareCheckIcon,
  TextIcon,
  ListChecksIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { isApiError } from "@/lib/api"

import { getUserQuizById, submitQuizAnswers } from "./service/user-quiz.service"
import type { UserQuizDetail, UserQuizQuestion } from "./types/user-quiz.types"

// ── Types ─────────────────────────────────────────────────────────────────────

type AnswerMap = Record<number, string | string[]>

interface QuizState {
  answers: AnswerMap
  currentIndex: number
}

type QuizAction =
  | { type: "SET_RADIO"; questionId: number; value: string }
  | { type: "TOGGLE_CHECKBOX"; questionId: number; option: string }
  | { type: "SET_TEXT"; questionId: number; value: string }
  | { type: "GO_TO"; index: number }

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SET_RADIO":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      }
    case "TOGGLE_CHECKBOX": {
      const current = (state.answers[action.questionId] as string[]) ?? []
      const exists = current.includes(action.option)
      const next = exists
        ? current.filter((o) => o !== action.option)
        : [...current, action.option]
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: next },
      }
    }
    case "SET_TEXT":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
      }
    case "GO_TO":
      return { ...state, currentIndex: action.index }
    default:
      return state
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAnswered(q: UserQuizQuestion, answers: AnswerMap): boolean {
  const a = answers[q.id]
  if (q.type === "checkbox") return Array.isArray(a) && a.length > 0
  return typeof a === "string" && a.trim().length > 0
}

const Q_ICONS: Record<string, React.ReactNode> = {
  radio: <CircleDotIcon className="size-4 text-indigo-400" />,
  checkbox: <SquareCheckIcon className="size-4 text-violet-400" />,
  text: <TextIcon className="size-4 text-sky-400" />,
}

// ── Radio question ─────────────────────────────────────────────────────────────

function RadioQuestion({
  q,
  value,
  onChange,
}: {
  q: UserQuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
      {(q.options ?? []).map((opt) => (
        <label
          key={opt}
          className={`
            flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all
            ${value === opt
              ? "border-indigo-500/50 bg-indigo-500/10"
              : "border-white/8 bg-white/2 hover:border-white/16 hover:bg-white/4"
            }
          `}
        >
          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="shrink-0" />
          <span className="text-sm text-white/80 leading-snug">{opt}</span>
        </label>
      ))}
    </RadioGroup>
  )
}

// ── Checkbox question ──────────────────────────────────────────────────────────

function CheckboxQuestion({
  q,
  values,
  onToggle,
}: {
  q: UserQuizQuestion
  values: string[]
  onToggle: (opt: string) => void
}) {
  return (
    <div className="space-y-3">
      {(q.options ?? []).map((opt) => {
        const checked = values.includes(opt)
        return (
          <label
            key={opt}
            className={`
              flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all
              ${checked
                ? "border-violet-500/50 bg-violet-500/10"
                : "border-white/8 bg-white/2 hover:border-white/16 hover:bg-white/4"
              }
            `}
          >
            <Checkbox
              id={`${q.id}-${opt}`}
              checked={checked}
              onCheckedChange={() => onToggle(opt)}
              className="shrink-0"
            />
            <span className="text-sm text-white/80 leading-snug">{opt}</span>
          </label>
        )
      })}
    </div>
  )
}

// ── Text question ──────────────────────────────────────────────────────────────

function TextQuestion({
  value,
  onChange,
}: {
  q?: UserQuizQuestion
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">Your answer</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
        rows={5}
        className="bg-white/3 border-white/10 text-white/80 placeholder:text-white/25 focus:border-indigo-500/50 resize-none rounded-xl"
      />
      <p className="text-[11px] text-white/25 text-right">
        {value.trim().length} char{value.trim().length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

// ── Progress nav dots ─────────────────────────────────────────────────────────

function ProgressNav({
  questions,
  currentIndex,
  answers,
  onJump,
}: {
  questions: UserQuizQuestion[]
  currentIndex: number
  answers: AnswerMap
  onJump: (i: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => {
        const answered = isAnswered(q, answers)
        const isCurrent = i === currentIndex
        return (
          <button
            key={q.id}
            onClick={() => onJump(i)}
            title={`Question ${i + 1}`}
            className={`
              flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all
              ${isCurrent
                ? "bg-indigo-600 text-white ring-2 ring-indigo-500/50"
                : answered
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-white/6 text-white/40 border border-white/10 hover:border-white/25"
              }
            `}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TakeSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-64 rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="size-8 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

// ── Timer ─────────────────────────────────────────────────────────────────────

function QuizTimer({ minutes }: { minutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  const isWarning = secondsLeft < 120

  return (
    <div
      className={`
        flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums
        ${isWarning
          ? "border-red-500/40 bg-red-500/10 text-red-400"
          : "border-white/10 bg-white/5 text-white/70"
        }
      `}
    >
      <ClockIcon className="size-4 shrink-0" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function QuizTakePage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>()
  const navigate = useNavigate()
  const quizId = Number(id)
  const parsedAttemptId = Number(attemptId)

  const [quiz, setQuiz] = useState<UserQuizDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [state, dispatch] = useReducer(quizReducer, {
    answers: {},
    currentIndex: 0,
  })

  const fetchQuiz = useCallback(async () => {
    if (isNaN(quizId)) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getUserQuizById(quizId)
      setQuiz(res.data)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setLoadError(err.message || "Failed to load quiz.")
      } else if (err instanceof Error) {
        setLoadError(err.message)
      } else {
        setLoadError("Failed to load quiz.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    fetchQuiz()
  }, [fetchQuiz])

  const questions: UserQuizQuestion[] = quiz?.questions ?? []
  const currentQ = questions[state.currentIndex]
  const answeredCount = questions.filter((q) => isAnswered(q, state.answers)).length
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  const handleSubmit = async () => {
    if (!quiz) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const answers = questions
        .map((q) => {
          const a = state.answers[q.id]
          if (q.type === "checkbox") {
            const arr = Array.isArray(a) ? a : []
            if (arr.length === 0) return null
            return { quiz_question_id: q.id, answer: JSON.stringify(arr) }
          }
          const str = typeof a === "string" ? a.trim() : ""
          if (!str) return null
          return { quiz_question_id: q.id, answer: str }
        })
        .filter(Boolean) as { quiz_question_id: number; answer: string }[]

      const attempt = await submitQuizAnswers(quiz.id, parsedAttemptId, { answers })
      navigate(`/user/quizzes/${quiz.id}/result/${attempt.id}`)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setSubmitError(err.message || "Failed to submit quiz.")
      } else if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError("Failed to submit quiz.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFirst = state.currentIndex === 0
  const isLast = state.currentIndex === questions.length - 1

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/user/quizzes/${quizId}`)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white -ml-2"
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <span className="text-white/20 hidden sm:block">/</span>
          <span className="text-sm text-white/60 font-medium hidden sm:block truncate max-w-xs">
            {isLoading ? "Loading…" : quiz?.title}
          </span>
        </div>
        {quiz?.time_limit_minutes && (
          <QuizTimer minutes={quiz.time_limit_minutes} />
        )}
      </div>

      {/* Load error */}
      {loadError && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to Load Quiz</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && <TakeSkeleton />}

      {/* Quiz UI */}
      {!isLoading && !loadError && quiz && questions.length > 0 && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[12px] text-white/40">
              <span className="flex items-center gap-1.5 font-medium">
                <ListChecksIcon className="size-3.5" />
                {answeredCount} of {questions.length} answered
              </span>
              <span className="font-semibold tabular-nums">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/6 overflow-hidden">
              <div
                className="h-2 rounded-full bg-linear-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Question navigator */}
          <ProgressNav
            questions={questions}
            currentIndex={state.currentIndex}
            answers={state.answers}
            onJump={(i) => dispatch({ type: "GO_TO", index: i })}
          />

          {/* Current question */}
          {currentQ && (
            <Card className="rounded-2xl border-white/8 bg-white/2.5">
              <CardContent className="space-y-6 pt-6 pb-6">
                {/* Question header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[11px] font-semibold border-white/10 text-white/40 bg-white/4 rounded-lg"
                    >
                      Question {state.currentIndex + 1} of {questions.length}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-[11px] text-white/35 font-medium">
                      {Q_ICONS[currentQ.type]}
                      {currentQ.type === "radio"
                        ? "Single choice"
                        : currentQ.type === "checkbox"
                          ? "Multiple choice"
                          : "Open answer"}
                    </span>
                    {currentQ.points != null && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold border-amber-500/20 text-amber-400 bg-amber-500/8 rounded-lg"
                      >
                        {currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base sm:text-[17px] font-semibold text-white leading-relaxed">
                    {currentQ.question_text}
                  </h2>
                </div>

                {/* Answer input */}
                {currentQ.type === "radio" && (
                  <RadioQuestion
                    q={currentQ}
                    value={(state.answers[currentQ.id] as string) ?? ""}
                    onChange={(v) =>
                      dispatch({ type: "SET_RADIO", questionId: currentQ.id, value: v })
                    }
                  />
                )}
                {currentQ.type === "checkbox" && (
                  <CheckboxQuestion
                    q={currentQ}
                    values={(state.answers[currentQ.id] as string[]) ?? []}
                    onToggle={(opt) =>
                      dispatch({
                        type: "TOGGLE_CHECKBOX",
                        questionId: currentQ.id,
                        option: opt,
                      })
                    }
                  />
                )}
                {currentQ.type === "text" && (
                  <TextQuestion
                    q={currentQ}
                    value={(state.answers[currentQ.id] as string) ?? ""}
                    onChange={(v) =>
                      dispatch({ type: "SET_TEXT", questionId: currentQ.id, value: v })
                    }
                  />
                )}

                {/* Answered indicator */}
                {isAnswered(currentQ, state.answers) && (
                  <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs font-semibold text-emerald-400">
                    <CheckCircle2Icon className="size-3.5" />
                    Answer recorded
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "GO_TO", index: state.currentIndex - 1 })}
              disabled={isFirst}
              className="flex items-center gap-2 border-white/10 text-white/55 hover:text-white hover:border-white/20 bg-transparent rounded-xl"
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white border-0 px-8 rounded-xl shadow-md shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <SendIcon className="size-4" />
                    Submit Quiz
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => dispatch({ type: "GO_TO", index: state.currentIndex + 1 })}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border-0 rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all"
              >
                Next
                <ChevronRightIcon className="size-4" />
              </Button>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>Submission Failed</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* Unanswered warning on last question */}
          {isLast && answeredCount < questions.length && (
            <Alert className="border-amber-500/30 bg-amber-500/8">
              <AlertCircleIcon className="size-4 text-amber-400" />
              <AlertTitle className="text-amber-400">Unanswered Questions</AlertTitle>
              <AlertDescription className="text-amber-300/70">
                You have {questions.length - answeredCount} unanswered question
                {questions.length - answeredCount !== 1 ? "s" : ""}. You can still submit,
                but unanswered questions will receive no points.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* No questions */}
      {!isLoading && !loadError && quiz && questions.length === 0 && (
        <Alert className="border-amber-500/30 bg-amber-500/8">
          <AlertCircleIcon className="size-4 text-amber-400" />
          <AlertTitle className="text-amber-400">No Questions</AlertTitle>
          <AlertDescription className="text-amber-300/70">
            This quiz has no questions yet. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
