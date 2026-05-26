// ─── ResendLinksFiltersToolbar ────────────────────────────────────────────────
// Search + link-status filter for the expired-links table.

import { SearchIcon, XIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExpiredLinksFilters, LinkStatus } from "../types/resend-links.types"

interface ResendLinksFiltersToolbarProps {
  filters: ExpiredLinksFilters
  searchText: string
  resultCount: { from: number; to: number; total: number } | null
  onSearchTextChange: (v: string) => void
  onFilterChange: (partial: Partial<ExpiredLinksFilters>) => void
  onClearAll: () => void
}

export function ResendLinksFiltersToolbar({
  filters,
  searchText,
  resultCount,
  onSearchTextChange,
  onFilterChange,
  onClearAll,
}: ResendLinksFiltersToolbarProps) {
  const hasActive = Boolean(filters.linkStatus || searchText.trim())

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchText}
          onChange={(e) => onSearchTextChange(e.target.value)}
          placeholder="Search user, email or course…"
          className="pl-9"
        />
      </div>

      {/* Link status filter */}
      <Select
        value={filters.linkStatus ?? "all"}
        onValueChange={(v) =>
          onFilterChange({ linkStatus: v === "all" ? undefined : (v as LinkStatus) })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="never_sent">Never Sent</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasActive && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="shrink-0">
          <XIcon className="mr-1.5 h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      {/* Result count */}
      {resultCount && resultCount.total > 0 && (
        <p className="text-xs text-muted-foreground shrink-0 ml-auto sm:ml-0">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {resultCount.from}–{resultCount.to}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{resultCount.total}</span> results
        </p>
      )}
    </div>
  )
}
