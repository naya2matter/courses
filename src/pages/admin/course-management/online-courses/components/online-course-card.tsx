// ─── OnlineCourseCard ─────────────────────────────────────────────────────────
// Fixed-height dark gradient card matching the live-courses grid aesthetic.
// h-[300px] with justify-between layout: header+body pinned top, footer pinned bottom.

import {
  ClockIcon,
  GraduationCapIcon,
  LayersIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import MouseTiltCard from "@/components/ui/mouse-tilt-card"
import type { OnlineCourse } from "../types/online-course.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "N/A"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function statusBadgeClass(status: string): string {
  switch (status?.toLowerCase()) {
    case "published": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    case "draft":     return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    case "archived":  return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
    default:          return "bg-white/10 text-white/60 border-white/15"
  }
}

function levelColor(level: string | null | undefined): string {
  switch (level?.toLowerCase()) {
    case "beginner":     return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
    case "intermediate": return "bg-amber-500/15 text-amber-400 border-amber-500/25"
    case "advanced":     return "bg-red-500/15 text-red-400 border-red-500/25"
    default:             return "bg-indigo-500/15 text-indigo-300 border-indigo-500/25"
  }
}

function capitalize(s: string | null | undefined): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseCardProps {
  course: OnlineCourse
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

// ── Grid card ─────────────────────────────────────────────────────────────────

export function OnlineCourseCard({ course, onView, onEdit, onDelete }: OnlineCourseCardProps) {
  return (
    <MouseTiltCard
      className="relative cursor-pointer overflow-hidden border-0 rounded-2xl ring-1 ring-white/10"
      onClick={onView}
    >
      <Card className="relative overflow-hidden border-0 rounded-2xl">
        {/* Background */}
        <div className="absolute inset-0 z-0 bg-zinc-900">
          {course.image_path ? (
            <img
              src={course.image_path}
              alt={course.name}
              className="h-full w-full object-cover opacity-60"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/40" />
        </div>

        {/* Content: fixed 300px, footer always pinned to bottom */}
        <div className="relative z-10 flex h-[300px] flex-col justify-between overflow-hidden p-5">

          {/* ── Top group: header + body ── */}
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <Badge className={`border backdrop-blur-md text-[11px] capitalize ${statusBadgeClass(course.status)}`}>
                {course.status}
              </Badge>

              <div className="flex items-center gap-1 rounded-md border border-white/10 bg-background/30 p-0.5 backdrop-blur-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm text-white/70 hover:bg-white/20 hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onEdit() }}
                  aria-label="Edit course"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm text-red-400 hover:bg-red-400/20 hover:text-red-300"
                  onClick={(e) => { e.stopPropagation(); onDelete() }}
                  aria-label="Delete course"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-white">
                  {course.name}
                </h3>
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {formatDuration(course.estimated_duration)}
                </div>
              </div>

              {/* Level */}
              <p className="mt-0.5 line-clamp-1 text-xs capitalize text-white/50">
                {course.level ? `Level: ${capitalize(course.level)}` : " "}
              </p>

              {/* Description */}
              <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-white/65">
                {course.description || " "}
              </p>
            </div>
          </div>

          {/* ── Bottom: pinned by justify-between ── */}
          <div>
            {/* Meta pills */}
            <div className="mb-2.5 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-indigo-500/15 px-2.5 py-1 text-indigo-300">
                <UsersIcon className="h-3 w-3" />
                {course.enrollments_count ?? 0} enrolled
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/60">
                <LayersIcon className="h-3 w-3" />
                {course.modules_count ?? 0} module{(course.modules_count ?? 0) !== 1 ? "s" : ""}
              </span>
              {course.level && (
                <span className={`ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${levelColor(course.level)}`}>
                  <GraduationCapIcon className="mr-1 h-2.5 w-2.5" />
                  {capitalize(course.level)}
                </span>
              )}
            </div>

            {/* Status bar — active = filled indigo, inactive = empty */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              {course.is_active && (
                <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
              )}
            </div>
            <p className="mt-1 text-right text-[10px] text-white/35">
              {course.is_active ? "Active" : "Inactive"}
              {course.deadline ? ` · Deadline ${new Date(course.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}` : ""}
            </p>
          </div>

        </div>
      </Card>
    </MouseTiltCard>
  )
}

// ── List-row variant ──────────────────────────────────────────────────────────

export function OnlineCourseListRow({ course, onView, onEdit, onDelete }: OnlineCourseCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm px-5 py-4 cursor-pointer hover:bg-card/80 transition-colors group"
      onClick={onView}
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
        {course.image_path ? (
          <img src={course.image_path} alt={course.name} className="h-full w-full object-cover" />
        ) : (
          <LayersIcon className="h-6 w-6 text-white/30" />
        )}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
          {course.name}
        </p>
        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-2.5 shrink-0 text-xs">
        {course.level && (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${levelColor(course.level)}`}>
            {capitalize(course.level)}
          </span>
        )}
        {course.estimated_duration && (
          <span className="flex items-center gap-1 text-muted-foreground rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
            <ClockIcon className="h-3 w-3" />
            {formatDuration(course.estimated_duration)}
          </span>
        )}
        <span className="flex items-center gap-1 text-indigo-300 rounded-full bg-indigo-500/15 border border-indigo-500/25 px-2.5 py-1">
          <UsersIcon className="h-3 w-3" />
          {course.enrollments_count ?? 0}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
          <LayersIcon className="h-3 w-3" />
          {course.modules_count ?? 0}
        </span>
        <Badge className={`border text-[11px] ${statusBadgeClass(course.status)}`}>
          {course.status}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
          aria-label="Edit"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-400/60 hover:text-red-400 hover:bg-red-400/10"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          aria-label="Delete"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
