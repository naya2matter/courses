// ─── EvaluationNotificationFiltersToolbar ────────────────────────────────────
// Client-side filters: search (subject/message/email), status, clear button.

import { useEffect, useState } from "react"
import { FilterIcon, SearchIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DEFAULT_FILTERS } from "../hook/use-evaluation-notification-history"
import type { EvaluationNotificationFilters } from "../types/evaluation-notification.types"

interface EvaluationNotificationFiltersToolbarProps {
  filters: EvaluationNotificationFilters
  resultCount: number
  onFiltersChange: (f: EvaluationNotificationFilters) => void
}

export function EvaluationNotificationFiltersToolbar({
  filters,
  resultCount,
  onFiltersChange,
}: EvaluationNotificationFiltersToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)

  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== filters.search) {
        onFiltersChange({ ...filters, search: searchDraft })
      }
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  function handleStatus(value: string) {
    onFiltersChange({ ...filters, status: value === "all" ? "" : value })
  }

  function clearFilters() {
    setSearchDraft("")
    onFiltersChange({ ...DEFAULT_FILTERS })
  }

  const activeCount = [filters.search, filters.status].filter(Boolean).length
  const hasActive = activeCount > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative w-64">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Subject, message, email…"
              className="pl-9"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filters.status || "all"} onValueChange={handleStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="partial">Partial Failure</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="self-end gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {hasActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
            <FilterIcon className="size-3" />
            {activeCount} filter{activeCount !== 1 ? "s" : ""} active
          </span>
        )}
        <span>{resultCount.toLocaleString()} result{resultCount !== 1 ? "s" : ""}</span>
      </div>
    </div>
  )
}
