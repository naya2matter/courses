// ─── EvaluationConfigToolbar ──────────────────────────────────────────────────
// Filter bar: debounced search across config names and type names,
// plus applies_to dropdown, clear button, and result count.

import { useEffect, useState } from "react"
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

import type { AppliesToValue, EvaluationConfigFilters } from "../types/evaluation-config.types"

interface EvaluationConfigToolbarProps {
  filters: EvaluationConfigFilters
  resultCount: number
  onFiltersChange: (filters: EvaluationConfigFilters) => void
}

export function EvaluationConfigToolbar({
  filters,
  resultCount,
  onFiltersChange,
}: EvaluationConfigToolbarProps) {
  // Local draft so keystrokes don't immediately re-filter
  const [searchDraft, setSearchDraft] = useState(filters.search)

  // Sync draft when filters are reset externally (e.g. "Clear filters" button)
  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  // Debounce combined search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDraft !== filters.search) {
        onFiltersChange({ ...filters, search: searchDraft })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  function handleAppliesToChange(value: string) {
    onFiltersChange({
      ...filters,
      applies_to: value === "all" ? "" : (value as AppliesToValue),
    })
  }

  const hasActiveFilters = filters.search !== "" || filters.applies_to !== ""

  function clearFilters() {
    setSearchDraft("")
    onFiltersChange({ search: "", applies_to: "" })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ── Row 1: Combined search + filters ─────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* Combined config/type search */}
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by config or type name..."
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>

        {/* Applies To filter */}
        <Select
          value={filters.applies_to || "all"}
          onValueChange={handleAppliesToChange}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Applies To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5 h-9"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}

        {/* Result count — pushed to the end on larger screens */}
        <p className="text-sm text-muted-foreground sm:ml-auto shrink-0">
          {resultCount === 0
            ? "No configs found"
            : `${resultCount} config${resultCount !== 1 ? "s" : ""}`}
        </p>
      </div>
    </div>
  )
}
