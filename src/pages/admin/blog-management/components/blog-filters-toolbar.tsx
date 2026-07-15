// ─── BlogFiltersToolbar ───────────────────────────────────────────────────────
// Server-driven search + status filter + created-at date range for the blog
// post list. Every control dispatches to the store via onFilterChange so the
// backend is authoritative — nothing is filtered client-side here.

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
import { DatePickerField } from "@/components/ui/date-picker"
import type { BlogPostFilters, BlogPostStatus } from "../types/blog.types"

const STATUS_ALL = "__all__"

interface BlogFiltersToolbarProps {
  filters: BlogPostFilters
  onFilterChange: (f: Partial<BlogPostFilters>) => void
}

export function BlogFiltersToolbar({
  filters,
  onFilterChange,
}: BlogFiltersToolbarProps) {
  // Local draft for the search box; committed to the server after a debounce.
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const searchMounted = useRef(false)

  // Keep the draft in sync when the search filter is cleared externally
  // (e.g. the table's empty-state "Clear filters" button).
  useEffect(() => {
    setSearchDraft(filters.search ?? "")
  }, [filters.search])

  // Debounce search — skip the initial mount and skip redundant dispatches
  // so we don't double-fetch.
  useEffect(() => {
    if (!searchMounted.current) {
      searchMounted.current = true
      return
    }
    const id = setTimeout(() => {
      const next = searchDraft.trim()
      if (next !== (filters.search ?? "")) {
        onFilterChange({ search: next, page: 1 })
      }
    }, 400)
    return () => clearTimeout(id)
  }, [searchDraft]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasActive =
    !!filters.search ||
    !!filters.status ||
    !!filters.date_from ||
    !!filters.date_to

  function handleClear() {
    setSearchDraft("")
    onFilterChange({
      search: "",
      status: "",
      date_from: "",
      date_to: "",
      page: 1,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title, excerpt, author…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchDraft("")
            }}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status ? filters.status : STATUS_ALL}
          onValueChange={(v) =>
            onFilterChange({
              status: v === STATUS_ALL ? "" : (v as BlogPostStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={STATUS_ALL}>All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        {/* Created-at date range */}
        <DatePickerField
          value={filters.date_from ?? ""}
          onChange={(v) => onFilterChange({ date_from: v, page: 1 })}
          placeholder="Created from"
          className="h-9 w-36 text-xs"
        />
        <DatePickerField
          value={filters.date_to ?? ""}
          onChange={(v) => onFilterChange({ date_to: v, page: 1 })}
          placeholder="Created to"
          className="h-9 w-36 text-xs"
        />

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
    </div>
  )
}
