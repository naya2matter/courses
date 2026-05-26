import { useEffect, useRef, useState } from "react"
import { FilterIcon, SearchIcon, XIcon } from "lucide-react"

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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FilterIcon className="size-3.5" />
          {activeCount} active filter{activeCount !== 1 ? "s" : ""}
        </span>
        <span className="text-white/25">|</span>
        <span>{resultCount.toLocaleString()} result{resultCount !== 1 ? "s" : ""}</span>
        <span className="text-white/25">of {totalCount.toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search course name..."
            className="pl-9"
            aria-label="Search evaluations by course name"
          />
        </div>

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
          <SelectTrigger aria-label="Filter by course type">
            <SelectValue placeholder="Course Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.performance_level}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, performance_level: value, page: 1 })
          }
        >
          <SelectTrigger aria-label="Filter by performance level">
            <SelectValue placeholder="Performance Level" />
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

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-2">
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) =>
              onFiltersChange({ ...filters, start_date: e.target.value, page: 1 })
            }
            aria-label="Filter start date"
          />
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) =>
              onFiltersChange({ ...filters, end_date: e.target.value, page: 1 })
            }
            aria-label="Filter end date"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={clearAll}
          disabled={activeCount === 0}
        >
          <XIcon className="size-3.5" />
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
