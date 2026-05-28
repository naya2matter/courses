// ─── OnlineCourseCard ─────────────────────────────────────────────────────────
// Dark gradient card for a single online course — grid view.
// Mirrors the live-courses card aesthetic with MouseTiltCard.

import {
  BookOpenIcon,
  ClockIcon,
  EllipsisVerticalIcon,
  GraduationCapIcon,
  LayersIcon,
  Trash2Icon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import MouseTiltCard from "@/components/ui/mouse-tilt-card"
import type { OnlineCourse } from "../types/online-course.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(minutes: number | null): string {
  if (!minutes) return "N/A"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "published":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
    case "draft":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30"
    case "archived":
      return "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
    default:
      return "bg-white/10 text-white/60 border-white/10"
  }
}

function levelLabel(level: string | null): string {
  if (!level) return ""
  return level.charAt(0).toUpperCase() + level.slice(1)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseCardProps {
  course: OnlineCourse
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnlineCourseCard({ course, onView, onEdit, onDelete }: OnlineCourseCardProps) {
  return (
    <MouseTiltCard
      className="relative cursor-pointer overflow-hidden transition-all border-0 rounded-2xl ring-1 ring-white/10"
      onClick={onView}
    >
      <Card className="relative overflow-hidden border-0 rounded-2xl min-h-56">
        {/* Background */}
        <div className="absolute inset-0 z-0 bg-zinc-900 overflow-hidden">
          {course.image_path ? (
            <img
              src={course.image_path}
              alt={course.name}
              className="w-full h-full object-cover opacity-50 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/40 z-10" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-5 flex flex-col h-full min-h-56 justify-between">
          {/* Top row — status badge + actions */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <Badge
              className={`text-[11px] border backdrop-blur-sm ${statusBadgeClass(course.status)}`}
            >
              {course.status}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md backdrop-blur-md bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  <EllipsisVerticalIcon className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onSelect={onView}>
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onEdit}>
                  Edit course
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Delete course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Main info */}
          <div className="space-y-3 mt-auto">
            <h3 className="text-xl font-semibold text-white tracking-tight leading-snug line-clamp-2">
              {course.name}
            </h3>

            {course.description && (
              <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            )}

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {course.level && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75 backdrop-blur-sm">
                  <GraduationCapIcon className="h-3 w-3" />
                  {levelLabel(course.level)}
                </span>
              )}
              {course.estimated_duration && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/75 backdrop-blur-sm">
                  <ClockIcon className="h-3 w-3" />
                  {formatDuration(course.estimated_duration)}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <BookOpenIcon className="h-3.5 w-3.5" />
                <span>ID {course.id}</span>
              </div>
              {course.creator && (
                <span className="text-xs text-white/40 truncate max-w-30">
                  by {course.creator.name}
                </span>
              )}
            </div>
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
      {/* Thumbnail / icon */}
      <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
        {course.image_path ? (
          <img
            src={course.image_path}
            alt={course.name}
            className="w-full h-full object-cover"
          />
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
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {course.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {course.level && (
          <span className="text-xs text-muted-foreground capitalize rounded-full border border-border/50 px-2.5 py-1">
            {levelLabel(course.level)}
          </span>
        )}
        {course.estimated_duration && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatDuration(course.estimated_duration)}
          </span>
        )}
        <Badge
          className={`text-[11px] border ${statusBadgeClass(course.status)}`}
        >
          {course.status}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); onEdit() }}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
        >
          <Trash2Icon className="h-3.5 w-3.5 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  )
}
