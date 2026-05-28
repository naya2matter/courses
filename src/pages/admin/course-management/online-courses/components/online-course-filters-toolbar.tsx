// ─── OnlineCourseFiltersToolbar ───────────────────────────────────────────────
// Search + status filter + result count for the online courses list.

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
import type { OnlineCourseFilters, OnlineCourseStatus } from "../types/online-course.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseFiltersToolbarProps {
  filters: OnlineCourseFilters
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: Partial<OnlineCourseFilters>) => void
  onClearAll: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnlineCourseFiltersToolbar({
  filters,
  resultCount,
  onFilterChange,
  onClearAll,
}: OnlineCourseFiltersToolbarProps) {
  // Local draft so we only commit on Enter / blur, not every keystroke
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")

  function commitSearch() {
    onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
  }

  const hasActive = Boolean(filters.search || filters.status)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch()
            }}
            onBlur={commitSearch}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              status: v === "all" ? undefined : (v as OnlineCourseStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear all */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchDraft("")
              onClearAll()
            }}
            className="gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Result count */}
      {resultCount !== null && (
        <p className="text-sm text-muted-foreground">
          {resultCount.total === 0
            ? "No courses found"
            : `Showing ${resultCount.from}–${resultCount.to} of ${resultCount.total} course${resultCount.total !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  )
}
