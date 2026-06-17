// ─── Course Details Sheet ─────────────────────────────────────────────────────
// Slide-over panel showing full course details.
// Opens from the list on card click; keeps the user in context.

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  GraduationCapIcon,
  LockIcon,
  PencilIcon,
  Trash2Icon,
  UnlockIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { getCourseById } from "../service/course.service"
import { parseAvailabilities } from "../utils/availability"
import type { CourseResource } from "../types/course.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLevelLabel(level: CourseResource["level"]): string {
  if (!level) return "—"
  return typeof level === "string" ? level : level.name
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "TBD"
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function formatTime(t: string | null | undefined): string {
  if (!t) return ""
  const [h, m] = t.split(":")
  const hour = Number(h)
  const ampm = hour >= 12 ? "PM" : "AM"
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function statusConfig(status: string | null) {
  switch (status?.toLowerCase()) {
    case "published":
    case "active":
      return { label: status, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" }
    case "draft":
      return { label: "Draft", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" }
    case "archived":
      return { label: "Archived", className: "bg-red-500/15 text-red-400 border-red-500/25" }
    default:
      return { label: status ?? "Unknown", className: "bg-white/10 text-white/60 border-white/15" }
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-muted/40 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-sm font-semibold capitalize leading-tight">{value}</p>
    </div>
  )
}

function AvailabilitySlot({ slot, index }: { slot: ReturnType<typeof parseAvailabilities>[number]; index: number }) {
  const capacity = Number(slot.capacity) || 0
  const available = Number(slot.available_spots)
  const used = !isNaN(available) && capacity > 0 ? capacity - available : 0
  const pct = capacity > 0 ? Math.min(100, Math.max(0, (used / capacity) * 100)) : 0
  const isFull = slot.is_full ?? (capacity > 0 && available === 0)

  const times = [slot.session_time_shift_1, slot.session_time_shift_2, slot.session_time_shift_3]
    .filter(Boolean)
    .map(formatTime)

  return (
    <div className="rounded-xl border border-white/10 bg-muted/30 p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Session {index + 1}
        </p>
        {isFull ? (
          <Badge className="h-4.5 border-red-500/30 bg-red-500/15 px-1.5 text-[10px] text-red-400">
            Full
          </Badge>
        ) : (
          <Badge className="h-4.5 border-emerald-500/30 bg-emerald-500/15 px-1.5 text-[10px] text-emerald-400">
            Open
          </Badge>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-sm">
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-foreground">{formatShortDate(slot.start_date)}</span>
        {slot.end_date && slot.end_date !== slot.start_date && (
          <>
            <span className="text-muted-foreground">→</span>
            <span className="text-foreground">{formatShortDate(slot.end_date)}</span>
          </>
        )}
      </div>

      {/* Days of week */}
      {slot.days_of_week && slot.days_of_week.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {slot.days_of_week.map((day) => (
            <span
              key={day}
              className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-muted-foreground capitalize"
            >
              {day}
            </span>
          ))}
        </div>
      )}

      {/* Session times */}
      {times.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ClockIcon className="h-3.5 w-3.5 shrink-0" />
          {times.join(" · ")}
          {slot.session_duration_minutes && (
            <span className="text-muted-foreground/60">({slot.session_duration_minutes}m/session)</span>
          )}
        </div>
      )}

      {/* Capacity bar */}
      {capacity > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium">
              {!isNaN(available) ? `${used} / ${capacity}` : `${capacity} total`}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {slot.notes && (
        <p className="text-xs text-muted-foreground/70 italic border-t border-white/5 pt-2">
          {slot.notes}
        </p>
      )}
    </div>
  )
}

function SheetSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-2">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CourseDetailsSheetProps {
  courseId: number | null
  onClose: () => void
  onDelete: (course: CourseResource) => void
  onAssign: (course: CourseResource) => void
}

export function CourseDetailsSheet({
  courseId,
  onClose,
  onDelete,
  onAssign,
}: CourseDetailsSheetProps) {
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseResource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId) {
      setCourse(null)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getCourseById(courseId)
      .then((data) => { if (!cancelled) setCourse(data) })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load course.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [courseId])

  const availabilities = course ? parseAvailabilities(course.availabilities) : []
  const sc = statusConfig(course?.status ?? null)

  return (
    <Sheet open={courseId !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-1">
          <SheetTitle className="flex items-center gap-2">
            <BookOpenIcon className="h-5 w-5 text-primary" />
            Course Details
          </SheetTitle>
          <SheetDescription>Schedule, capacity, and course metadata.</SheetDescription>
        </SheetHeader>

        <Separator className="my-5" />

        {loading && <SheetSkeleton />}

        {error && (
          <p className="px-2 text-sm text-destructive">{error}</p>
        )}

        {!loading && course && (
          <div className="flex flex-col gap-5 px-2 pb-4">
            {/* ── Hero image / gradient ── */}
            <div className="relative h-36 overflow-hidden rounded-2xl">
              {course.image_path ? (
                <img
                  src={course.image_path}
                  alt={course.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/50 via-purple-600/40 to-fuchsia-600/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Overlaid badges */}
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${sc.className}`}>
                    {sc.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-xs text-white/80 backdrop-blur-sm">
                    {course.privacy === "private" ? (
                      <><LockIcon className="h-3 w-3" /> Private</>
                    ) : (
                      <><UnlockIcon className="h-3 w-3" /> Public</>
                    )}
                  </span>
                </div>
                <span className="text-xs text-white/40">#{course.id}</span>
              </div>
            </div>

            {/* ── Name + description ── */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold leading-snug">{course.name}</h2>
              {course.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {course.description}
                </p>
              )}
            </div>

            {/* ── Key metrics ── */}
            <div className="grid grid-cols-3 gap-2">
              <MetricPill
                icon={GraduationCapIcon}
                label="Level"
                value={getLevelLabel(course.level)}
              />
              <MetricPill
                icon={ClockIcon}
                label="Duration"
                value={formatDuration(course.duration)}
              />
              <MetricPill
                icon={UsersIcon}
                label="Enrolled"
                value={String(course.registrations_count ?? 0)}
              />
            </div>

            {/* ── Availabilities ── */}
            {availabilities.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Availabilities · {availabilities.length} slot{availabilities.length !== 1 ? "s" : ""}
                </p>
                {availabilities.map((slot, i) => (
                  <AvailabilitySlot key={slot.id ?? i} slot={slot} index={i} />
                ))}
              </div>
            )}

            {availabilities.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 shrink-0" />
                No availability slots defined yet.
              </div>
            )}

            {/* ── Timestamps ── */}
            <div className="space-y-2 rounded-xl border border-white/10 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Timestamps
              </p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{formatShortDate(course.created_at)}</span>
                <span className="text-muted-foreground">Updated</span>
                <span>{formatShortDate(course.updated_at)}</span>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {course.privacy === "private" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-300"
                  onClick={() => { onClose(); onAssign(course) }}
                >
                  <UserPlusIcon className="h-3.5 w-3.5" />
                  Assign
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    onClose()
                    navigate(`/admin/course-management/live-courses/edit/${course.id}`)
                  }}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => { onClose(); onDelete(course) }}
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
