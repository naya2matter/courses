// ─── Online Course Card (immersive full-bleed style) ─────────────────────────

import {
  BookOpenIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
  LayersIcon,
  FileStackIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { getThumbnailUrl } from "../service/user-online-courses.service"
import type { OnlineCourseCard as Card, LearningStatus } from "../types/user-online-courses.types"

const STATUS_CFG: Record<LearningStatus, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-white/5 text-white/50 border-white/10" },
  in_progress: { label: "In progress", cls: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25" },
  completed:   { label: "Completed",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
}

export function OnlineCourseCard({ course, onClick }: { course: Card; onClick: () => void }) {
  const pct = Math.round(course.progress_percentage ?? 0)
  const status = STATUS_CFG[course.status] ?? STATUS_CFG.not_started
  const isDone = course.status === "completed"
  const thumb = getThumbnailUrl(course.thumbnail_url)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[290px] w-full overflow-hidden rounded-2xl border border-white/8 text-left transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {/* Full-bleed background image + gradient overlay */}
      <div className="absolute inset-0 z-0 bg-[#0c0c14]">
        {thumb ? (
          <img
            src={thumb}
            alt={course.title}
            className="h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <BookOpenIcon className="size-16 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/85 to-[#0a0a0f]/25" />
      </div>

      {/* Overlaid content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        {/* Top: status badge */}
        <div>
          <Badge
            variant="outline"
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-md ${status.cls}`}
          >
            {isDone ? (
              <CheckCircle2Icon className="mr-1 size-3" />
            ) : course.status === "in_progress" ? (
              <PlayCircleIcon className="mr-1 size-3" />
            ) : null}
            {status.label}
          </Badge>
        </div>

        {/* Middle: title + description */}
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight text-white">
            {course.title}
          </h3>
          {course.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/45">
              {course.description}
            </p>
          )}
        </div>

        {/* Bottom: progress bar + meta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-white/55">
            <span>
              {course.completed_content_items}/{course.total_content_items} items
            </span>
            <span className={isDone ? "text-emerald-400" : "text-indigo-300"}>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between border-t border-white/8 pt-2 text-[11px] font-medium text-white/40">
            <span className="flex items-center gap-1.5">
              <LayersIcon className="size-3.5 text-white/25" />
              {course.total_modules} module{course.total_modules !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <FileStackIcon className="size-3.5 text-white/25" />
              {course.total_content_items} items
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
