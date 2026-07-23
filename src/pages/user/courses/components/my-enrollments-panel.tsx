// ─── My Enrollments Panel ─────────────────────────────────────────────────────
// Standalone panel that loads + displays the user's course enrollments.

import { useCallback, useEffect, useState } from "react"
import {
  BookOpenIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  Loader2Icon,
  RefreshCwIcon,
  StarIcon,
  TrophyIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { getMyEnrollments } from "../service/courses.service"
import type { CourseRegistration } from "../types/courses.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  enrolled:   { label: "Enrolled",   className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300" },
  completed:  { label: "Completed",  className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
  cancelled:  { label: "Cancelled",  className: "border-red-500/20 bg-red-500/10 text-red-400" },
  pending:    { label: "Pending",    className: "border-amber-500/20 bg-amber-500/10 text-amber-300" },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "border-white/10 bg-white/5 text-white/50" }
  return (
    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  )
}

function EnrollmentCard({ reg }: { reg: CourseRegistration }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3 transition-colors hover:border-white/12 hover:bg-white/4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/15">
            {reg.status === "completed" ? (
              <TrophyIcon className="size-4 text-emerald-400" />
            ) : (
              <BookOpenIcon className="size-4 text-indigo-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {reg.course?.name ?? `Course #${reg.course_id}`}
            </p>
            <p className="text-[11px] text-white/35">
              Date #{reg.course_availability_id}
            </p>
          </div>
        </div>
        <StatusBadge status={reg.status} />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-white/40">
        {reg.enrolled_at && (
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-3 text-white/25" />
            Enrolled {formatDate(reg.enrolled_at)}
          </span>
        )}
        {reg.completed_at && (
          <span className="flex items-center gap-1 text-emerald-400/70">
            <CheckCircle2Icon className="size-3" />
            Completed {formatDate(reg.completed_at)}
          </span>
        )}
        {!reg.enrolled_at && !reg.completed_at && (
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3 text-white/25" />
            Registered {formatDate(reg.created_at)}
          </span>
        )}
      </div>

      {/* Rating */}
      {reg.rating != null && (
        <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon
                key={s}
                className={`size-3 ${s <= reg.rating! ? "text-amber-400" : "text-white/15"}`}
                fill={s <= reg.rating! ? "currentColor" : "none"}
              />
            ))}
          </div>
          {reg.feedback && (
            <span className="text-[11px] text-white/30 truncate max-w-50 italic">
              "{reg.feedback}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function EnrollmentSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-white/3 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-xl bg-white/5" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/5 bg-white/5" />
              <Skeleton className="h-3 w-1/4 bg-white/5" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function MyEnrollmentsPanel() {
  const [enrollments, setEnrollments] = useState<CourseRegistration[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchEnrollments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getMyEnrollments()
      setEnrollments(data)
      setHasFetched(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        setError(err.message || "Failed to load enrollments.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load enrollments.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEnrollments()
  }, [fetchEnrollments])

  const completed = enrollments.filter((r) => r.status === "completed")
  const active    = enrollments.filter((r) => r.status !== "completed")

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-white/40 font-medium">
          {hasFetched ? `${enrollments.length} enrollment${enrollments.length !== 1 ? "s" : ""}` : ""}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchEnrollments}
          disabled={isLoading}
          className="size-7 text-white/30 hover:text-white hover:bg-white/8 rounded-lg"
          aria-label="Refresh enrollments"
        >
          {isLoading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <RefreshCwIcon className="size-3.5" />
          )}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && !hasFetched && <EnrollmentSkeleton />}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400 flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchEnrollments}
            disabled={isLoading}
            className="size-6 shrink-0 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCwIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Empty */}
      {hasFetched && !isLoading && !error && enrollments.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 flex flex-col items-center gap-3 text-center">
          <BookOpenIcon className="size-9 text-white/15" />
          <p className="text-sm text-white/40 font-medium">No enrollments yet</p>
          <p className="text-xs text-white/25">Enroll in an available date above to get started.</p>
        </div>
      )}

      {/* Active enrollments */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.map((r) => <EnrollmentCard key={r.id} reg={r} />)}
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-white/30 flex items-center gap-1.5 pt-1">
            <TrophyIcon className="size-3 text-emerald-400/60" />
            Completed ({completed.length})
          </p>
          {completed.map((r) => <EnrollmentCard key={r.id} reg={r} />)}
        </div>
      )}
    </div>
  )
}
