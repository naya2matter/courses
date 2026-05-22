// ─── EvaluationHistoryFiltersToolbar ─────────────────────────────────────────
// Filter toolbar: department, user, course type, performance level,
// start/end date, result count, active filter count, clear button.

import { useEffect, useState } from "react"
import { FilterIcon, XIcon } from "lucide-react"

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

import { DEFAULT_FILTERS } from "../hook/use-evaluation-history"
import type { EvaluationHistoryFilters } from "../types/evaluation-history.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationHistoryFiltersToolbarProps {
  filters: EvaluationHistoryFilters
  totalCount: number | null
  onFiltersChange: (filters: EvaluationHistoryFilters) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationHistoryFiltersToolbar({
  filters,
  totalCount,
  onFiltersChange,
}: EvaluationHistoryFiltersToolbarProps) {
  // Local drafts for text fields so we can debounce
  const [deptDraft, setDeptDraft] = useState(filters.department_id)
  const [userDraft, setUserDraft] = useState(filters.user_id)

  // Sync drafts when filters reset externally
  useEffect(() => {
    setDeptDraft(filters.department_id)
  }, [filters.department_id])

  useEffect(() => {
    setUserDraft(filters.user_id)
  }, [filters.user_id])

  // Debounce department_id
  useEffect(() => {
    const t = setTimeout(() => {
      if (deptDraft !== filters.department_id) {
        onFiltersChange({ ...filters, department_id: deptDraft, page: 1 })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptDraft])

  // Debounce user_id
  useEffect(() => {
    const t = setTimeout(() => {
      if (userDraft !== filters.user_id) {
        onFiltersChange({ ...filters, user_id: userDraft, page: 1 })
      }
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDraft])

  function handleSelect(field: keyof EvaluationHistoryFilters, value: string) {
    onFiltersChange({ ...filters, [field]: value === "all" ? "" : value, page: 1 })
  }

  function handleDate(field: "start_date" | "end_date", value: string) {
    onFiltersChange({ ...filters, [field]: value, page: 1 })
  }

  function clearFilters() {
    setDeptDraft("")
    setUserDraft("")
    onFiltersChange({ ...DEFAULT_FILTERS })
  }

  const activeCount = [
    filters.department_id,
    filters.user_id,
    filters.course_type,
    filters.performance_level,
    filters.start_date,
    filters.end_date,
  ].filter(Boolean).length

  const hasActive = activeCount > 0

  return (
    <div className="flex flex-col gap-3">
      {/* ── Row: filters ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Department ID */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Dept ID</Label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 1"
            className="w-24"
            value={deptDraft}
            onChange={(e) => setDeptDraft(e.target.value)}
          />
        </div>

        {/* User ID */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">User ID</Label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 5"
            className="w-24"
            value={userDraft}
            onChange={(e) => setUserDraft(e.target.value)}
          />
        </div>

        {/* Course Type */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Course Type</Label>
          <Select
            value={filters.course_type || "all"}
            onValueChange={(v) => handleSelect("course_type", v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance Level */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Performance</Label>
          <Select
            value={filters.performance_level || "all"}
            onValueChange={(v) => handleSelect("performance_level", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Outstanding">Outstanding</SelectItem>
              <SelectItem value="Reliable">Reliable</SelectItem>
              <SelectItem value="Developing">Developing</SelectItem>
              <SelectItem value="Underperforming">Underperforming</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input
            type="date"
            className="w-36"
            value={filters.start_date}
            onChange={(e) => handleDate("start_date", e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input
            type="date"
            className="w-36"
            value={filters.end_date}
            onChange={(e) => handleDate("end_date", e.target.value)}
          />
        </div>

        {/* Clear button */}
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

      {/* ── Row: result info ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {hasActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">
            <FilterIcon className="size-3" />
            {activeCount} filter{activeCount !== 1 ? "s" : ""} active
          </span>
        )}
        {totalCount !== null && (
          <span>
            {totalCount.toLocaleString()} result{totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}
