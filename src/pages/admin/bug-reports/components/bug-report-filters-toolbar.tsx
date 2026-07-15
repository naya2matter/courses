// ─── BugReportFiltersToolbar ──────────────────────────────────────────────────
// Search + select filters + result count for the bug reports list.

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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DatePickerField } from "@/components/ui/date-picker"
import { PerPageSelect } from "@/components/ui/table-controls"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"
import type { BugReportFilters, BugReportPriority, BugReportStatus } from "../types/bug-report.types"

export type AssignedFilter = "all" | "assigned" | "unassigned"

/** Sentinel value for the "all assignees" option in the assigned_to select. */
const ALL_ASSIGNEES = "__all__"
const DEFAULT_PER_PAGE = 15

interface BugReportFiltersToolbarProps {
  filters: BugReportFilters
  assignedFilter: AssignedFilter
  /** {from, to, total} from pagination meta, or null while loading */
  resultCount: { from: number; to: number; total: number } | null
  onFilterChange: (f: BugReportFilters) => void
  onAssignedFilterChange: (v: AssignedFilter) => void
  onClearAll: () => void
}

export function BugReportFiltersToolbar({
  filters,
  assignedFilter,
  resultCount,
  onFilterChange,
  onAssignedFilterChange,
  onClearAll,
}: BugReportFiltersToolbarProps) {
  // Local draft — live search committed (debounced) on every keystroke
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  // Users list backing the "Assigned to" select (loaded once).
  const [users, setUsers] = useState<UserListResource[]>([])

  useEffect(() => {
    let cancelled = false
    getAllUsers({ per_page: 100 })
      .then((res) => {
        if (!cancelled) setUsers(res.data ?? [])
      })
      .catch(() => {
        // Silent — the select just stays empty if users can't load.
      })
    return () => {
      cancelled = true
    }
  }, [])

  function commitSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({ search: searchDraft.trim() || undefined, page: 1 })
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  const hasActive =
    !!filters.search ||
    !!filters.status ||
    !!filters.priority ||
    filters.assigned_to != null ||
    !!filters.date_from ||
    !!filters.date_to ||
    assignedFilter !== "all"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search title or description…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSearch()
            }}
          />
        </div>

        {/* Priority */}
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              priority: v === "all" ? undefined : (v as BugReportPriority),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            onFilterChange({
              status: v === "all" ? undefined : (v as BugReportStatus),
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Assigned (client-side filter) */}
        <Select
          value={assignedFilter}
          onValueChange={(v) => onAssignedFilterChange(v as AssignedFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Assigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        {/* Assigned to (server-side, specific user) */}
        <SearchableSelect
          value={filters.assigned_to != null ? String(filters.assigned_to) : ALL_ASSIGNEES}
          onValueChange={(v) =>
            onFilterChange({
              assigned_to: v === ALL_ASSIGNEES ? undefined : Number(v),
              page: 1,
            })
          }
          placeholder="Assigned to"
          searchPlaceholder="Search users…"
          triggerClassName="h-9 w-44 text-sm"
          pinnedOptions={[{ value: ALL_ASSIGNEES, label: "All assignees" }]}
          options={users.map((u) => ({
            value: String(u.id),
            label: u.name,
            keywords: u.email,
          }))}
        />

        {/* Created date range */}
        <DatePickerField
          value={filters.date_from ?? ""}
          onChange={(v) => onFilterChange({ date_from: v || undefined, page: 1 })}
          placeholder="Created from"
          className="h-9 w-36 text-sm"
        />
        <DatePickerField
          value={filters.date_to ?? ""}
          onChange={(v) => onFilterChange({ date_to: v || undefined, page: 1 })}
          placeholder="Created to"
          className="h-9 w-36 text-sm"
        />

        <div className="ml-auto flex items-center gap-2">
          <PerPageSelect
            value={filters.per_page ?? DEFAULT_PER_PAGE}
            onChange={(n) => onFilterChange({ per_page: n, page: 1 })}
          />
          {/* Clear */}
          {hasActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchDraft("")
                onClearAll()
              }}
              className="gap-1.5 text-muted-foreground"
            >
              <XIcon className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Result count */}
      {resultCount !== null && (
        <p className="text-sm text-muted-foreground">
          {resultCount.total === 0
            ? "No bug reports found"
            : `Showing ${resultCount.from}–${resultCount.to} of ${resultCount.total} report${resultCount.total !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  )
}
