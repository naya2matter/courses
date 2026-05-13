// ─── Enroll Section ───────────────────────────────────────────────────────────
// Radio-based availability picker + enrollment submission.

import { useState } from "react"
import {
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { isApiError } from "@/lib/api"

import { enrollInCourse } from "../service/courses.service"
import type { CourseAvailability, CourseRegistration } from "../types/courses.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function formatTime(t: string | null): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${m} ${ampm}`
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EnrollSectionProps {
  courseId: number
  availabilities: CourseAvailability[]
  /** Called with the registration returned by the server on success */
  onEnrolled?: (registration: CourseRegistration) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EnrollSection({ courseId, availabilities, onEnrolled }: EnrollSectionProps) {
  const openAvs = availabilities.filter((a) => a.status === "active" && !a.is_full)

  const [selectedId, setSelectedId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enrolled, setEnrolled] = useState<CourseRegistration | null>(null)

  async function handleEnroll() {
    if (!selectedId) return
    setIsSubmitting(true)
    setError(null)
    try {
      const reg = await enrollInCourse(courseId, Number(selectedId))
      setEnrolled(reg)
      onEnrolled?.(reg)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Enrollment failed. Please try again.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Enrollment failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (enrolled) {
    const av = availabilities.find((a) => a.id === enrolled.course_availability_id)
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle2Icon className="size-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-emerald-300">
            Successfully enrolled!
          </p>
        </div>
        {av && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/15 px-4 py-3 space-y-1 text-xs text-emerald-200/70">
            <p className="font-medium text-emerald-200">
              {formatDate(av.start_date)} → {formatDate(av.end_date)}
            </p>
            <p>{av.days_of_week.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</p>
            {av.session_time_shift_1 && (
              <p>Starting {formatTime(av.session_time_shift_1)}</p>
            )}
            <p>{av.available_spots} spot{av.available_spots !== 1 ? "s" : ""} remaining</p>
          </div>
        )}
        <p className="text-[11px] text-emerald-400/50">
          Registration ID #{enrolled.id} · Status: {enrolled.status}
        </p>
      </div>
    )
  }

  // ── No open batches ───────────────────────────────────────────────────────

  if (openAvs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/3 p-5 flex flex-col items-center gap-3 text-center">
        <CalendarIcon className="size-8 text-white/20" />
        <p className="text-sm text-white/50 font-medium">No open batches</p>
        <p className="text-xs text-white/30">
          All available sessions are either full or not yet open for enrollment.
        </p>
      </div>
    )
  }

  // ── Enrollment form ───────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <RadioGroup
        value={selectedId}
        onValueChange={setSelectedId}
        className="space-y-2.5"
      >
        {openAvs.map((av) => {
          const shifts = [av.session_time_shift_1, av.session_time_shift_2, av.session_time_shift_3].filter(Boolean)
          const fillPct = av.capacity > 0
            ? Math.round(((av.capacity - av.available_spots) / av.capacity) * 100)
            : 0
          const isSelected = selectedId === String(av.id)

          return (
            <Label
              key={av.id}
              htmlFor={`av-${av.id}`}
              className={[
                "flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all duration-200",
                isSelected
                  ? "border-indigo-500/50 bg-indigo-500/8"
                  : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem
                  id={`av-${av.id}`}
                  value={String(av.id)}
                  className="mt-0.5 shrink-0 border-white/30 text-indigo-400 data-[state=checked]:border-indigo-400"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Date range */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {formatDate(av.start_date)} → {formatDate(av.end_date)}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 py-0 border-indigo-500/20 text-indigo-300 bg-indigo-500/10"
                    >
                      {av.duration_weeks}w
                    </Badge>
                  </div>

                  {/* Days */}
                  <div className="flex flex-wrap gap-1.5">
                    {av.days_of_week.map((d) => (
                      <span
                        key={d}
                        className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-white/60 capitalize"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Time shifts */}
                  {shifts.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
                      <ClockIcon className="size-3 text-white/30 shrink-0" />
                      {shifts.map((s, i) => (
                        <span key={i}>{formatTime(s)}</span>
                      ))}
                      <span className="text-white/30">· {av.session_duration_minutes}min</span>
                    </div>
                  )}

                  {/* Capacity bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-white/50">
                        <UsersIcon className="size-3 text-white/30" />
                        {av.available_spots} of {av.capacity} spots left
                      </span>
                      <span className="text-white/30">{av.sessions} sessions</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-indigo-500/60 transition-all"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {av.notes && (
                <p className="text-[11px] text-white/35 italic border-t border-white/5 pt-2 ms-7">
                  {av.notes}
                </p>
              )}
            </Label>
          )
        })}
      </RadioGroup>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <Button
        onClick={handleEnroll}
        disabled={!selectedId || isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl h-10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 mr-2 animate-spin" />
            Enrolling…
          </>
        ) : (
          "Enroll in selected batch"
        )}
      </Button>
    </div>
  )
}
