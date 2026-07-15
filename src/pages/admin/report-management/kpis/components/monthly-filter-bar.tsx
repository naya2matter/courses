// ─── Monthly KPI Filter Bar ───────────────────────────────────────────────────
// Year + Month + Department controls shared by the Monthly and Comparison tabs.
// Mirrors the compact filter-bar styling used elsewhere on the KPIs page.

import {
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { MonthlyKpiFilters } from "../types/monthly-kpi.types"

const ALL_VALUE = "all"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// A small, sensible range of selectable years (current year and the four prior).
function recentYears(): number[] {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
}

interface DeptOption {
  id: number
  name: string
}

interface Props {
  filters: MonthlyKpiFilters
  onChange: (f: MonthlyKpiFilters) => void
  onClear: () => void
  onRefresh: () => void
  isLoading: boolean
  departments?: DeptOption[]
}

function countActive(f: MonthlyKpiFilters): number {
  return Object.values(f).filter((v) => v !== "" && v !== undefined && v !== null).length
}

export function MonthlyFilterBar({
  filters,
  onChange,
  onClear,
  onRefresh,
  isLoading,
  departments = [],
}: Props) {
  const activeCount = countActive(filters)

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
      <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
      <Separator orientation="vertical" className="h-4 bg-white/10" />

      {/* Year */}
      <div className="flex flex-col gap-0.5">
        <Label className="text-[10px] text-white/35">Year</Label>
        <Select
          value={filters.year ? String(filters.year) : ALL_VALUE}
          onValueChange={(v) => onChange({ ...filters, year: v === ALL_VALUE ? "" : v })}
        >
          <SelectTrigger className="h-7 w-28 border-white/10 bg-white/5 text-xs text-white">
            <SelectValue placeholder="Current" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0f0f1a]">
            <SelectItem value={ALL_VALUE}>Current year</SelectItem>
            {recentYears().map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month */}
      <div className="flex flex-col gap-0.5">
        <Label className="text-[10px] text-white/35">Month</Label>
        <Select
          value={filters.month ? String(filters.month) : ALL_VALUE}
          onValueChange={(v) => onChange({ ...filters, month: v === ALL_VALUE ? "" : v })}
        >
          <SelectTrigger className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#0f0f1a]">
            <SelectItem value={ALL_VALUE}>All months</SelectItem>
            {MONTHS.map((m, i) => (
              <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Department (optional) */}
      {departments.length > 0 && (
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-white/35">Department</Label>
          <Select
            value={filters.department_id ? String(filters.department_id) : ALL_VALUE}
            onValueChange={(v) =>
              onChange({ ...filters, department_id: v === ALL_VALUE ? "" : v })
            }
          >
            <SelectTrigger className="h-7 w-40 border-white/10 bg-white/5 text-xs text-white">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value={ALL_VALUE}>All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {activeCount > 0 && (
          <Badge
            variant="outline"
            className="rounded-full border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400"
          >
            {activeCount} active
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
        >
          Clear
        </Button>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
        >
          {isLoading
            ? <Loader2Icon className="size-3 animate-spin" />
            : <RefreshCwIcon className="size-3" />}
          Refresh
        </Button>
      </div>
    </div>
  )
}
