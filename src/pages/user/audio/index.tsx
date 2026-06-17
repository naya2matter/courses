import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  SearchIcon,
  Loader2Icon,
  MusicIcon,
  AlertCircleIcon,
  XIcon,
  CheckCircle2Icon,
  PlayIcon,
  HeadphonesIcon,
  ListMusicIcon,
  CircleDashedIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"

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

const HERO_IMAGE = "/ChatGPT Image May 6, 2026, 01_54_18 PM.png"
const PER_PAGE = 20

// Map the backend card keys → an icon + accent for the stat tiles.
const CARD_META: Record<string, { icon: typeof ListMusicIcon; accent: string }> = {
  assigned_audios: { icon: ListMusicIcon, accent: "text-indigo-400" },
  completed_audios: { icon: CheckCircle2Icon, accent: "text-emerald-400" },
  in_progress_audios: { icon: HeadphonesIcon, accent: "text-amber-400" },
  remaining_audios: { icon: CircleDashedIcon, accent: "text-white/50" },
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
      {/* ── Hero ── */}
      <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-white/10 md:h-60">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12] via-[#0a0a12]/70 to-[#0a0a12]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.25),transparent_55%)]" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 backdrop-blur">
            <HeadphonesIcon className="size-3" />
            Audio Library
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-4xl">
            My Audio
          </h1>
          <p className="mt-1 text-sm text-white/55">
            Listen to the audio content assigned to you.
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {(cards.length > 0 || isLoading) && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isLoading && cards.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />
              ))
            : cards.map((card) => {
                const m = CARD_META[card.key] ?? {
                  icon: ListMusicIcon,
                  accent: "text-white/50",
                }
                const Icon = m.icon
                return (
                  <div
                    key={card.key}
                    className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/45">{card.title}</span>
                      <Icon className={`size-4 ${m.accent}`} />
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {card.value}
                    </span>
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

      {/* ── List ── */}
      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-white/70">
          {activeSearch ? `Results for “${activeSearch}”` : "All audios"}
        </h2>

        {isLoading && items.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] py-16 text-white/40">
            <MusicIcon className="mb-3 size-10 opacity-25" />
            <p className="text-sm">
              {activeSearch ? "No audios match your search." : "No audios assigned yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item) => {
              const thumbnailUrl = getThumbnailUrl(item.thumbnail_path)
              const isCompleted = item.progress?.is_completed
              const pct = Math.round(item.progress?.completion_percentage ?? 0)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/user/audio/${item.id}`)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                >
                  {/* Thumb + play overlay */}
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).style.display = "none"
                        }}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <MusicIcon className="size-5 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <PlayIcon className="size-5 text-white" fill="currentColor" />
                    </div>
                  </div>

                  {/* Title + category */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white group-hover:text-white">
                      {item.name ?? "Untitled audio"}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {item.audio_category?.name ?? "Uncategorised"}
                    </p>
                  </div>

                  {/* Progress / status */}
                  <div className="hidden items-center gap-2 sm:flex">
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2Icon className="size-3.5" />
                        Done
                      </span>
                    ) : pct > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] tabular-nums text-white/40">
                          {pct}%
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-white/40">
                    {formatDuration(item.duration)}
                  </span>
                </button>
              )
            })}
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
                fetchList({
                  page: meta.current_page - 1,
                  per_page: meta.per_page,
                  search: activeSearch || undefined,
                })
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
                fetchList({
                  page: meta.current_page + 1,
                  per_page: meta.per_page,
                  search: activeSearch || undefined,
                })
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
