// ─── Video Management Page ────────────────────────────────────────────────────
// Admin page for managing video content:
//   • Dark glass summary cards (total, pending, completed, failed)
//   • VideoTable with search / category / status / per-page filters
//   • Create via Dialog, Edit via Sheet, Detail via Drawer
//   • Top-level fetch error banner with dismiss

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircleIcon,
  XIcon,
  Loader2Icon,
  RefreshCwIcon,
  PlusIcon,
  VideoIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

import { useVideoStore } from "./store/video.store"
import { VideoTable } from "./components/video-table"
import { getVideoCategories } from "../categories/service/category.service"
import type { VideoCategory } from "../categories/types/category.types"

// ── Summary card config ───────────────────────────────────────────────────────

const SUMMARY_CONFIG: Record<
  string,
  { icon: React.ElementType; accent: string; iconClass: string }
> = {
  total_videos: {
    icon: VideoIcon,
    accent: "border-sky-500/20 bg-sky-500/5",
    iconClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  pending_transcode: {
    icon: ClockIcon,
    accent: "border-amber-500/20 bg-amber-500/5",
    iconClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  completed_transcode: {
    icon: CheckCircleIcon,
    accent: "border-emerald-500/20 bg-emerald-500/5",
    iconClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  failed_transcode: {
    icon: XCircleIcon,
    accent: "border-red-500/20 bg-red-500/5",
    iconClass: "text-red-400 bg-red-500/10 border-red-500/20",
  },
}

// ── Summary card component ────────────────────────────────────────────────────

function SummaryCard({
  cardKey,
  title,
  value,
  isLoading,
}: {
  cardKey: string
  title: string
  value: number | string
  isLoading: boolean
}) {
  const cfg = SUMMARY_CONFIG[cardKey]
  const Icon = cfg?.icon ?? VideoIcon
  // const accent = cfg?.accent ?? "border-white/10 bg-white/3"
  const iconClass = cfg?.iconClass ?? "text-muted-foreground bg-white/5 border-white/10"

  return (
    <div
      className={`flex flex-col items-center text-center rounded-2xl  p-6 backdrop-blur-sm `}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl border mb-3 ${iconClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      {isLoading ? (
        <Skeleton className="h-10 w-20 mb-2" />
      ) : (
        <p className="text-4xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
      )}
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoManagementPage() {
  const navigate = useNavigate()
  const {
    items,
    summaryCards,
    paginationMeta,
    isLoading,
    error,
    filters,
    fetchVideos,
    setFilters,
    updateVideo,
    deleteVideo,
    retryTranscode,
    clearError,
  } = useVideoStore()

  const [categories, setCategories] = useState<VideoCategory[]>([])  

  useEffect(() => {
    fetchVideos()
    getVideoCategories({ per_page: 200 })
      .then((r) => setCategories(r.items))
      .catch(() => {/* best-effort */})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build display cards — fallback to computed values when API doesn't return them
  const displayCards =
    summaryCards.length > 0
      ? summaryCards
      : [
          { key: "total_videos", title: "Total Videos", value: items.length },
          {
            key: "pending_transcode",
            title: "Pending Transcode",
            value: items.filter((v) => v.transcode_status === "pending").length,
          },
          {
            key: "completed_transcode",
            title: "Completed",
            value: items.filter((v) => v.transcode_status === "completed").length,
          },
          {
            key: "failed_transcode",
            title: "Failed",
            value: items.filter((v) => v.transcode_status === "failed").length,
          },
        ]

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage uploaded learning videos, categories, and transcode status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button onClick={() => navigate("/admin/video-management/video/create")} disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload Video
          </Button>
          <Button variant="outline" onClick={() => fetchVideos()} disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCards.map((card) => (
          <SummaryCard
            key={card.key}
            cardKey={card.key}
            title={card.title}
            value={card.value}
            isLoading={isLoading && items.length === 0}
          />
        ))}
      </section>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load videos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* ── Video table / cards ──────────────────────────────────────────── */}
      <VideoTable
        items={items}
        isLoading={isLoading}
        filters={filters}
        paginationMeta={paginationMeta}
        categories={categories}
        onRefetch={() => fetchVideos()}
        onUpdate={updateVideo}
        onDelete={deleteVideo}
        onRetry={retryTranscode}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
