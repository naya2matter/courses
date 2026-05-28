const fs = require("fs");
const path = require("path");

const p = path.resolve("courses/src/pages/user/online-courses/online-content-viewer-page.tsx");
let content = fs.readFileSync(p, "utf-8");

const importPatch = `
import {
  getContentResumePosition,
  openCourseContent,
  getMyOnlineCourseById,
} from "@/services/userOnlineCourse.service"
import { useLearningSession } from "./hooks/use-learning-session"
import type {
  ResumeProgressResponse,
  UserCourseMediaResponse,
  UserOnlineCourseDetail,
} from "@/types/user-online-course"
import { CheckCircle2Icon, BookOpenIcon, MenuIcon, XIcon, ListIcon } from "lucide-react"
`;
content = content.replace(/import \{[\s\S]*?\} from "@\/types\/user-online-course"/g, importPatch.trim());

const pageDefPatch = `
// -- Page ----------------------------------------------------------------------

export function OnlineContentViewerPage() {
  const navigate = useNavigate()
  const { courseId, contentId } = useParams<{
    courseId: string
    contentId: string
  }>()

  const cId = Number(courseId)
  const ctId = Number(contentId)

  const [course, setCourse] = useState<UserOnlineCourseDetail | null>(null)
  const [media, setMedia] = useState<UserCourseMediaResponse | null>(null)
  const [resume, setResume] = useState<ResumeProgressResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [mediaExpired, setMediaExpired] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // -- Fetch -----------------------------------------------------------------

  const fetchContent = useCallback(
    async (showFullLoader = true) => {
      if (!cId || !ctId) return
      if (showFullLoader) setIsLoading(true)
      else setIsRefreshing(true)
      setError(null)
      setMediaExpired(false)

      try {
        const [courseData, resumeData, mediaData] = await Promise.all([
          getMyOnlineCourseById(cId).catch(() => null),
          getContentResumePosition(ctId).catch(() => null),
          openCourseContent(cId, ctId),
        ])
        setCourse(courseData)
        setResume(resumeData)
        setMedia(mediaData)
      } catch (err: unknown) {
        const e = err as { message?: string; status?: number }
        setError({ message: e?.message ?? "Failed to load content.", status: e?.status })
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [cId, ctId],
  )
`;
content = content.replace(/\/\/ -- Page -+[\s\S]*?\[cId, ctId\],\s*\)/g, pageDefPatch.trim());

const renderPatch = `
  // -- Render ----------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col lg:flex-row bg-[#020205] text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mt-[-1.5rem]">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 pt-6">
        
        {/* Header / Mobile Toggle */}
        <div className="flex items-center justify-between mb-6 shrink-0 z-10 px-2 lg:px-6">
          <button
            type="button"
            onClick={goBack}
            className="group flex w-fit items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white/60 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white/90 hover:border-white/20 shadow-sm"
          >
            <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-1" />
            Back to Course
          </button>
          
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            {sidebarOpen ? <XIcon className="size-5" /> : <ListIcon className="size-5" />}
          </button>
        </div>

        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-2 lg:px-6 pb-20">
          {/* -- Loading -- */}
          {isLoading && (
            <ViewerSkeleton type={media?.content_type} />
          )}

          {/* -- Error -- */}
          {!isLoading && error && (
            <div className="flex flex-col items-center gap-5 py-24">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                {error.status === 403 ? (
                  <LockIcon className="size-10 text-white/30" />
                ) : (
                  <AlertCircleIcon className="size-10 text-red-500/70" />
                )}
              </div>
              <div className="space-y-2 text-center max-w-sm">
                <p className="text-xl font-bold tracking-tight text-white/90">
                  {error.status === 403
                    ? "Content locked"
                    : "Failed to load media"}
                </p>
                <p className="text-sm text-white/50 leading-relaxed">
                  {error.status === 403
                    ? "This module is locked or this course is not assigned to your account."
                    : error.message}
                </p>
              </div>
              {error.status !== 403 && (
                <Button
                  variant="outline"
                  onClick={() => fetchContent(true)}
                  className="rounded-full border-white/10 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
                >
                  <RefreshCwIcon className="mr-2 size-4" />
                  Try Again
                </Button>
              )}
            </div>
          )}

          {/* -- Media -- */}
          {!isLoading && media && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full relative">
              <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full -z-10" />
              {/* Title + badges */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl">
                      {media.content_type === "video" ? (
                        <PlayCircleIcon className="size-6 text-indigo-400" />
                      ) : (
                        <FileTextIcon className="size-6 text-violet-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md leading-tight">
                        {media.title}
                      </h1>
                      {resumeHint && (
                        <p className="text-xs uppercase font-medium tracking-widest text-indigo-300/70">
                          {resumeHint}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/70"
                  >
                    {media.content_type}
                  </Badge>
                  {media.duration_seconds > 0 && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-white/10 bg-white/5 backdrop-blur-md px-3.5 py-1.5 text-xs text-white/60"
                    >
                      {formatDuration(media.duration_seconds)}
                    </Badge>
                  )}
                  {media.progress?.is_completed && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                    >
                      <CheckCircle2Icon className="mr-1.5 size-3.5 inline" />
                      Completed
                    </Badge>
                  )}
                  {sessionSummary?.content_completed && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-emerald-500/30 bg-emerald-500/15 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)] animate-pulse"
                    >
                      <CheckCircle2Icon className="mr-1.5 size-3.5 inline" />
                      Completed Now
                    </Badge>
                  )}
                </div>
              </div>

              {sessionSummary && (
                <div className="grid grid-cols-1 gap-4 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm p-5 sm:grid-cols-2 shadow-inner">
                  <div className="flex items-center gap-3 text-sm text-indigo-100/90">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <span className="text-indigo-200/80 font-medium tracking-wide">Attention score:</span>
                    <span className="font-bold tabular-nums text-white text-base">{sessionSummary.attention_score}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-indigo-100/90">
                    <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    <span className="text-violet-200/80 font-medium tracking-wide">Course progress:</span>
                    <span className="font-bold tabular-nums text-white text-base">{sessionSummary.course_progress_percentage.toFixed(2)}%</span>
                  </div>
                </div>
              )}

              {/* Expired notice */}
              {mediaExpired && (
                <MediaExpiredNotice
                  onRefresh={() => fetchContent(false)}
                  isRefreshing={isRefreshing}
                />
              )}

              {/* -- Video player -- */}
              {media.content_type === "video" && !mediaExpired && (
                <div className="relative aspect-video w-full overflow-hidden rounded-[2rem] bg-[#000] ring-1 ring-white/10 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]">
                  <VideoPlayer
                    src={media.media_url}
                    resumePosition={resumePos}
                    onExpired={() => setMediaExpired(true)}
                    onStartSession={() => ensureSessionStarted("video")}
                    onProgress={onVideoProgress}
                    onPause={onVideoPause}
                    onSeek={onVideoSeek}
                    onRateChange={onVideoRateChange}
                    onPlay={onVideoPlay}
                    onEnd={onVideoEnd}
                  />
                </div>
              )}

              {/* -- PDF viewer -- */}
              {media.content_type === "pdf" && !mediaExpired && (
                <div className="rounded-[2rem] overflow-hidden border border-white/10 ring-1 ring-black/5 shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]">
                  <PdfViewer
                    src={media.media_url}
                    resumePage={Math.max(1, Math.floor(resumePos))}
                    totalPages={media.pdf_total_pages}
                    onExpired={() => setMediaExpired(true)}
                    onOpenSession={onPdfOpen}
                    onPageChange={onPdfPageChange}
                  />
                </div>
              )}

              {/* Progress bar */}
              {pct > 0 && (
                <div className="space-y-3 mt-4 px-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-white/40 uppercase tracking-[0.2em]">
                    <span>Current progress</span>
                    <span className={`tabular-nums ${media.progress?.is_completed ? "text-emerald-400" : "text-white/80"}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
                    <div
                      className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                        media.progress?.is_completed
                          ? "bg-emerald-500 shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                          : "bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_20px_rgba(139,92,246,0.5)]"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Prev / Next navigation */}
              {(media.prev_content || media.next_content) && (
                <div className="flex items-center gap-4 border-t border-white/10 pt-6 mt-6">
                  {media.prev_content ? (
                    <button
                      type="button"
                      onClick={() => goToContent(media.prev_content!.id)}
                      className="group flex flex-1 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-left transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80 transition-colors">
                        <ChevronLeftIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">Previous Module</p>
                        <p className="truncate text-base font-semibold text-white/90 group-hover:text-white">
                          {media.prev_content.title}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {media.next_content ? (
                    <button
                      type="button"
                      onClick={() => goToContent(media.next_content!.id)}
                      className="group flex flex-1 items-center justify-end gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 text-right transition-all hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-1">Next Module</p>
                        <p className="truncate text-base font-semibold text-white/90 group-hover:text-white">
                          {media.next_content.title}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80 transition-colors">
                        <ChevronRightIcon className="size-5" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -- Sidebar (Modules) -- */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-80 transform border-l border-white/10 bg-[#06060c]/95 backdrop-blur-3xl transition-transform duration-300 lg:static lg:translate-x-0 lg:flex flex-col ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
            <BookOpenIcon className="size-4 text-indigo-400" />
            Curriculum
          </h2>
          <button 
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <XIcon className="size-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 p-4 space-y-6">
          {!course ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>
          ) : (
            course.modules.map((mod) => (
              <div key={mod.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest px-2">
                  Module {mod.order_number}
                </h3>
                <div className="flex flex-col gap-1">
                  {mod.content.map(c => {
                    const isActive = c.id === ctId
                    const isLocked = !c.is_unlocked
                    const isCompleted = c.progress?.is_completed
                    return (
                      <button
                        key={c.id}
                        disabled={isLocked}
                        onClick={() => {
                          if (!isLocked && !isActive) goToContent(c.id)
                          setSidebarOpen(false)
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          isActive 
                            ? "bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                            : isLocked 
                              ? "opacity-40 cursor-not-allowed" 
                              : "hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className={`flex shrink-0 items-center justify-center size-8 rounded-lg ${isActive ? "bg-indigo-500/20 text-indigo-400" : isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-white/50"}`}>
                          {isLocked ? <LockIcon className="size-3.5" /> : isCompleted ? <CheckCircle2Icon className="size-4" /> : c.content_type === 'video' ? <PlayCircleIcon className="size-3.5" /> : <FileTextIcon className="size-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-sm font-medium ${isActive ? "text-indigo-100" : "text-white/80"}`}>{c.title}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{formatDuration(c.duration_seconds)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  )
}
`;
content = content.replace(/\/\/ -- Render -+[\s\S]*\}\s*\n\}\s*/, renderPatch.trim() + "\n");

fs.writeFileSync(p, content, "utf-8");
console.log("Successfully rebuilt online-content-viewer-page.tsx");
