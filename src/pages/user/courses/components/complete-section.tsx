// ─── Complete Course Section ──────────────────────────────────────────────────
// Single confirm-action button to mark an enrolled course as completed.

import { useState } from "react"
import {
  CheckCircle2Icon,
  Loader2Icon,
  TrophyIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { isApiError } from "@/lib/api"

import { completeCourse } from "../service/courses.service"
import type { CourseRegistration } from "../types/courses.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface CompleteSectionProps {
  courseId: number
  alreadyCompleted?: boolean
  onCompleted?: (registration: CourseRegistration) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CompleteSection({ courseId, alreadyCompleted, onCompleted }: CompleteSectionProps) {
  const [confirming, setConfirming] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<CourseRegistration | null>(null)

  async function handleComplete() {
    setIsSubmitting(true)
    setError(null)
    try {
      const reg = await completeCourse(courseId)
      setCompleted(reg)
      setConfirming(false)
      onCompleted?.(reg)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to mark as complete. Please try again.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to mark as complete. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Already completed ─────────────────────────────────────────────────────

  if (alreadyCompleted || completed) {
    const reg = completed
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
          <TrophyIcon className="size-5 text-emerald-400" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-emerald-300">Course Completed</p>
          {reg?.completed_at ? (
            <p className="text-xs text-emerald-400/50">
              Completed on{" "}
              {new Date(reg.completed_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          ) : (
            <p className="text-xs text-emerald-400/50">Marked as complete</p>
          )}
        </div>
      </div>
    )
  }

  // ── Confirm prompt ────────────────────────────────────────────────────────

  if (confirming) {
    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2Icon className="size-5 text-indigo-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              Mark this course as completed?
            </p>
            <p className="text-xs text-white/40">
              This action records your completion date. You will be able to leave a rating afterwards.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setConfirming(false); setError(null) }}
            disabled={isSubmitting}
            className="flex-1 border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white rounded-xl h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl h-9 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle2Icon className="size-4 mr-1.5" />
                Confirm
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── Default CTA ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <Button
        variant="outline"
        onClick={() => setConfirming(true)}
        className="w-full border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-400/30 hover:text-emerald-300 font-semibold rounded-xl h-10 transition-all"
      >
        <CheckCircle2Icon className="size-4 mr-2" />
        Mark as Completed
      </Button>
    </div>
  )
}
