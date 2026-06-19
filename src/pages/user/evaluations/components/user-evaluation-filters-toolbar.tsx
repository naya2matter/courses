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
import type { UserEvaluationFilters } from "../types/user-evaluation.types"

interface UserEvaluationFiltersToolbarProps {
  filters: UserEvaluationFilters
  onFiltersChange: (next: UserEvaluationFilters) => void
  levelOptions: string[]
  resultCount: number
  totalCount: number
}

function getActiveFilterCount(filters: UserEvaluationFilters): number {
  let count = 0
  if (filters.search.trim()) count += 1
  if (filters.course_type !== "all") count += 1
  if (filters.performance_level !== "all") count += 1
  if (filters.start_date) count += 1
  if (filters.end_date) count += 1
  return count
}

const LABEL = "block text-[11px] font-medium text-muted-foreground mb-1"

export function UserEvaluationFiltersToolbar({
  filters,
  onFiltersChange,
  levelOptions,
  resultCount,
  totalCount,
}: UserEvaluationFiltersToolbarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchDraft(filters.search)
  }, [filters.search])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchDraft !== filters.search) {
        onFiltersChange({ ...filters, search: searchDraft, page: 1 })
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchDraft, filters, onFiltersChange])

  const activeCount = getActiveFilterCount(filters)

  function clearAll() {
    setSearchDraft("")
    onFiltersChange({
      ...filters,
      search: "",
      course_type: "all",
      performance_level: "all",
      start_date: "",
      end_date: "",
      page: 1,
    })
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Search course name…"
          className="pl-9"
          aria-label="Search evaluations by course name"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-end gap-4">
        {/* Date range */}
        <div className="flex items-end gap-2">
          <div>
            <label className={LABEL}>From</label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                onFiltersChange({ ...filters, start_date: e.target.value, page: 1 })
              }
              aria-label="Filter start date"
              className="h-8 w-[8.5rem] text-xs"
            />
          </div>
          <span className="mb-1.5 text-sm text-muted-foreground">—</span>
          <div>
            <label className={LABEL}>To</label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                onFiltersChange({ ...filters, end_date: e.target.value, page: 1 })
              }
              aria-label="Filter end date"
              className="h-8 w-[8.5rem] text-xs"
            />
          </div>
        </div>

        {/* Course type */}
        <div>
          <label className={LABEL}>Type</label>
          <Select
            value={filters.course_type}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                course_type: value as UserEvaluationFilters["course_type"],
                page: 1,
              })
            }
          >
            <SelectTrigger className="h-8 w-[9rem] text-xs" aria-label="Filter by course type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance level */}
        <div>
          <label className={LABEL}>Level</label>
          <Select
            value={filters.performance_level}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, performance_level: value, page: 1 })
            }
          >
            <SelectTrigger className="h-8 w-[9rem] text-xs" aria-label="Filter by performance level">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levelOptions.map((level) => (
                <SelectItem key={level} value={level}>
                  Level {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Results + clear */}
        <div className="flex items-center gap-3 pb-0.5">
          <span className="text-xs text-muted-foreground">
            {resultCount.toLocaleString()}
            {totalCount !== resultCount && (
              <span className="text-white/25"> of {totalCount.toLocaleString()}</span>
            )}{" "}
            result{resultCount !== 1 ? "s" : ""}
          </span>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
