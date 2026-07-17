// ─── Rating Section ───────────────────────────────────────────────────────────
// Star rating picker + optional feedback textarea for completed courses.

import { useState } from "react"
import {
  CheckCircle2Icon,
  Loader2Icon,
  StarIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { isApiError } from "@/lib/api"

import { submitCourseRating } from "../service/courses.service"
import type { CourseRegistration } from "../types/courses.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface RatingSectionProps {
  courseId: number
  existingRating?: number | null
  existingFeedback?: string | null
  onRated?: (registration: CourseRegistration) => void
}

// ── Star picker ───────────────────────────────────────────────────────────────

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"]

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (v: number) => void
  disabled: boolean
}) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star – ${STAR_LABELS[star]}`}
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={[
            "size-9 flex items-center justify-center rounded-xl border transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            star <= active
              ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
              : "border-white/8 bg-white/3 text-white/20 hover:border-white/20 hover:text-white/40",
          ].join(" ")}
        >
          <StarIcon
            className="size-4"
            fill={star <= active ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RatingSection({
  courseId,
  existingRating,
  existingFeedback,
  onRated,
}: RatingSectionProps) {
  const [rating, setRating] = useState<number>(existingRating ?? 0)
  const [feedback, setFeedback] = useState<string>(existingFeedback ?? "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<CourseRegistration | null>(null)

  async function handleSubmit() {
    if (rating === 0) return
    if (!feedback.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const reg = await submitCourseRating(courseId, rating, feedback || null)
      setSubmitted(reg)
      onRated?.(reg)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      // Log full error for debugging (includes validation payloads)
      // eslint-disable-next-line no-console
      console.error("submitCourseRating error:", err)

      if (isApiError(err)) {
        // Try to extract validation errors or message from the API payload
        // err.data is set by apiClient when the response is non-ok
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = (err as any).data
        let msg = err.message || "Failed to submit rating. Please try again."
        if (payload) {
          if (payload.errors) {
            // Laravel-style validation errors: { field: ["msg"] }
            try {
              msg = Object.values(payload.errors).flat().join(" ")
            } catch {
              msg = JSON.stringify(payload.errors)
            }
          } else if (payload.message) {
            msg = payload.message
          }
        }
        setError(msg)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to submit rating. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2Icon className="size-5 text-amber-400 shrink-0" />
          <p className="text-sm font-semibold text-amber-300">
            Rating submitted — thank you!
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <StarIcon
              key={s}
              className={`size-4 ${s <= (submitted.rating ?? 0) ? "text-amber-400" : "text-white/15"}`}
              fill={s <= (submitted.rating ?? 0) ? "currentColor" : "none"}
            />
          ))}
          <span className="ms-1 text-xs text-amber-300/70 font-medium">
            {STAR_LABELS[submitted.rating ?? 0]}
          </span>
        </div>
        {submitted.feedback && (
          <p className="text-xs text-white/40 italic border-t border-white/8 pt-2">
            "{submitted.feedback}"
          </p>
        )}
      </div>
    )
  }

  // ── Rating form ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs text-white/50 font-medium">Your rating</p>
        <div className="flex flex-wrap items-center gap-3">
          <StarPicker value={rating} onChange={setRating} disabled={isSubmitting} />
          {rating > 0 && (
            <span className="text-xs text-amber-400/80 font-medium">
              {STAR_LABELS[rating]}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-white/50 font-medium">
          Feedback <span className="text-red-400 ml-0.5">*</span> <span className="text-white/25">(max 1000 characters)</span>
        </p>
        <Textarea
          value={feedback}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value.slice(0, 1000))}
          disabled={isSubmitting}
          placeholder="Share your experience with this course…"
          rows={3}
          className="resize-none rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-indigo-500/50 disabled:opacity-50"
        />
        {feedback.length > 900 && (
          <p className="text-right text-[11px] text-white/30">
            {feedback.length}/1000
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || !feedback.trim() || isSubmitting}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl h-10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 mr-2 animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Rating"
        )}
      </Button>
    </div>
  )
}
