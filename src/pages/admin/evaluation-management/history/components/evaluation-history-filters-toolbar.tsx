// ─── EvaluationHistoryFiltersToolbar ─────────────────────────────────────────
// Flat, elegant filter toolbar. Department and User are picked by NAME via
// searchable selects (the selected id is what's sent to the API). Course type,
// performance level, and a shadcn-Calendar date range round out the filters.

import { useEffect, useMemo, useState } from "react"
import { CalendarIcon, FilterIcon, FilterXIcon, SearchIcon } from "lucide-react"

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

import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { Department } from "@/pages/admin/user-management/departments/types/department.types"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

import { DEFAULT_FILTERS } from "../hook/use-evaluation-history"
import type { EvaluationHistoryFilters } from "../types/evaluation-history.types"

// ── Date helpers (timezone-safe) ────────────────────────────────────────────────

function isoToLocalDate(iso: string): Date | undefined {
  if (!iso) return undefined
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function dateToIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function fmtDisplay(iso: string): string {
  if (!iso) return ""
  const d = isoToLocalDate(iso)!
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function flattenDepartmentTree(nodes: Department[]): Department[] {
  const items: Department[] = []
  for (const node of nodes) {
    items.push(node)
    if (node.children?.length) items.push(...flattenDepartmentTree(node.children))
  }
  return items
}

// ── Searchable select (sticky search inside the dropdown) ─────────────────────

interface Option {
  value: string
  label: string
}

function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder,
  searchPlaceholder,
  triggerClassName,
  disabled,
}: {
  value: string
  onValueChange: (v: string) => void
  options: Option[]
  placeholder: string
  searchPlaceholder: string
  triggerClassName?: string
  disabled?: boolean
}) {
  const [search, setSearch] = useState("")
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onValueChange(v === "all" ? "" : v)}
      disabled={disabled}
      onOpenChange={(o) => { if (!o) setSearch("") }}
    >
      <SelectTrigger className={triggerClassName ?? "h-8 w-44 text-xs"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[320px]" position="popper" sideOffset={4}>
        <div className="sticky top-0 z-10 bg-popover px-2 pt-2 pb-1">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        </div>
        <SelectItem value="all">{placeholder}</SelectItem>
        {filtered.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">No results found.</p>
        )}
      </SelectContent>
    </Select>
  )
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
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<UserListResource[]>([])

  // Load departments once
  useEffect(() => {
    getAllDepartments()
      .then(({ departments }) => setDepartments(flattenDepartmentTree(departments)))
      .catch(() => setDepartments([]))
  }, [])

  // Load users — narrowed by the selected department when present
  useEffect(() => {
    getAllUsers({
      per_page: 1000,
      department_id: filters.department_id ? Number(filters.department_id) : null,
    })
      .then((res) => setUsers(res.data ?? []))
      .catch(() => setUsers([]))
  }, [filters.department_id])

  function handleSelect(field: keyof EvaluationHistoryFilters, value: string) {
    onFiltersChange({ ...filters, [field]: value, page: 1 })
  }

  function handleDepartmentChange(value: string) {
    // Changing department resets the user filter (user list is dept-scoped)
    onFiltersChange({ ...filters, department_id: value, user_id: "", page: 1 })
  }

  function handleDate(field: "start_date" | "end_date", value: string) {
    onFiltersChange({ ...filters, [field]: value, page: 1 })
  }

  function clearFilters() {
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

  const departmentOptions = departments.map((d) => ({ value: String(d.id), label: d.name }))
  const userOptions = users.map((u) => ({
    value: String(u.id),
    label: u.email ? `${u.name} (${u.email})` : u.name,
  }))

  return (
    <div className="flex flex-col gap-2">
      {/* Result info row */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {totalCount !== null && (
          <span>
            {totalCount.toLocaleString()} result{totalCount !== 1 ? "s" : ""}
          </span>
        )}
        {hasActive && (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-primary">
            <FilterIcon className="size-3" />
            {activeCount} active
          </span>
        )}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Department (by name) */}
        <SearchableSelect
          value={filters.department_id}
          onValueChange={handleDepartmentChange}
          options={departmentOptions}
          placeholder="All departments"
          searchPlaceholder="Search departments…"
        />

        {/* User (by name) */}
        <SearchableSelect
          value={filters.user_id}
          onValueChange={(v) => handleSelect("user_id", v)}
          options={userOptions}
          placeholder="All users"
          searchPlaceholder="Search users…"
          triggerClassName="h-8 w-52 text-xs"
        />

        {/* Course Type */}
        <Select
          value={filters.course_type || "all"}
          onValueChange={(v) => handleSelect("course_type", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="regular">Regular</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>

        {/* Performance Level */}
        <Select
          value={filters.performance_level || "all"}
          onValueChange={(v) => handleSelect("performance_level", v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue placeholder="All levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="Outstanding">Outstanding</SelectItem>
            <SelectItem value="Reliable">Reliable</SelectItem>
            <SelectItem value="Developing">Developing</SelectItem>
            <SelectItem value="Underperforming">Underperforming</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <DatePickerButton
          value={filters.start_date}
          onChange={(iso) => handleDate("start_date", iso)}
          placeholder="From date"
        />
        <DatePickerButton
          value={filters.end_date}
          onChange={(iso) => handleDate("end_date", iso)}
          placeholder="To date"
        />

        {/* Clear button */}
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <FilterXIcon className="size-3.5" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
