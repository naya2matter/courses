// ─── BlogFiltersToolbar ───────────────────────────────────────────────────────
// Search + select filters + result count for the blog post list.
// Search is applied client-side (title / excerpt / description).

import { useState } from "react"
import { SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BlogPostStatus } from "../types/blog.types"

export type MediaFilter = "all" | "text" | "video" | "audio"

interface BlogFiltersToolbarProps {
  searchValue: string
  statusFilter: BlogPostStatus | "all"
  mediaFilter: MediaFilter
  perPage: number
  resultCount: { from: number; to: number; total: number } | null
  onSearchChange: (v: string) => void
  onStatusChange: (v: BlogPostStatus | "all") => void
  onMediaChange: (v: MediaFilter) => void
  onPerPageChange: (v: number) => void
  onClearAll: () => void
}

export function BlogFiltersToolbar({
  searchValue,
  statusFilter,
  mediaFilter,
  perPage,
  resultCount,
  onSearchChange,
  onStatusChange,
  onMediaChange,
  onPerPageChange,
  onClearAll,
}: BlogFiltersToolbarProps) {
  const [draft, setDraft] = useState(searchValue)

  const hasActive =
    !!searchValue || statusFilter !== "all" || mediaFilter !== "all"

  function commitSearch(value: string) {
    onSearchChange(value.trim())
  }

  function handleClear() {
    setDraft("")
    onClearAll()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title, excerpt, description…"
            className="pl-9"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              // Live search with debounce-like commit on each change
              commitSearch(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft("")
                commitSearch("")
              }
            }}
          />
        </div>

        {/* Status */}
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusChange(v as BlogPostStatus | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        {/* Media type */}
        <Select
          value={mediaFilter}
          onValueChange={(v) => onMediaChange(v as MediaFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Media type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="text">Text only</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>

        {/* Per page */}
        <Select
          value={String(perPage)}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="15">15 / page</SelectItem>
            <SelectItem value="25">25 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Result count */}
      {resultCount && (
        <p className="text-xs text-muted-foreground">
          Showing {resultCount.from}–{resultCount.to} of {resultCount.total} posts
        </p>
      )}
    </div>
  )
}
