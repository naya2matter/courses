// ─── FeedbackFiltersToolbar ───────────────────────────────────────────────────
// Search + select filters + result count for the feedback list.

import { useEffect, useRef, useState } from "react"
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
import type { FeedbackFilters, FeedbackStatus, FeedbackType } from "../types/feedback.types"

interface FeedbackFiltersToolbarProps {
  filters: FeedbackFilters
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: FeedbackFilters) => void
  onClearAll: () => void
}

export function FeedbackFiltersToolbar({
  filters,
  resultCount,
  onFilterChange,
  onClearAll,
}: FeedbackFiltersToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  function commitSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
    }, 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  const hasActive =
    !!filters.search || !!filters.status || !!filters.type

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title or description…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch()
            }}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              status: v === "all" ? undefined : (v as FeedbackStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select
          value={filters.type ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              type: v === "all" ? undefined : (v as FeedbackType),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
            <SelectItem value="feature_request">Feature Request</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={onClearAll}
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Result count */}
      {resultCount && (
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {resultCount.from}–{resultCount.to}
          </span>{" "}
          of{" "}
          <span className="font-medium text-foreground">{resultCount.total}</span>{" "}
          results
        </p>
      )}
    </div>
  )
}
