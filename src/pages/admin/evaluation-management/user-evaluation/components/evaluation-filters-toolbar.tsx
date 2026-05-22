// ─── EvaluationFiltersToolbar ─────────────────────────────────────────────────
// Search + filter controls for the evaluations list.

import { useRef } from "react"
import { SearchIcon, XIcon, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EvaluationFilters } from "../types/evaluation.types"

interface Props {
  filters: EvaluationFilters
  onFilterChange: (patch: Partial<EvaluationFilters>) => void
  onClear: () => void
}

const PERFORMANCE_LEVELS = [
  { value: "1", label: "Outstanding" },
  { value: "2", label: "Reliable" },
  { value: "3", label: "Developing" },
  { value: "4", label: "Underperforming" },
]

const COURSE_TYPES = [
  { value: "regular", label: "Regular" },
  { value: "online", label: "Online" },
]

export function EvaluationFiltersToolbar({ filters, onFilterChange, onClear }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: value })
    }, 300)
  }

  const hasFilters =
    filters.search ||
    filters.course_type ||
    filters.department_id ||
    filters.user_id ||
    filters.performance_level ||
    filters.start_date ||
    filters.end_date

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_8px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">Search</p>
          <div className="relative w-full sm:w-[440px]">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by user or course name…"
            defaultValue={filters.search}
            onChange={handleSearchChange}
            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {/* Course type */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">Course Type</p>
          <Select
            value={filters.course_type || "__all__"}
            onValueChange={(v) =>
              onFilterChange({ course_type: v === "__all__" ? "" : (v as "regular" | "online") })
            }
          >
            <SelectTrigger className="w-36 border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Course type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {COURSE_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Performance level */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">Performance</p>
          <Select
            value={filters.performance_level || "__all__"}
            onValueChange={(v) =>
              onFilterChange({ performance_level: v === "__all__" ? "" : v })
            }
          >
            <SelectTrigger className="w-44 border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All levels</SelectItem>
              {PERFORMANCE_LEVELS.map((pl) => (
                <SelectItem key={pl.value} value={pl.value}>
                  {pl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start date */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">From</p>
          <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => onFilterChange({ start_date: e.target.value })}
              className="w-40 border-white/10 bg-white/5 pl-9 text-white"
            />
          </div>
        </div>

        {/* End date */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">To</p>
          <div className="relative">
            <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => onFilterChange({ end_date: e.target.value })}
              className="w-40 border-white/10 bg-white/5 pl-9 text-white"
            />
          </div>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="mb-0.5 gap-1 text-white/60 hover:text-white"
          >
            <XIcon className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      </div>
    </div>
  )
}
