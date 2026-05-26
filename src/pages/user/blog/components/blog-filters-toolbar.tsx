// ─── BlogFiltersToolbar ───────────────────────────────────────────────────────
// Premium glassmorphic filter bar — search, media type, author, per-page.
// Identical external API to previous version.

import { useEffect, useRef, useState } from "react"
import { FilterIcon, SearchIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ── Types ─────────────────────────────────────────────────────────────────────

export type MediaTypeFilter = "all" | "Text" | "Video" | "Audio"

interface BlogFiltersToolbarProps {
  search: string
  mediaType: MediaTypeFilter
  authorId: string
  perPage: number
  authors: Array<{ id: number; name: string }>
  onSearchChange: (v: string) => void
  onMediaTypeChange: (v: MediaTypeFilter) => void
  onAuthorChange: (v: string) => void
  onPerPageChange: (v: number) => void
  onClear: () => void
  resultCount: number
  totalCount: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countActive(
  search: string,
  mediaType: MediaTypeFilter,
  authorId: string,
): number {
  return (
    (search.trim() ? 1 : 0) +
    (mediaType !== "all" ? 1 : 0) +
    (authorId !== "all" ? 1 : 0)
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogFiltersToolbar({
  search,
  mediaType,
  authorId,
  perPage,
  authors,
  onSearchChange,
  onMediaTypeChange,
  onAuthorChange,
  onPerPageChange,
  onClear,
  resultCount,
  totalCount,
}: BlogFiltersToolbarProps) {
  const [draft, setDraft] = useState(search)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync draft when parent resets search (e.g. clear)
  useEffect(() => {
    setDraft(search)
  }, [search])

  // Debounce: commit draft to parent after 300 ms of inactivity
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (draft !== search) onSearchChange(draft)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [draft, search, onSearchChange])

  const activeCount = countActive(search, mediaType, authorId)

  function clearSearch() {
    setDraft("")
    onSearchChange("")
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
      {/* Label */}
      <div className="flex shrink-0 items-center gap-2 border-r border-white/[0.07] pr-3">
        <FilterIcon className="size-3.5 text-primary/70" />
        <span className="text-sm font-medium text-white/60">Search & Filter</span>
        {activeCount > 0 && (
          <Badge className="h-4 min-w-[1.25rem] rounded-full border-primary/30 bg-primary/10 px-1.5 text-[10px] tabular-nums text-primary">
            {activeCount}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative min-w-0 flex-1 basis-44">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search title, excerpt, tags…"
          aria-label="Search posts"
          className="h-8 rounded-lg border-white/10 bg-white/5 pl-8 text-sm focus-visible:ring-1 focus-visible:ring-primary/50"
        />
        {draft && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/70"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      {/* Media type */}
      <Select
        value={mediaType}
        onValueChange={(v) => onMediaTypeChange(v as MediaTypeFilter)}
      >
        <SelectTrigger className="h-8 w-32 rounded-lg border-white/10 bg-white/5 text-sm">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="Text">Article</SelectItem>
          <SelectItem value="Video">Video</SelectItem>
          <SelectItem value="Audio">Audio</SelectItem>
        </SelectContent>
      </Select>

      {/* Author — only when 2+ distinct authors */}
      {authors.length > 1 && (
        <Select value={authorId} onValueChange={onAuthorChange}>
          <SelectTrigger className="h-8 w-36 rounded-lg border-white/10 bg-white/5 text-sm">
            <SelectValue placeholder="All Authors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Authors</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Per page */}
      <Select
        value={String(perPage)}
        onValueChange={(v) => onPerPageChange(Number(v))}
      >
        <SelectTrigger className="h-8 w-[6.5rem] rounded-lg border-white/10 bg-white/5 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[10, 15, 20, 30].map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n} / page
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Result count */}
      <span className="ml-auto shrink-0 text-[11px] text-white/30">
        {resultCount === totalCount
          ? `${totalCount} post${totalCount !== 1 ? "s" : ""}`
          : `${resultCount} of ${totalCount}`}
      </span>

      {/* Clear — only when filters are active */}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 gap-1 rounded-lg px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/80"
        >
          <XIcon className="size-3" />
          Clear
        </Button>
      )}
    </div>
  )
}

