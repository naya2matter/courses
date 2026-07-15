// ─── OnlineCourseFiltersToolbar ───────────────────────────────────────────────
// Search + status filter + sort control + date range + per-page for the
// online courses list. The list renders as a card grid, so instead of a
// SortableHead the sort is exposed as a compact Select + direction toggle.

import { useEffect, useRef, useState } from "react"
import {
  ArrowDownWideNarrowIcon,
  ArrowUpDownIcon,
  ArrowUpNarrowWideIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerField } from "@/components/ui/date-picker"
import type { OnlineCourseFilters, OnlineCourseStatus } from "../types/online-course.types"

// ── Sort field allow-list (wire ONLY these) ────────────────────────────────────

const SORT_FIELDS: { value: string; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "created_at", label: "Created" },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface OnlineCourseFiltersToolbarProps {
  filters: OnlineCourseFilters
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: Partial<OnlineCourseFilters>) => void
  onClearAll: () => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnlineCourseFiltersToolbar({
  filters,
  resultCount,
  onFilterChange,
  onClearAll,
  viewMode,
  onViewModeChange,
}: OnlineCourseFiltersToolbarProps) {
  // Local draft so we can debounce; committed to the store 400ms after typing.
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const searchMounted = useRef(false)

  // Debounce search — skip the initial mount so we don't double-fetch.
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true
      return
    }
    const id = setTimeout(() => {
      onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
    }, 400)
    return () => clearTimeout(id)
  }, [searchDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  const direction = filters.direction ?? "asc"
  const DirectionIcon = !filters.sort
    ? ArrowUpDownIcon
    : direction === "asc"
      ? ArrowUpNarrowWideIcon
      : ArrowDownWideNarrowIcon

  const hasActive = Boolean(
    filters.search || filters.status || filters.date_from || filters.date_to,
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Search + view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            className="w-full pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
            }}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <GridIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-2">
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

        {/* Sort field + direction toggle */}
        <div className="flex items-center gap-1.5">
          <Select
            value={filters.sort ?? ""}
            onValueChange={(v) =>
              onFilterChange({ sort: v, direction, page: 1 })
            }
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_FIELDS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!filters.sort}
            aria-label={
              direction === "asc" ? "Sort ascending" : "Sort descending"
            }
            onClick={() =>
              onFilterChange({
                direction: direction === "asc" ? "desc" : "asc",
                page: 1,
              })
            }
          >
            <DirectionIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Created date range */}
        <DatePickerField
          value={filters.date_from ?? ""}
          onChange={(v) => onFilterChange({ date_from: v || undefined, page: 1 })}
          placeholder="Created from"
          className="w-40"
        />
        <DatePickerField
          value={filters.date_to ?? ""}
          onChange={(v) => onFilterChange({ date_to: v || undefined, page: 1 })}
          placeholder="Created to"
          className="w-40"
        />

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
