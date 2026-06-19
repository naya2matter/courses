import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  SearchIcon,
  Loader2Icon,
  MusicIcon,
  AlertCircleIcon,
  XIcon,
  CheckCircle2Icon,
  HeadphonesIcon,
  ListMusicIcon,
  CircleDashedIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

import { PageHeader } from "@/components/user/page-header"

import {
  getUserAudioList,
  formatDuration,
  getThumbnailUrl,
  type UserAudioListParams,
} from "./service/user-audio.service"
import type {
  UserAudioItem,
  UserAudioCard,
  PaginationMeta,
} from "./types/user-audio.types"

const PER_PAGE = 20

const CARD_META: Record<string, { icon: typeof ListMusicIcon; accent: string }> = {
  assigned_audios: { icon: ListMusicIcon, accent: "text-indigo-400" },
  completed_audios: { icon: CheckCircle2Icon, accent: "text-emerald-400" },
  in_progress_audios: { icon: HeadphonesIcon, accent: "text-amber-400" },
  remaining_audios: { icon: CircleDashedIcon, accent: "text-white/50" },
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  in_progress: { label: "In progress", cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  not_started: { label: "Not started", cls: "bg-white/5 text-white/50 border-white/10" },
}

function AudioCard({ item, onClick }: { item: UserAudioItem; onClick: () => void }) {
  const thumbnailUrl = getThumbnailUrl(item.thumbnail_path)
  const isCompleted = item.progress?.is_completed
  const pct = Math.round(item.progress?.completion_percentage ?? 0)
  const statusKey = isCompleted ? "completed" : pct > 0 ? "in_progress" : "not_started"
  const status = STATUS_CFG[statusKey]

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative h-[200px] w-full overflow-hidden rounded-2xl border border-white/8 text-left transition-colors hover:border-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[#0c0c14]">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={item.name ?? ""}
            className="h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <HeadphonesIcon className="size-14 text-white/5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        {/* Top row: status badge + duration chip */}
        <div className="flex items-start justify-between">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${status.cls}`}>
            {status.label}
          </span>
          {item.duration != null && (
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] tabular-nums text-white/70 backdrop-blur-sm">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>

        {/* Category */}
        {item.audio_category?.name && (
          <span className="text-[10px] font-medium text-indigo-300/80">
            {item.audio_category.name}
          </span>
        )}

        {/* Bottom: title + progress bar */}
        <div className="space-y-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
            {item.name ?? "Untitled audio"}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}

export function UserAudioPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<UserAudioItem[]>([])
  const [cards, setCards] = useState<UserAudioCard[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState("")
  const [activeSearch, setActiveSearch] = useState("")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchList = useCallback(async (params: UserAudioListParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getUserAudioList(params)
      setItems(response.data)
      setCards(response.cards ?? [])
      setMeta(response.meta)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) setError(err.message || "Failed to load audios.")
      else if (err instanceof Error) setError(err.message)
      else setError("Failed to load audios.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList({ per_page: PER_PAGE })
  }, [fetchList])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== activeSearch) {
        setActiveSearch(searchInput)
        void fetchList({ per_page: PER_PAGE, search: searchInput || undefined })
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, activeSearch, fetchList])

  return (
    <div className="flex flex-col gap-6 font-sans text-white">
      {/* ── Header ── */}
      <PageHeader
        title="My Audio"
        description="Listen to the audio content assigned to you."
        onRefresh={() => fetchList({ per_page: PER_PAGE, search: activeSearch || undefined })}
        refreshing={isLoading}
      />

      {/* ── Stat tiles ── */}
      {(cards.length > 0 || isLoading) && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isLoading && cards.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl bg-white/5" />
              ))
            : cards.map((card) => {
                const m = CARD_META[card.key] ?? { icon: ListMusicIcon, accent: "text-white/50" }
                const Icon = m.icon
                return (
                  <div
                    key={card.key}
                    className="rounded-xl border border-white/8 bg-card/40 px-4 py-3"
                  >
                    <p className="flex items-center gap-1.5 text-[11px] text-white/40">
                      <Icon className={`size-3.5 ${m.accent}`} />
                      {card.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-white">{card.value}</p>
                  </div>
                )
              })}
        </div>
      )}

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search audios…"
          className="h-10 rounded-full border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-indigo-500/50"
        />
        {isLoading && searchInput && (
          <Loader2Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
        )}
        {!isLoading && searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span className="flex items-center gap-2">
            <AlertCircleIcon className="size-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-full p-1 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Dismiss"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      <div>
        {activeSearch && (
          <p className="mb-3 px-1 text-sm text-white/40">
            Results for <span className="text-white/70">"{activeSearch}"</span>
          </p>
        )}

        {isLoading && items.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[200px] rounded-2xl bg-white/3" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/2 py-16 text-white/40">
            <MusicIcon className="mb-3 size-10 opacity-25" />
            <p className="text-sm">
              {activeSearch ? "No audios match your search." : "No audios assigned yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <AudioCard
                key={item.id}
                item={item}
                onClick={() => navigate(`/user/audio/${item.id}`)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.current_page <= 1 || isLoading}
              onClick={() =>
                fetchList({ page: meta.current_page - 1, per_page: meta.per_page, search: activeSearch || undefined })
              }
              className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              Previous
            </Button>
            <span className="text-xs text-white/40">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={meta.current_page >= meta.last_page || isLoading}
              onClick={() =>
                fetchList({ page: meta.current_page + 1, per_page: meta.per_page, search: activeSearch || undefined })
              }
              className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
