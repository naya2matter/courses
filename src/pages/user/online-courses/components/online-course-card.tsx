// ─── Online Course Card ───────────────────────────────────────────────────────

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
      className="group relative flex w-full flex-col overflow-hidden rounded-[20px] border border-white/5 bg-[#0a0a0f] text-left transition-colors hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {/* Thumbnail */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[#0c0c14]">
        {thumb ? (
          <img src={thumb} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <BookOpenIcon className="size-14 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/10 via-[#0a0a0f]/50 to-[#0a0a0f]" />
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium backdrop-blur-md ${status.cls}`}>
            {isDone
              ? <CheckCircle2Icon className="mr-1 size-3" />
              : course.status === "in_progress" ? <PlayCircleIcon className="mr-1 size-3" /> : null}
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="-mt-10 flex flex-1 flex-col px-5 pb-5">
        <h3 className="z-10 mb-1.5 line-clamp-2 text-lg font-bold leading-tight tracking-tight text-white drop-shadow">
          {course.title}
        </h3>
        {course.description && (
          <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-white/40">{course.description}</p>
        )}

        {/* Progress */}
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-white/50">
            <span>{course.completed_content_items}/{course.total_content_items} items</span>
            <span className={isDone ? "text-emerald-400" : "text-indigo-300"}>{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isDone ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-600 to-indigo-400"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-4 pt-1.5 text-[11px] font-medium text-white/40">
            <span className="flex items-center gap-1.5"><LayersIcon className="size-3.5 text-white/25" />{course.total_modules} modules</span>
            <span className="flex items-center gap-1.5"><FileStackIcon className="size-3.5 text-white/25" />{course.total_content_items} items</span>
          </div>
        </div>
      </div>
    </button>
  )
}
