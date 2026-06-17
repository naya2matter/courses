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
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-card">
            <div className="absolute inset-0">
              {thumb ? (
                <img src={thumb} alt="" className="h-full w-full object-cover opacity-25" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-500/15 to-purple-600/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-card/40" />
            </div>

            <div className="relative flex flex-col gap-5 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                  isDone ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-400" : "border-indigo-500/25 bg-indigo-500/15 text-indigo-300"
                }`}>
                  {isDone ? "Completed" : course.progress?.status === "in_progress" ? "In progress" : "Not started"}
                </Badge>
                {course.has_certificate && (
                  <Badge variant="outline" className="rounded-full border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-300">
                    <AwardIcon className="mr-1 size-3" />Certificate
                  </Badge>
                )}
              </div>

              <div className="max-w-2xl space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">{course.title}</h1>
                {course.description && <p className="text-sm leading-relaxed text-white/55">{course.description}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-5 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><LayersIcon className="size-4 text-white/30" />{course.modules.length} modules</span>
                <span className="flex items-center gap-1.5"><FileStackIcon className="size-4 text-white/30" />{course.progress?.total_content_items ?? 0} items</span>
                <span className="flex items-center gap-1.5"><CheckCircle2Icon className="size-4 text-white/30" />{course.progress?.completed_content_items ?? 0} completed</span>
              </div>

              {/* Progress + continue */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full max-w-md space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-white/50">
                    <span>Course progress</span>
                    <span className={isDone ? "text-emerald-400" : "text-indigo-300"}>{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
                    <div className={`h-full rounded-full transition-all duration-700 ${isDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {resumeTarget ? (
                  <Button onClick={() => openContent(resumeTarget.id)}
                    className="shrink-0 gap-2 bg-indigo-600 text-white hover:bg-indigo-500">
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

          {/* Modules */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Course content</h2>
            <ModuleTree modules={course.modules} onOpenContent={openContent} onOpenQuiz={openQuiz} />
          </div>
        </>
      )}
    </div>
  )
}
