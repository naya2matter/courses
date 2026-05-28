// ─── OnlineCourseDetailDrawer ─────────────────────────────────────────────────
// Sheet drawer showing a course's full tree: info + modules + contents.
// Fetches the detail on open so it always shows the latest data.

import { useEffect } from "react"
import {
  AlertCircleIcon,
  BookOpenIcon,
  ChevronDownIcon,
  ClockIcon,
  FileTextIcon,
  GraduationCapIcon,
  Loader2Icon,
  PaperclipIcon,
  PlayCircleIcon,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useOnlineCourseStore } from "../store/online-course.store"
import type { OnlineCourseContent, OnlineCourseModule, OnlineCourseDetail } from "../types/online-course.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
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
  if (!level) return "—"
  return level.charAt(0).toUpperCase() + level.slice(1)
}

// ── Row component ─────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground wrap-break-word min-w-0 flex-1">{children}</span>
    </div>
  )
}

// ── Content item ──────────────────────────────────────────────────────────────

function ContentItem({ content }: { content: OnlineCourseContent }) {
  const isVideo = content.content_type === "video"

  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/8 bg-white/3 px-3.5 py-3">
      {/* Icon */}
      <div
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
          isVideo ? "bg-indigo-500/20 text-indigo-400" : "bg-rose-500/20 text-rose-400"
        }`}
      >
        {isVideo ? (
          <PlayCircleIcon className="h-4 w-4" />
        ) : (
          <FileTextIcon className="h-4 w-4" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium leading-snug">{content.title}</p>
          {content.is_required && (
            <span className="text-[10px] uppercase tracking-widest text-amber-400 border border-amber-400/30 rounded px-1.5 py-0.5">
              Required
            </span>
          )}
          {!content.is_active && (
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 border border-zinc-400/30 rounded px-1.5 py-0.5">
              Inactive
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
          {isVideo && content.video && (
            <span className="flex items-center gap-1">
              <PlayCircleIcon className="h-3 w-3" />
              {content.video.name}
              {content.video.transcode_status && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                    content.video.transcode_status === "completed"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {content.video.transcode_status}
                </span>
              )}
            </span>
          )}

          {!isVideo && content.pdf && (
            <span className="flex items-center gap-1">
              <FileTextIcon className="h-3 w-3" />
              {content.pdf.pdf_page_count
                ? `${content.pdf.pdf_page_count} pages`
                : "PDF"}
            </span>
          )}

          {content.duration && (
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {formatDuration(content.duration)}
            </span>
          )}

          {content.attachment_name && (
            <span className="flex items-center gap-1">
              <PaperclipIcon className="h-3 w-3" />
              {content.attachment_name}
            </span>
          )}
        </div>
      </div>

      {/* Order */}
      <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/50 tabular-nums">#{content.order_number}</span>
    </div>
  )
}

// ── Module accordion ──────────────────────────────────────────────────────────

function ModuleSection({ module: mod }: { module: OnlineCourseModule }) {
  const contentCount = mod.contents.length
  const videoCount = mod.contents.filter((c) => c.content_type === "video").length
  const pdfCount = mod.contents.filter((c) => c.content_type === "pdf").length

  return (
    <details className="group rounded-xl border border-white/10 bg-white/3 overflow-hidden" open>
      {/* Summary */}
      <summary className="flex cursor-pointer list-none select-none items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold text-sm tabular-nums">
          {mod.order_number}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug">{mod.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {contentCount} item{contentCount !== 1 ? "s" : ""}
            {videoCount > 0 && ` · ${videoCount} video${videoCount !== 1 ? "s" : ""}`}
            {pdfCount > 0 && ` · ${pdfCount} PDF${pdfCount !== 1 ? "s" : ""}`}
            {mod.has_quiz && " · Quiz"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mod.has_quiz && (
            <span className="text-[10px] uppercase tracking-widest text-violet-400 border border-violet-400/30 rounded px-1.5 py-0.5">Quiz</span>
          )}
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
      </summary>

      {/* Contents */}
      <div className="px-4 pb-4 space-y-2">
        {mod.description && (
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{mod.description}</p>
        )}
        {mod.contents.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 italic py-2">No content added yet.</p>
        ) : (
          mod.contents.slice().sort((a, b) => a.order_number - b.order_number).map((c) => (
            <ContentItem key={c.id} content={c} />
          ))
        )}
      </div>
    </details>
  )
}

// ── Presentational view (exported) ───────────────────────────────────────────

interface OnlineCourseDetailViewProps {
  course: OnlineCourseDetail | null
  isLoading: boolean
  detailError: string | null
}

export function OnlineCourseDetailView({ course, isLoading, detailError }: OnlineCourseDetailViewProps) {
  const moduleCount = course?.modules?.length ?? 0
  const totalContents = course?.modules?.reduce((acc, m) => acc + m.contents.length, 0) ?? 0

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-5">
      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {!isLoading && detailError && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{detailError}</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && course && (
        <>
          {/* ── Overview */}
          <section className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overview</p>
            <div className="space-y-2.5">
              <Row label="Status">
                <Badge className={`text-[11px] border ${statusBadgeClass(course.status)}`}>{course.status}</Badge>
              </Row>

              {course.level && (
                <Row label="Level">
                  <span className="flex items-center gap-1.5">
                    <GraduationCapIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {levelLabel(course.level)}
                  </span>
                </Row>
              )}

              {course.estimated_duration && (
                <Row label="Est. Duration">
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatDuration(course.estimated_duration * 60)}
                  </span>
                </Row>
              )}

              <Row label="Modules">
                <span className="flex items-center gap-1.5">
                  <BookOpenIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                  {totalContents > 0 && ` · ${totalContents} item${totalContents !== 1 ? "s" : ""}`}
                </span>
              </Row>

              {course.creator && <Row label="Created By">{course.creator.name}</Row>}

              <Row label="Created">{formatDate(course.created_at)}</Row>

              {course.deadline && (
                <Row label="Deadline"><span className="text-amber-400">{formatDate(course.deadline)}</span></Row>
              )}
            </div>
          </section>

          {/* Description */}
          {course.description && (
            <>
              <Separator className="opacity-20" />
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Description</p>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {course.description}
                </div>
              </section>
            </>
          )}

          {/* Modules */}
          {course.modules && course.modules.length > 0 && (
            <>
              <Separator className="opacity-20" />
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Modules ({moduleCount})</p>
                <div className="space-y-3">
                  {course.modules.slice().sort((a, b) => a.order_number - b.order_number).map((mod) => (
                    <ModuleSection key={mod.id} module={mod} />
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Empty modules */}
          {course.modules && course.modules.length === 0 && (
            <>
              <Separator className="opacity-20" />
              <section className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Modules</p>
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-white/8 bg-white/3 text-center">
                  <BookOpenIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No modules yet</p>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseDetailDrawerProps {
  courseId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnlineCourseDetailDrawer({ courseId, open, onOpenChange }: OnlineCourseDetailDrawerProps) {
  const course = useOnlineCourseStore((s) => s.currentCourse)
  const isLoading = useOnlineCourseStore((s) => s.isLoadingDetail)
  const detailError = useOnlineCourseStore((s) => s.detailError)
  const fetchCourseById = useOnlineCourseStore((s) => s.fetchCourseById)

  // Fetch when drawer opens with a new id
  useEffect(() => {
    if (open && courseId != null) {
      fetchCourseById(courseId)
    }
  }, [open, courseId, fetchCourseById])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-180 lg:max-w-200 p-0">
        <div className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <SheetTitle className="text-lg leading-snug pr-8 truncate">{course?.name ?? "Course Details"}</SheetTitle>
            <SheetDescription>Online course — full module & content tree</SheetDescription>
          </SheetHeader>

          {/* Body (reused presentational view) */}
          <OnlineCourseDetailView course={course} isLoading={isLoading} detailError={detailError} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
