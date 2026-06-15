// ─── User Online Course Detail Page ──────────────────────────────────────────
// Route: /user/online-courses/:id

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  FileTextIcon,
  LockIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  TrophyIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { getMyOnlineCourseById } from "@/services/userOnlineCourse.service"
import type {
  UserCourseContent,
  UserCourseModule,
  UserCourseQuiz,
  UserOnlineCourseDetail,
} from "@/types/user-online-course"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDuration(s: number): string {
  if (s <= 0) return ""
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h > 0) return `${h}h ${rem > 0 ? `${rem}m` : ""}`
  return `${m}m`
}

function toPercent(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getQuizStatusMeta(status: UserCourseModule["quiz_status"]): {
  label: string
  className: string
} {
  switch (status) {
    case "passed":
      return {
        label: "Passed",
        className: "border-emerald-500/25 text-emerald-400",
      }
    case "failed":
      return {
        label: "Retry available",
        className: "border-rose-500/25 text-rose-300",
      }
    default:
      return {
        label: "Not attempted",
        className: "border-amber-500/25 text-amber-400",
      }
  }
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({
  pct,
  colorClass = "from-indigo-500 to-violet-400",
}: {
  pct: number
  colorClass?: string
}) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={`h-full rounded-full bg-linear-to-r ${colorClass} transition-[width] duration-700`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  not_started: { label: "Not Started", cls: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
  in_progress: { label: "In Progress", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
} as const

// ── Content row ───────────────────────────────────────────────────────────────

function ContentRow({
  content,
  onOpen,
}: {
  content: UserCourseContent
  courseId?: number
  onOpen: (contentId: number) => void
}) {
  const isLocked = !content.is_unlocked
  const pct = toPercent(content.progress?.completion_percentage)
  const isCompleted = content.progress?.is_completed ?? false

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
        isLocked
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-white/5"
      }`}
      onClick={() => !isLocked && onOpen(content.id)}
      role={isLocked ? undefined : "button"}
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === "Enter" || e.key === " ")) onOpen(content.id)
      }}
    >
      {/* Icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isCompleted
            ? "bg-emerald-500/15"
            : isLocked
              ? "bg-white/5"
              : "bg-indigo-500/12 group-hover:bg-indigo-500/20"
        }`}
      >
        {isLocked ? (
          <LockIcon className="size-4 text-white/30" />
        ) : isCompleted ? (
          <CheckCircle2Icon className="size-4 text-emerald-400" />
        ) : content.content_type === "video" ? (
          <PlayCircleIcon className="size-4 text-indigo-400" />
        ) : (
          <FileTextIcon className="size-4 text-violet-400" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              isLocked ? "text-white/35" : "text-white/85"
            }`}
          >
            {content.title}
          </span>
          {content.is_required && !isLocked && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-amber-500/25 px-1.5 py-0 text-[9px] font-semibold text-amber-400"
            >
              Required
            </Badge>
          )}
        </div>
        {/* Sub-row */}
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/35">
          <span className="capitalize">{content.content_type}</span>
          {content.duration_seconds > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-2.5" />
              {formatDuration(content.duration_seconds)}
            </span>
          )}
          {!isLocked && pct > 0 && (
            <span className="tabular-nums">
              {pct.toFixed(0)}% done
            </span>
          )}
        </div>
        {/* Progress micro-bar */}
        {!isLocked && pct > 0 && !isCompleted && (
          <div className="mt-1.5 h-0.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-indigo-500/70 transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Open chevron */}
      {!isLocked && (
        <ChevronRightIcon className="size-4 shrink-0 text-white/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white/50" />
      )}
    </div>
  )
}

function QuizRow({
  quiz,
  quizStatus,
  isLocked,
  onOpen,
}: {
  quiz: UserCourseQuiz
  quizStatus: UserCourseModule["quiz_status"]
  isLocked: boolean
  onOpen: (quizId: number) => void
}) {
  const statusMeta = getQuizStatusMeta(quizStatus)
  const isPassed = quizStatus === "passed"

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
        isLocked
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:bg-white/5"
      }`}
      onClick={() => !isLocked && onOpen(quiz.id)}
      role={isLocked ? undefined : "button"}
      tabIndex={isLocked ? -1 : 0}
      onKeyDown={(e) => {
        if (!isLocked && (e.key === "Enter" || e.key === " ")) onOpen(quiz.id)
      }}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isPassed
            ? "bg-emerald-500/15"
            : isLocked
              ? "bg-white/5"
              : "bg-amber-500/12 group-hover:bg-amber-500/20"
        }`}
      >
        {isLocked ? (
          <LockIcon className="size-4 text-white/30" />
        ) : isPassed ? (
          <CheckCircle2Icon className="size-4 text-emerald-400" />
        ) : (
          <TrophyIcon className="size-4 text-amber-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              isLocked ? "text-white/35" : "text-white/85"
            }`}
          >
            {quiz.title}
          </span>
          {!isLocked && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-amber-500/25 px-1.5 py-0 text-[9px] font-semibold text-amber-400"
            >
              Quiz
            </Badge>
          )}
          {quiz.required_to_proceed && !isLocked && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-indigo-500/25 px-1.5 py-0 text-[9px] font-semibold text-indigo-300"
            >
              Required
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-white/35">
          <span>Module quiz</span>
          {quiz.time_limit_minutes != null && quiz.time_limit_minutes > 0 && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-2.5" />
              {quiz.time_limit_minutes}m limit
            </span>
          )}
          {quiz.pass_threshold != null && (
            <span className="tabular-nums">Pass {quiz.pass_threshold}%</span>
          )}
          {!isLocked && (
            <span className={`rounded-full border px-2 py-0.5 font-medium ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          )}
        </div>
      </div>

      {!isLocked && (
        <ChevronRightIcon className="size-4 shrink-0 text-white/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-white/50" />
      )}
    </div>
  )
}

// ── Module accordion item ─────────────────────────────────────────────────────

function ModuleAccordion({
  module,
  defaultOpen,
  onContentOpen,
  onQuizOpen,
  isLast,
}: {
  module: UserCourseModule
  courseId?: number
  defaultOpen: boolean
  onContentOpen: (contentId: number) => void
  onQuizOpen: (quizId: number) => void
  isLast?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const isLocked = !module.is_unlocked
  const hasModuleQuiz = Boolean(module.quiz)
  const quizStatusMeta = hasModuleQuiz ? getQuizStatusMeta(module.quiz_status) : null
  const completedCount = module.content.filter(
    (c) => c.progress?.is_completed,
  ).length
  const totalCount = module.content.length
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="relative flex gap-4 pr-2">
      {/* ── Learning Path Timeline ── */}
      <div className="flex flex-col items-center">
        {/* Connection line (top to bubble) - omit on first item if we wanted, but we'll just run it continuously if spacing needs it. Let's do a top/bottom line */}
        
        {/* 3D Bubble */}
        <div className="relative mt-2">
           <div
            className={`flex h-10 w-10 shrink-0 shadow-lg items-center justify-center rounded-xl text-[13px] font-bold z-10 relative ${
              isLocked
                ? "bg-white/5 text-white/25 ring-1 ring-white/10"
                : module.is_completed
                  ? "bg-emerald-500 text-white ring-2 ring-emerald-500/50 shadow-emerald-500/20"
                  : "bg-linear-to-b from-indigo-500 to-violet-600 text-white ring-2 ring-indigo-500/50 shadow-indigo-500/30"
            }`}
          >
            {isLocked ? (
              <LockIcon className="size-4" />
            ) : module.is_completed ? (
              <CheckCircle2Icon className="size-5" />
            ) : (
              module.order_number
            )}
          </div>
        </div>
        {/* Connection line going down to next item */}
        {!isLast && (
           <div className={`w-0.5 flex-1 mt-2 mb-1 rounded-full ${module.is_completed ? "bg-emerald-500/40" : "bg-white/10"}`} />
        )}
      </div>

      {/* ── Content Box ── */}
      <div
      className={`flex-1 overflow-hidden mb-6 rounded-2xl border transition-all duration-300 ${
        isLocked
          ? "border-white/6 bg-white/2"
          : module.is_completed
            ? "border-emerald-500/20 bg-emerald-500/5"
            : open
              ? "border-indigo-500/40 bg-[#0c0c16] shadow-[0_8px_32px_rgba(99,102,241,0.12)]"
              : "border-white/8 bg-white/3 hover:border-white/15"
      }`}
    >
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        onClick={() => !isLocked && setOpen((o) => !o)}
        disabled={isLocked}
      >
        {/* Title block */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`text-[15px] font-bold tracking-tight ${
                isLocked ? "text-white/35" : "text-white/95"
              }`}
            >
              {module.title}
            </span>
            {module.is_completed && (
              <Badge
                variant="outline"
                className="rounded-full border-emerald-500/25 px-2 py-0 text-[9px] font-semibold text-emerald-400"
              >
                Complete
              </Badge>
            )}
            {module.has_quiz && (
              <Badge
                variant="outline"
                className="rounded-full border-amber-500/25 px-2 py-0 text-[9px] font-semibold text-amber-400"
              >
                Quiz
              </Badge>
            )}
            {quizStatusMeta && !isLocked && (
              <Badge
                variant="outline"
                className={`rounded-full px-2 py-0 text-[9px] font-semibold ${quizStatusMeta.className}`}
              >
                {quizStatusMeta.label}
              </Badge>
            )}
            {isLocked && (
              <Badge
                variant="outline"
                className="rounded-full border-white/10 px-2 py-0 text-[9px] font-semibold text-white/30"
              >
                Locked
              </Badge>
            )}
          </div>
          {/* Count + mini progress */}
          {!isLocked && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 w-20 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ${
                    module.is_completed ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-white/35">
                {completedCount}/{totalCount} items
              </span>
            </div>
          )}
          {isLocked && module.description && (
            <p className="mt-0.5 truncate text-[11px] text-white/25">
              Complete the previous module to unlock
            </p>
          )}
        </div>

        {/* Chevron */}
        {!isLocked && (
          <ChevronDownIcon
            className={`size-5 shrink-0 text-white/40 transition-transform duration-300 ${
              open ? "rotate-180 text-white/90" : ""
            }`}
          />
        )}
      </button>

      {/* Content list */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {!isLocked && (
            <div className="border-t border-white/6 px-2 pb-3 sm:px-4 sm:pb-4">
              {module.description && (
                <p className="px-3 pb-3 pt-3 text-[13px] leading-relaxed text-white/50">
                  {module.description}
                </p>
              )}
              {module.content.length === 0 && !module.quiz ? (
                <p className="px-3 py-4 text-sm text-white/30">
                  No learning items in this module.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5 pt-2">
                  {module.content.map((c) => (
                    <ContentRow
                      key={c.id}
                      content={c}
                      onOpen={onContentOpen}
                    />
                  ))}
                  {module.quiz && (
                    <QuizRow
                      quiz={module.quiz}
                      quizStatus={module.quiz_status}
                      isLocked={isLocked}
                      onOpen={onQuizOpen}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

// ── Detail skeleton ───────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-56 w-full rounded-3xl bg-white/5" />
      <div className="space-y-3 px-1">
        <Skeleton className="h-6 w-2/3 bg-white/8" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-4/5 bg-white/5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl bg-white/5" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function OnlineCourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)

  const [course, setCourse] = useState<UserOnlineCourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!courseId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyOnlineCourseById(courseId)
      setCourse(data)
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number }
      setError({ message: e?.message ?? "Failed to load course.", status: e?.status })
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  function openContent(contentId: number) {
    navigate(`/user/online-courses/${courseId}/content/${contentId}`)
  }

  function openQuiz(quizId: number) {
    navigate(`/user/quizzes/${quizId}`)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const prog = course?.progress
  const statusCfg = prog ? STATUS_CFG[prog.status] : null

  return (
    <div className="flex flex-col gap-6 text-white">

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate("/user/online-courses")}
        className="flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-white/45 transition-colors hover:bg-white/5 hover:text-white/70"
      >
        <ArrowLeftIcon className="size-4" />
        My Online Courses
      </button>

      {/* ── Loading ── */}
      {isLoading && <DetailSkeleton />}

      {/* ── Error ── */}
      {!isLoading && error && (
        <div className="flex flex-col items-center gap-5 py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/4">
            {error.status === 403 ? (
              <LockIcon className="size-9 text-white/20" />
            ) : (
              <AlertCircleIcon className="size-9 text-red-400/60" />
            )}
          </div>
          <div className="space-y-1.5 text-center">
            <p className="text-base font-semibold text-white/55">
              {error.status === 403
                ? "Course not accessible"
                : "Failed to load course"}
            </p>
            <p className="text-sm text-white/30">
              {error.status === 403
                ? "This course is not assigned to your account."
                : error.message}
            </p>
          </div>
          {error.status !== 403 && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDetail}
              className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />
              Try Again
            </Button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {!isLoading && course && (
        <>
          {/* ── Course hero ── */}
          <section className="relative overflow-hidden rounded-[2rem] border border-white/5 ring-1 ring-black/5 shadow-2xl">
            {/* Thumbnail or gradient backdrop */}
            {course.thumbnail_url ? (
              <div className="relative h-64 w-full sm:h-80">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#090912] via-[#090912]/80 to-transparent" />
                <div className="absolute inset-0 bg-linear-to-r from-[#090912]/90 via-[#090912]/40 to-transparent" />
              </div>
            ) : (
              <div className="relative h-64 w-full bg-linear-to-br from-indigo-600/25 via-violet-600/15 to-[#090912] sm:h-80">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,rgba(99,102,241,0.2),transparent_60%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(139,92,246,0.15),transparent_55%)]" />
                </div>
                 <div className="absolute inset-0 bg-linear-to-t from-[#090912] to-transparent" />
              </div>
            )}

            {/* Hero content overlay */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {statusCfg && (
                    <Badge
                      variant="outline"
                      className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </Badge>
                  )}
                  <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 backdrop-blur-md px-3 py-1 text-xs text-white/50">
                    <BookOpenIcon className="mr-1.5 size-3.5" />
                    {course.modules.length} Modules
                  </Badge>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl lg:text-5xl">
                  {course.title}
                </h1>
                {course.description && (
                  <p className="max-w-3xl text-[15px] leading-relaxed text-white/60 drop-shadow">
                    {course.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── Progress overview cards ── */}
          {prog && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* Progress % */}
              <div className="group flex flex-col gap-3 rounded-[1.25rem] border border-white/6 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Overall Progress</span>
                  <span className={`text-xl font-bold tabular-nums drop-shadow-md ${prog.status === "completed" ? "text-emerald-400" : "text-indigo-400"}`}>
                    {(Number(prog.progress_percentage) || 0).toFixed(0)}%
                  </span>
                </div>
                <ProgressBar
                  pct={Number(prog.progress_percentage) || 0}
                  colorClass={
                    prog.status === "completed"
                      ? "from-emerald-400 to-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                      : "from-indigo-500 to-violet-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  }
                />
              </div>
              {/* Items */}
              <div className="group flex flex-col justify-center gap-2 rounded-[1.25rem] border border-white/6 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/[0.04]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Content Completed</span>
                <span className="text-xl font-bold tabular-nums text-white/90">
                  {prog.completed_content_items}
                  <span className="text-sm font-normal text-white/30">
                    /{prog.total_content_items}
                  </span>
                </span>
              </div>
              {/* Started */}
              <div className="group flex flex-col justify-center gap-2 rounded-[1.25rem] border border-white/6 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/[0.04]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Date Started</span>
                <span className="text-[15px] font-semibold text-white/80">
                  {formatDate(prog.started_at)}
                </span>
              </div>
              {/* Certificate */}
              <div className="group flex flex-col justify-center gap-2 rounded-[1.25rem] border border-white/6 bg-white/[0.02] p-5 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/[0.04]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Certificate</span>
                <span className={`text-[15px] font-semibold flex items-center gap-2 ${course.has_certificate ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-white/30"}`}>
                  {course.has_certificate ? (
                    <>
                      <TrophyIcon className="size-4" /> Available
                    </>
                  ) : "None"}
                </span>
              </div>
            </div>
          )}

          {/* ── Modules Header ── */}
          <div className="flex flex-col gap-5 pt-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-white/90 tracking-tight">
                  Learning Path
                </h2>
                <p className="mt-1 text-sm text-white/40">Follow the modules in order to complete the course.</p>
              </div>
            </div>

            {course.modules.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/3 py-12">
                <BookOpenIcon className="size-8 text-white/15" />
                <p className="text-sm text-white/35">No modules available yet.</p>
              </div>
            ) : (
              <div className="flex flex-col pt-3">
                {course.modules.map((mod, idx) => (
                  <ModuleAccordion
                    key={mod.id}
                    module={mod}
                    courseId={courseId}
                    defaultOpen={mod.is_unlocked && !mod.is_completed && idx === 0}
                    onContentOpen={openContent}
                    onQuizOpen={openQuiz}
                    isLast={idx === course.modules.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
