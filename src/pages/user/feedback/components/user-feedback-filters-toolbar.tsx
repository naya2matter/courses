// ─── UserFeedbackFiltersToolbar ───────────────────────────────────────────────
// Search (by title), status and type selects for the user feedback list.

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
import type { FeedbackStatus, FeedbackType, UserFeedbackFilters } from "../types/user-feedback.types"

interface UserFeedbackFiltersToolbarProps {
  filters: UserFeedbackFilters
  /** Local text search draft (client-side against loaded items) */
  searchText: string
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: Partial<UserFeedbackFilters>) => void
  onSearchTextChange: (v: string) => void
  onClearAll: () => void
}

export function UserFeedbackFiltersToolbar({
  filters,
  searchText,
  resultCount,
  onFilterChange,
  onSearchTextChange,
  onClearAll,
}: UserFeedbackFiltersToolbarProps) {
  const hasActive = !!filters.status || !!filters.type || searchText.trim().length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Local text search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title or description…"
            className="pl-9"
            value={searchText}
            onChange={(e) => onSearchTextChange(e.target.value)}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onFilterChange({ status: v === "all" ? undefined : (v as FeedbackStatus), page: 1 })
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
            onFilterChange({ type: v === "all" ? undefined : (v as FeedbackType), page: 1 })
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
