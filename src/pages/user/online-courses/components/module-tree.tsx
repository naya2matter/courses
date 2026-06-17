// ─── Course Module Tree ───────────────────────────────────────────────────────
// Renders the module → content hierarchy with unlock/completion state.

import { useState } from "react"
import {
  ChevronDownIcon,
  LockIcon,
  CheckCircle2Icon,
  PlayCircleIcon,
  FileTextIcon,
  CircleIcon,
  HelpCircleIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { formatDuration } from "../service/user-online-courses.service"
import type { CourseModule, ModuleContent } from "../types/user-online-courses.types"

function ContentRow({ content, locked, onOpen }: { content: ModuleContent; locked: boolean; onOpen: () => void }) {
  const done = content.progress?.is_completed ?? false
  const pct = Math.round(content.progress?.completion_percentage ?? 0)
  const isVideo = content.content_type === "video"
  const disabled = locked || !content.is_unlocked

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onOpen}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
        disabled
          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-60"
          : "border-white/8 bg-white/[0.03] hover:border-indigo-500/30 hover:bg-indigo-500/[0.06]"
      }`}
    >
      {/* Status icon */}
      <span className="shrink-0">
        {done ? (
          <CheckCircle2Icon className="size-5 text-emerald-400" />
        ) : disabled ? (
          <LockIcon className="size-4.5 text-white/30" />
        ) : (
          <CircleIcon className="size-4.5 text-white/25" />
        )}
      </span>

      {/* Type icon */}
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${isVideo ? "bg-sky-500/15 text-sky-400" : "bg-amber-500/15 text-amber-400"}`}>
        {isVideo ? <PlayCircleIcon className="size-4" /> : <FileTextIcon className="size-4" />}
      </span>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white/90">{content.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/40">
          <span className="capitalize">{content.content_type}</span>
          {isVideo && content.duration_seconds > 0 && <span>· {formatDuration(content.duration_seconds)}</span>}
          {!content.is_required && <span>· Optional</span>}
          {!done && pct > 0 && <span className="text-indigo-300">· {pct}%</span>}
        </div>
      </div>

      {done && <span className="shrink-0 text-[11px] font-medium text-emerald-400">Done</span>}
    </button>
  )
}

function ModuleBlock({ module, index, onOpenContent, onOpenQuiz }: { module: CourseModule; index: number; onOpenContent: (id: number) => void; onOpenQuiz: (quizId: number) => void }) {
  const [open, setOpen] = useState(module.is_unlocked && !module.is_completed)
  const locked = !module.is_unlocked
  const doneCount = module.content.filter((c) => c.progress?.is_completed).length

  return (
    <div className={`overflow-hidden rounded-2xl border ${locked ? "border-white/5 bg-white/[0.01]" : "border-white/8 bg-card/40"}`}>
      <button
        type="button"
        onClick={() => !locked && setOpen((o) => !o)}
        disabled={locked}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${locked ? "cursor-not-allowed" : "hover:bg-white/[0.03]"}`}
      >
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
          module.is_completed ? "bg-emerald-500/15 text-emerald-400" : locked ? "bg-white/5 text-white/30" : "bg-indigo-500/15 text-indigo-300"
        }`}>
          {module.is_completed ? <CheckCircle2Icon className="size-4.5" /> : locked ? <LockIcon className="size-4" /> : index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{module.title}</p>
          <p className="text-[11px] text-white/40">
            {doneCount}/{module.content.length} items
            {module.has_quiz && " · includes quiz"}
            {locked && " · complete the previous module to unlock"}
          </p>
        </div>

        {module.has_quiz && module.quiz_id != null && !locked ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onOpenQuiz(module.quiz_id!) }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onOpenQuiz(module.quiz_id!) } }}
            className={`hidden shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors sm:inline-flex ${
              module.quiz_status === "passed"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-purple-500/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
            }`}
          >
            <HelpCircleIcon className="size-3" />
            {module.quiz_status === "passed" ? "Quiz · Passed" : "Take Quiz"}
          </span>
        ) : module.has_quiz ? (
          <Badge variant="outline" className="hidden shrink-0 gap-1 rounded-full border-white/15 bg-white/5 text-[10px] text-white/40 sm:flex">
            <HelpCircleIcon className="size-3" />Quiz
          </Badge>
        ) : null}

        {!locked && <ChevronDownIcon className={`size-4 shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />}
      </button>

      {open && !locked && (
        <div className="space-y-2 px-4 pb-4 pt-0">
          {module.content.map((c) => (
            <ContentRow key={c.id} content={c} locked={locked} onOpen={() => onOpenContent(c.id)} />
          ))}
          {module.content.length === 0 && (
            <p className="px-1 py-3 text-xs text-white/30">No content in this module yet.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function ModuleTree({ modules, onOpenContent, onOpenQuiz }: { modules: CourseModule[]; onOpenContent: (id: number) => void; onOpenQuiz: (quizId: number) => void }) {
  return (
    <div className="space-y-3">
      {modules.map((m, i) => (
        <ModuleBlock key={m.id} module={m} index={i} onOpenContent={onOpenContent} onOpenQuiz={onOpenQuiz} />
      ))}
    </div>
  )
}
