// --- ClockInDialog (Redesigned) -----------------------------------------------

import { useState, useEffect } from "react"
import { LogInIcon, Loader2Icon, AlertCircleIcon, BookOpenIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { clockIn, getUserCourses } from "../service/clocking.service"
import type { ClockingRecord, CourseSimple } from "../types/clocking.types"

// -- Helpers -------------------------------------------------------------------

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
  if (apiErr?.data?.message) return apiErr.data.message
  if (err instanceof Error) return err.message || fallback
  return fallback
}

// -- Component -----------------------------------------------------------------

interface ClockInDialogProps {
  open: boolean
  onClose: () => void
  onClockIn: (record: ClockingRecord) => void
}

export function ClockInDialog({ open, onClose, onClockIn }: ClockInDialogProps) {
  const [courseId, setCourseId] = useState<string>("none")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [courses, setCourses] = useState<CourseSimple[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    async function load() {
      setLoadingCourses(true)
      try {
        const data = await getUserCourses()
        const parsed = data.map((d: any) => d.course || d)
        if (mounted) setCourses(parsed)
      } catch {
        // silently fail � course selection is optional
      } finally {
        if (mounted) setLoadingCourses(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [open])

  function handleClose() {
    if (isLoading) return
    setCourseId("none")
    setError(null)
    onClose()
  }

  async function handleSubmit() {
    setError(null)
    let parsedCourseId: number | null = null
    if (courseId !== "none") {
      const num = parseInt(courseId, 10)
      if (isNaN(num) || num <= 0) return
      parsedCourseId = num
    }
    setIsLoading(true)
    try {
      const record = await clockIn({ course_id: parsedCourseId })
      toast.success("Session started!")
      onClockIn(record)
      handleClose()
    } catch (err) {
      if (isCanceledError(err)) return
      setError(extractError(err, "Failed to clock in. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCourse = courses.find((c) => c.id.toString() === courseId)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm overflow-hidden border border-border bg-background backdrop-blur-2xl text-foreground">
        {/* Top glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-full bg-violet-500/8 blur-2xl" />

        <DialogHeader className="relative pb-2 text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/20 to-violet-500/15">
            <LogInIcon className="h-7 w-7 text-indigo-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">Start Session</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Optionally link this session to one of your courses.
          </p>
        </DialogHeader>

        <div className="relative mt-3 space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-400">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Course selector */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-foreground/55">
              <BookOpenIcon className="h-3.5 w-3.5" />
              Course
              <span className="ml-auto text-foreground/25">optional</span>
            </label>

            <Select value={courseId} onValueChange={setCourseId} disabled={isLoading || loadingCourses}>
              <SelectTrigger className="w-full border-border bg-white/5 text-foreground focus:ring-indigo-500/40 focus:ring-offset-0">
                {loadingCourses ? (
                  <span className="flex items-center gap-2 text-foreground/40">
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    Loading courses�
                  </span>
                ) : (
                  <SelectValue placeholder="No specific course" />
                )}
              </SelectTrigger>
              <SelectContent className="border-border bg-[#16132e] text-foreground">
                <SelectItem value="none" className="focus:bg-white/8 focus:text-foreground">
                  No specific course
                </SelectItem>
                {courses.map((course) => (
                  <SelectItem
                    key={course.id}
                    value={course.id.toString()}
                    className="focus:bg-white/8 focus:text-foreground"
                  >
                    {course.title || course.name || `Course #${course.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected course preview */}
            {selectedCourse && (
              <div className="flex items-center gap-2 rounded-xl border border-indigo-500/15 bg-indigo-500/8 px-3 py-2">
                <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span className="text-xs text-indigo-300 truncate">
                  {selectedCourse.title || selectedCourse.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 border border-border text-foreground/55 hover:bg-white/5 hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-indigo-600 text-foreground transition-all hover:bg-indigo-500"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Starting�
              </>
            ) : (
              <>
                <LogInIcon className="mr-2 h-4 w-4" />
                Clock In Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
