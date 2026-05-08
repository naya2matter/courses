import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlayIcon,
  SearchIcon,
  Loader2Icon,
  MusicIcon,
  AlertCircleIcon,
  XIcon,
  CheckCircle2Icon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { isApiError } from '@/lib/api'

import {
  getUserAudioList,
  formatDuration,
  getThumbnailUrl,
  type UserAudioListParams,
} from './service/user-audio.service'
import type {
  UserAudioItem,
  PaginationMeta,
} from './types/user-audio.types'

export function UserAudioPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState<UserAudioItem[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchList = useCallback(async (params: UserAudioListParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getUserAudioList(params)
      setItems(response.data)
      setMeta(response.meta)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      if (isApiError(err)) {
        setError(err.message || 'Failed to load audios.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load audios.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchList({ per_page: 20 })
  }, [fetchList])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== activeSearch) {
        setActiveSearch(searchInput)
        void fetchList({ per_page: 20, search: searchInput || undefined })
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchInput, activeSearch, fetchList])

  return (
    <div className="min-h-[calc(100vh-4rem)] text-foreground font-sans">
      {/* Search Header */}
      <div className="mb-6 relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search audios..."
          className="border-white/10 bg-white/5 pl-9 text-foreground placeholder:text-muted-foreground h-10 rounded-full focus-visible:ring-1 focus-visible:ring-primary/50"
        />
        {isLoading && searchInput && (
          <Loader2Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6 bg-red-500/10 border-red-500/20 text-red-400">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="icon" className="size-6" onClick={() => setError(null)}>
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Hero Banner perfectly matching image */}
      <div className="relative h-72 md:h-80 w-full rounded-3xl overflow-hidden mb-8 group border border-border/50">
        {/* Full Image background */}
        <div 
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        >
          <img src="/ChatGPT Image May 6, 2026, 01_54_18 PM.png" className="object-cover w-full h-full" alt="Hero" />
        </div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />

        {/* Bottom Hero Content */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-4">
            <div className="size-24 md:size-32 rounded-full overflow-hidden border-4 border-background shadow-2xl shrink-0 bg-muted">
              <img 
                src="/ChatGPT Image May 6, 2026, 01_54_18 PM.png"
                alt="Artist"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mb-2">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                Audio Stream
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Musics List (Taking 2/3 space) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold">Musics</h2>
            <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Show all</span>
          </div>

          {isLoading && items.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl bg-card" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MusicIcon className="size-12 mb-4 opacity-20" />
              <p>No musics found.</p>
            </div>
          ) : (
            <div className="flex flex-col text-sm">
              {items.map((item) => {
                const thumbnailUrl = getThumbnailUrl(item.thumbnail_path)
                const duration = formatDuration(item.duration)
                const isCompleted = item.progress?.is_completed
                const pct = item.progress?.completion_percentage ?? 0

                return (
                  <div 
                      key={item.id}
                      onClick={() => navigate(`/user/audio/${item.id}`)}
                      className="group flex items-center justify-between py-2.5 px-3 hover:bg-card/50 rounded-xl transition-colors cursor-pointer border-b border-border/40 last:border-0 w-full"
                    >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Thumbnail or Hover Play */}
                      <div className="relative size-12 rounded-md overflow-hidden bg-muted shrink-0">
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // If image fails to load, replace it with a generic music icon placeholder
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
                              (e.target as HTMLImageElement).parentElement?.insertAdjacentHTML('beforeend', '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-music text-muted-foreground"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>');
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <MusicIcon className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayIcon className="size-5 fill-white text-white" />
                        </div>
                      </div>

                      {/* Title & Artist */}
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground transition-colors line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-muted-foreground">
                      {/* Optional Progress Mini-indicator */}
                      <span className="hidden sm:block text-xs truncate w-32">
                        {item.audio_category?.name || 'Album'}
                      </span>

                      {pct > 0 && !isCompleted && (
                        <div className="hidden md:block w-16 h-1 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      {isCompleted && (
                        <CheckCircle2Icon className="size-4 text-emerald-500 hidden md:block" />
                      )}

                      <span className="tabular-nums w-10 text-right">{duration}</span>
                      
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.current_page <= 1 || isLoading}
                onClick={() => fetchList({ page: meta.current_page - 1, per_page: meta.per_page, search: activeSearch || undefined })}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full"
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={meta.current_page >= meta.last_page || isLoading}
                onClick={() => fetchList({ page: meta.current_page + 1, per_page: meta.per_page, search: activeSearch || undefined })}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full"
              >
                Next
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
