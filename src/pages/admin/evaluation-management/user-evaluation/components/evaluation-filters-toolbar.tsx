// ─── EvaluationFiltersToolbar ─────────────────────────────────────────────────
// Flat filter bar matching the "all pages" style.

import { useEffect, useRef, useState } from "react"
import { CalendarIcon, FilterXIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { Department } from "@/pages/admin/user-management/departments/types/department.types"
import type { EvaluationFilters } from "../types/evaluation.types"

const ALL = "__all__"

/** Recursively flatten the department tree into a single list. */
function flattenDepartmentTree(nodes: Department[]): Department[] {
  const items: Department[] = []
  for (const node of nodes) {
    items.push(node)
    if (node.children?.length) items.push(...flattenDepartmentTree(node.children))
  }
  return items
}

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

// Convert "YYYY-MM-DD" string → local Date (avoids UTC-midnight timezone shift)
function isoToLocalDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Convert Date → "YYYY-MM-DD"
function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function fmtDisplay(iso: string): string {
  if (!iso) return ""
  const d = isoToLocalDate(iso)!
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

// ── Inline date-picker button ─────────────────────────────────────────────────

function DatePickerButton({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (iso: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const selected = isoToLocalDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-xs ${value ? "" : "text-muted-foreground"}`}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {value ? fmtDisplay(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? dateToIso(d) : "")
            setOpen(false)
          }}
          autoFocus
        />
        {value && (
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-xs text-muted-foreground"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ── Main toolbar ──────────────────────────────────────────────────────────────

export function EvaluationFiltersToolbar({ filters, onFilterChange, onClear }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])

  // Load departments once for the department filter.
  useEffect(() => {
    getAllDepartments()
      .then(({ departments }) => setDepartments(flattenDepartmentTree(departments)))
      .catch(() => setDepartments([]))
  }, [])

  // Debounced search (400ms) — matches on user name / email server-side.
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: value })
    }, 400)
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
    <div className="flex flex-col gap-2">
      {/* Search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user name or email…"
            defaultValue={filters.search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Department (by name) */}
        <SearchableSelect
          value={filters.department_id || ALL}
          onValueChange={(v) =>
            onFilterChange({ department_id: v === ALL ? "" : v })
          }
          placeholder="All departments"
          searchPlaceholder="Search departments…"
          triggerClassName="h-8 w-44 text-xs"
          pinnedOptions={[{ value: ALL, label: "All departments" }]}
          options={departments.map((d) => ({ value: String(d.id), label: d.name }))}
        />

        {/* Course type */}
        <Select
          value={filters.course_type || "__all__"}
          onValueChange={(v) =>
            onFilterChange({ course_type: v === "__all__" ? "" : (v as "regular" | "online") })
          }
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue placeholder="All types" />
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

        {/* Performance level */}
        <Select
          value={filters.performance_level || "__all__"}
          onValueChange={(v) =>
            onFilterChange({ performance_level: v === "__all__" ? "" : v })
          }
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All levels" />
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

        {/* Date range */}
        <DatePickerButton
          value={filters.start_date ?? ""}
          onChange={(iso) => onFilterChange({ start_date: iso })}
          placeholder="From date"
        />
        <DatePickerButton
          value={filters.end_date ?? ""}
          onChange={(iso) => onFilterChange({ end_date: iso })}
          placeholder="To date"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={onClear}
          >
            <FilterXIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
