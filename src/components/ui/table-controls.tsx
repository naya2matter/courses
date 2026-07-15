// ─── Shared list-table controls ──────────────────────────────────────────────
// Reusable sortable column header + per-page selector + a sort-toggle helper.
// Used across the admin list pages so search/sort/per-page behave identically.

import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "lucide-react"

import { TableHead } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc"

/**
 * Compute the next sort state when a column header is clicked.
 * First click on a column → asc; clicking the active column flips the direction.
 */
export function nextSort(
  current: { sort?: string; direction?: SortDirection },
  column: string,
): { sort: string; direction: SortDirection } {
  if (current.sort === column) {
    return { sort: column, direction: current.direction === "asc" ? "desc" : "asc" }
  }
  return { sort: column, direction: "asc" }
}

interface SortableHeadProps {
  label: string
  /** Backend column key (must be in the list's allow-list). */
  column: string
  sort?: string
  direction?: SortDirection
  onSort: (column: string) => void
  align?: "left" | "right"
  className?: string
}

export function SortableHead({
  label,
  column,
  sort,
  direction,
  onSort,
  align = "left",
  className,
}: SortableHeadProps) {
  const active = sort === column
  const Icon = !active ? ChevronsUpDownIcon : direction === "asc" ? ChevronUpIcon : ChevronDownIcon

  return (
    <TableHead className={cn(align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex select-none items-center gap-1 transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
          align === "right" && "flex-row-reverse",
        )}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} />
      </button>
    </TableHead>
  )
}

const PER_PAGE_OPTIONS = [10, 15, 25, 50]

interface PerPageSelectProps {
  value: number
  onChange: (value: number) => void
  options?: number[]
  className?: string
}

export function PerPageSelect({
  value,
  onChange,
  options = PER_PAGE_OPTIONS,
  className,
}: PerPageSelectProps) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className={cn("h-8 w-[6.5rem] text-xs", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((n) => (
          <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
