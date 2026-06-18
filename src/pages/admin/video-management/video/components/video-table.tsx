// ─── Video Table ──────────────────────────────────────────────────────────────
// Full-featured responsive video list:
//   • Desktop: shadcn Table
//   • Mobile: card grid
//   • Filters: search (debounced), category, transcode_status, per-page
//   • Row / card click → VideoDetailDrawer
//   • Edit row action → EditVideoSheet
//   • Delete → ConfirmDeleteDialog (shared) with 422 linked-records handling
//   • Loading skeletons, empty states
//   • Pagination controls

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  Trash2Icon,
  VideoIcon,
  ClockIcon,
  HardDriveIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { isApiError } from "@/lib/api"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"
import { EditVideoSheet } from "./edit-video-sheet"
import type {
  Video,
  VideoFilters,
  VideoListResponse,
  UpdateVideoPayload,
  VideoDetail,
} from "../types/video.types"
import type { VideoCategory } from "../../categories/types/category.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface VideoTableProps {
  items: Video[]
  isLoading: boolean
  filters: VideoFilters
  paginationMeta: VideoListResponse["meta"] | null
  categories: VideoCategory[]
  onRefetch: () => void
  onUpdate: (id: number, payload: UpdateVideoPayload) => Promise<VideoDetail>
  onDelete: (id: number) => Promise<void>
  onRetry: (id: number) => Promise<void>
  onFiltersChange: (filters: VideoFilters) => void
}

// ── Status config ─────────────────────────────────────────────────────────────

type TranscodeStatus = Video["transcode_status"]

const STATUS_CONFIG: Record<
  TranscodeStatus,
  { label: string; className: string; dotClass: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/15",
    dotClass: "bg-amber-400",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/15",
    dotClass: "bg-blue-400",
  },
  completed: {
    label: "Ready",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15",
    dotClass: "bg-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-400 border-red-500/25 hover:bg-red-500/15",
    dotClass: "bg-red-400",
  },
}

function TranscodeStatusBadge({ status }: { status: TranscodeStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn("text-xs gap-1.5 whitespace-nowrap", cfg.className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotClass)} />
      {cfg.label}
    </Badge>
  )
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatFileSize(bytes?: number | null): string {
  if (bytes == null) return "—"
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" })
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-3.5 w-7" /></TableCell>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-14" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-12" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ── Mobile card skeletons ─────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </>
  )
}

// ── Video thumbnail/icon ──────────────────────────────────────────────────────

function VideoThumb({ video }: { video: Video }) {
  const cfg = STATUS_CONFIG[video.transcode_status]
  const [hasImageError, setHasImageError] = useState(false)
  const thumbnailUrl = typeof video.thumbnail_path === "string" ? video.thumbnail_path.trim() : ""

  return (
    <div
      className={cn(
        "relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
        "bg-white/5 border-white/10",
      )}
    >
      {thumbnailUrl && !hasImageError ? (
        <img
          src={thumbnailUrl}
          alt={`Thumbnail for ${video.name}`}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <VideoIcon className="h-4 w-4 text-muted-foreground/50" />
      )}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background",
          cfg.dotClass,
        )}
      />
    </div>
  )
}

// ── Mobile video card ─────────────────────────────────────────────────────────

function VideoCard({
  video,
  onDetail,
  onEdit,
  onDelete,
  onRetry,
  retryingId,
}: {
  video: Video
  onDetail: (id: number) => void
  onEdit: (v: Video) => void
  onDelete: (v: Video) => void
  onRetry: (v: Video) => void
  retryingId: number | null
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/3 p-4 cursor-pointer"
      onClick={() => onDetail(video.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onDetail(video.id) }}
      aria-label={`Open details for ${video.name}`}
    >
      <div className="flex items-start gap-3">
        <VideoThumb video={video} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight line-clamp-1">{video.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {video.video_category?.name ?? "—"}
          </p>
        </div>
        <TranscodeStatusBadge status={video.transcode_status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {video.creator && (
          <span className="flex items-center gap-1">
            <span className="opacity-60">by</span> {video.creator.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {formatDuration(video.duration_seconds)}
        </span>
        <span className="flex items-center gap-1">
          <HardDriveIcon className="h-3 w-3" />
          {formatFileSize(video.file_size)}
        </span>
        <span className="ml-auto">{formatDate(video.created_at)}</span>
      </div>

      <div
        className="mt-3 flex justify-end gap-1 border-t border-white/6 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {video.transcode_status === "failed" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            disabled={retryingId === video.id}
            onClick={() => onRetry(video)}
          >
            {retryingId === video.id ? (
              <Loader2Icon className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcwIcon className="mr-1 h-3.5 w-3.5" />
            )}
            Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onEdit(video)}
        >
          <PencilIcon className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(video)}
        >
          <Trash2Icon className="mr-1 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VideoTable(
  {
    items,
    isLoading,
    filters,
    paginationMeta,
    categories,
    onRefetch,
    onUpdate,
    onDelete,
    onRetry,
    onFiltersChange,
  }: VideoTableProps,
) {
    const navigate = useNavigate()

    // ── Sheet state ─────────────────────────────────────────────────────────
    const [editVideo, setEditVideo] = useState<Video | null>(null)
    // ── Retry state ─────────────────────────────────────────────────────────
    const [retryingId, setRetryingId] = useState<number | null>(null)

    // ── Delete state ────────────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<Video | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // ── Search debounce ─────────────────────────────────────────────────────
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [searchInput, setSearchInput] = useState(filters.search ?? "")

    useEffect(() => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      searchTimerRef.current = setTimeout(() => {
        if (searchInput !== (filters.search ?? "")) {
          onFiltersChange({ ...filters, search: searchInput, page: 1 })
        }
      }, 350)
      return () => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput])

    // ── Pagination helpers ──────────────────────────────────────────────────
    const currentPage = paginationMeta?.current_page ?? filters.page ?? 1
    const lastPage = paginationMeta?.last_page ?? 1
    const canPrev = currentPage > 1
    const canNext = currentPage < lastPage

    const handlePageChange = useCallback(
      (page: number) => onFiltersChange({ ...filters, page }),
      [filters, onFiltersChange],
    )

    // ── Delete handler ──────────────────────────────────────────────────────
    async function handleDeleteConfirm() {
      if (!deleteTarget) return
      setIsDeleting(true)
      setDeleteError(null)
      try {
        await onDelete(deleteTarget.id)
        toast.success(`"${deleteTarget.name}" deleted.`)
        setDeleteTarget(null)
        onRefetch()
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setIsDeleting(false)
          return
        }
        if (isApiError(err)) {
          if (err.status === 422) {
            setDeleteError(
              "This item cannot be deleted because it has linked records. Reassign or delete them first.",
            )
          } else {
            setDeleteError(err.message || "Failed to delete video.")
          }
        } else if (err instanceof Error) {
          setDeleteError(err.message)
        } else {
          setDeleteError("Failed to delete video.")
        }
      } finally {
        setIsDeleting(false)
      }
    }

    function openDelete(video: Video) {
      setDeleteError(null)
      setDeleteTarget(video)
    }

    // ── Retry transcode handler ─────────────────────────────────────────────
    async function handleRetry(video: Video) {
      setRetryingId(video.id)
      try {
        await onRetry(video.id)
        toast.success(`"${video.name}" queued for re-transcode.`)
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to retry transcode.",
        )
      } finally {
        setRetryingId(null)
      }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
      <>
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Row 1: search + refresh */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search videos…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Category filter */}
              <Select
                value={
                  filters.video_category_id != null
                    ? String(filters.video_category_id)
                    : "all"
                }
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    video_category_id: v === "all" ? null : Number(v),
                    page: 1,
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={filters.transcode_status ?? "all"}
                onValueChange={(v) =>
                  onFiltersChange({
                    ...filters,
                    transcode_status:
                      v === "all" ? null : (v as Video["transcode_status"]),
                    page: 1,
                  })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-9 w-37.5">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Ready</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={onRefetch}
                disabled={isLoading}
                className="h-9 w-9 p-0"
                aria-label="Refresh"
              >
                {isLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Desktop Table (md+) ───────────────────────────────────────── */}
        <div className="hidden md:block rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <VideoIcon className="h-10 w-10 opacity-25" />
                      {filters.search || filters.video_category_id || filters.transcode_status ? (
                        <>
                          <p className="text-sm font-medium">No videos match your filters</p>
                          <p className="text-xs">Try adjusting or clearing the filters above.</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">No videos yet</p>
                          <p className="text-xs">Upload the first video to get started.</p>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((video) => (
                  <TableRow
                    key={video.id}
                    className="border-white/6 cursor-pointer hover:bg-transparent"
                    onClick={() => navigate(`/admin/video-management/video/${video.id}`)}
                  >
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {video.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <VideoThumb video={video} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{video.name}</p>
                          {video.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {video.video_category?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {video.creator?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <TranscodeStatusBadge status={video.transcode_status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDuration(video.duration_seconds)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatFileSize(video.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(video.created_at)}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-1">
                        {video.transcode_status === "failed" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                            onClick={() => handleRetry(video)}
                            disabled={retryingId === video.id}
                            aria-label={`Retry transcode for ${video.name}`}
                          >
                            {retryingId === video.id ? (
                              <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcwIcon className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditVideo(video)}
                          aria-label={`Edit ${video.name}`}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDelete(video)}
                          aria-label={`Delete ${video.name}`}
                        >
                          <Trash2Icon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ── Desktop Pagination (inside table card) ───────────────── */}
          <div className="flex items-center justify-between border-t border-white/8 px-4 py-3 text-sm text-muted-foreground">
            <span>
              {paginationMeta?.from != null && paginationMeta?.to != null
                ? `Showing ${paginationMeta.from}–${paginationMeta.to} of ${paginationMeta.total?.toLocaleString() ?? 0}`
                : paginationMeta?.total != null
                  ? `${paginationMeta.total.toLocaleString()} videos`
                  : null}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(filters.per_page ?? 15)}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, per_page: Number(v), page: 1 })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lastPage > 1 && (
                <>
                  <span className="text-xs tabular-nums">{currentPage} / {lastPage}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canPrev || isLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canNext || isLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Cards (< md) ───────────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <CardSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground rounded-xl border border-white/10">
              <VideoIcon className="h-8 w-8 opacity-25" />
              {filters.search || filters.video_category_id || filters.transcode_status ? (
                <p className="text-sm">No videos match your filters</p>
              ) : (
                <p className="text-sm">No videos yet</p>
              )}
            </div>
          ) : (
            items.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDetail={(id) => navigate(`/admin/video-management/video/${id}`)}
                onEdit={(v) => setEditVideo(v)}
                onDelete={(v) => openDelete(v)}
                onRetry={(v) => handleRetry(v)}
                retryingId={retryingId}
              />
            ))
          )}

          {/* ── Mobile Pagination ─────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
            <span>
              {paginationMeta?.from != null && paginationMeta?.to != null
                ? `Showing ${paginationMeta.from}–${paginationMeta.to} of ${paginationMeta.total?.toLocaleString() ?? 0}`
                : paginationMeta?.total != null
                  ? `${paginationMeta.total.toLocaleString()} videos`
                  : null}
            </span>
            <div className="flex items-center gap-2">
              <Select
                value={String(filters.per_page ?? 15)}
                onValueChange={(v) =>
                  onFiltersChange({ ...filters, per_page: Number(v), page: 1 })
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 15, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lastPage > 1 && (
                <>
                  <span className="text-xs tabular-nums">{currentPage} / {lastPage}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canPrev || isLoading}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!canNext || isLoading}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit Sheet ────────────────────────────────────────────────── */}
        <EditVideoSheet
          open={editVideo !== null}
          onClose={() => setEditVideo(null)}
          onSuccess={() => {
            setEditVideo(null)
            toast.success("Video updated.")
            onRefetch()
          }}
          video={editVideo}
          categories={categories}
          onUpdate={onUpdate}
        />

        {/* ── Delete Confirm ─────────────────────────────────────────────── */}
        <ConfirmDeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(o) => {
            if (!o && !isDeleting) {
              setDeleteTarget(null)
              setDeleteError(null)
            }
          }}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleDeleteConfirm}
        />
      </>
    )
}
