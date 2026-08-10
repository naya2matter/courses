// ─── User Online Course — Detail ──────────────────────────────────────────────
// Route: /user/online-courses/:id

import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeftIcon,
  AlertCircleIcon,
  PlayIcon,
  CheckCircle2Icon,
  AwardIcon,
  LayersIcon,
  FileStackIcon,
  BookOpenIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { useDynamicBreadcrumb } from "@/context/breadcrumb"

import { getOnlineCourseById, getThumbnailUrl } from "./service/user-online-courses.service"
import type { OnlineCourseDetail, ModuleContent } from "./types/user-online-courses.types"
import { ModuleTree } from "./components/module-tree"

function findResumeContent(course: OnlineCourseDetail): ModuleContent | null {
  for (const m of course.modules) {
    if (!m.is_unlocked) continue
    for (const c of m.content) {
      if (c.is_unlocked && !(c.progress?.is_completed)) return c
    }
  }
  return null
}

export function OnlineCourseDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)

  const [course, setCourse] = useState<OnlineCourseDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [descExpanded, setDescExpanded] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Invalid course.")
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await getOnlineCourseById(courseId)
      setCourse(res.data)
    } catch (err) {
      if (isApiError(err)) {
        setError(err.status === 403 ? "You are not assigned to this course." : err.message || "Failed to load course.")
      } else if (err instanceof Error) setError(err.message)
      else setError("Failed to load course.")
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => { void load() }, [load])

  function openContent(contentId: number) {
    navigate(`/user/online-courses/${courseId}/content/${contentId}`)
  }

  function openQuiz(quizId: number) {
    navigate(`/user/online-courses/${courseId}/quiz/${quizId}`)
  }

  useDynamicBreadcrumb(course?.title)

  const resumeTarget = course ? findResumeContent(course) : null
  const pct = Math.round(course?.progress?.progress_percentage ?? 0)
  const isDone = course?.progress?.status === "completed"
  const thumb = getThumbnailUrl(course?.thumbnail_url)

  return (
    <div className="flex flex-col gap-6 text-white">
      <Button variant="ghost" size="sm" onClick={() => navigate("/user/online-courses")}
        className="-ml-2 w-fit gap-2 rounded-full text-white/50 hover:text-white">
        <ArrowLeftIcon className="size-4" />My Online Courses
      </Button>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-3xl bg-white/5" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-24 w-full rounded-2xl bg-white/5" />
        </div>
      )}

      {!isLoading && error && (
        <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Unable to open course</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && course && (
        <>
          {/* ── Hero card ───────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-card/80">
            {/* Subtle radial accent */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_55%)]" />

            <div className="relative flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:gap-6">
              {/* Thumbnail — shown on md+ as a contained card */}
              <div className="hidden md:flex shrink-0">
                <div className="h-48 w-40 overflow-hidden rounded-xl bg-[#0c0c14] ring-1 ring-white/8">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/12 to-purple-500/8">
                      <BookOpenIcon className="size-12 text-white/8" />
                    </div>
                  )}
                </div>
              </div>

              {/* Main content */}
              <div className="flex flex-1 flex-col gap-4 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                      isDone
                        ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-400"
                        : course.progress?.status === "in_progress"
                        ? "border-indigo-500/25 bg-indigo-500/15 text-indigo-300"
                        : "border-white/10 bg-white/5 text-white/50"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2Icon className="mr-1 size-3" />
                    ) : course.progress?.status === "in_progress" ? (
                      <PlayIcon className="mr-1 size-3" />
                    ) : null}
                    {isDone ? "Completed" : course.progress?.status === "in_progress" ? "In progress" : "Not started"}
                  </Badge>
                  {course.has_certificate && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-300"
                    >
                      <AwardIcon className="mr-1 size-3" />Certificate
                    </Badge>
                  )}
                </div>

                {/* Title + description */}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white leading-snug">
                    {course.title}
                  </h1>
                  {course.description && (
                    <div className="mt-1.5">
                      <p className={`text-sm leading-relaxed text-white/55 ${descExpanded ? "" : "line-clamp-3"}`}>
                        {course.description}
                      </p>
                      {course.description.length > 180 && (
                        <button
                          type="button"
                          onClick={() => setDescExpanded((v) => !v)}
                          className="mt-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
                        >
                          {descExpanded ? "Show less" : "Show more"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Stat chips */}
                <div className="flex flex-wrap gap-4 text-[13px] text-white/45">
                  <span className="flex items-center gap-1.5">
                    <LayersIcon className="size-3.5 text-white/25" />
                    {course.modules.length} module{course.modules.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileStackIcon className="size-3.5 text-white/25" />
                    {course.progress?.total_content_items ?? 0} items
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2Icon className="size-3.5 text-white/25" />
                    {course.progress?.completed_content_items ?? 0} completed
                  </span>
                </div>

                {/* Progress bar + CTA */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5 mt-auto pt-1">
                  <div className="flex-1 max-w-xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-white/45">
                      <span>Progress</span>
                      <span className={isDone ? "text-emerald-400" : "text-indigo-300"}>{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {resumeTarget ? (
                    <Button
                      onClick={() => openContent(resumeTarget.id)}
                      className="shrink-0 gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      <PlayIcon className="size-4" fill="currentColor" />
                      {pct > 0 ? "Continue learning" : "Start course"}
                    </Button>
                  ) : isDone ? (
                    <Badge className="shrink-0 gap-1.5 border-emerald-500/25 bg-emerald-500/15 px-3 py-1.5 text-emerald-400">
                      <CheckCircle2Icon className="size-4" />Course completed
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* ── Course content ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/40">
              <LayersIcon className="size-3.5" />Course content
            </h2>
            <div className="rounded-2xl border border-white/8 bg-white/2 p-1">
              <ModuleTree modules={course.modules} onOpenContent={openContent} onOpenQuiz={openQuiz} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
