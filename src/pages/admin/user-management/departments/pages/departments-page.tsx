// ─── Departments Page ─────────────────────────────────────────────────────────
// Full-featured Department Management page. Fetches data via the Zustand store,
// handles loading/error states, and renders the DepartmentsList component.
// When any filter is active, switches to a flat paginated table.

import { useEffect, useState } from "react"
import {
  AlertCircleIcon,
  BuildingIcon,
  LayoutGridIcon,
  Loader2Icon,
  PlusIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageHeader } from "@/components/admin/page-header"

import { useDepartments } from "../hook/use-departments"
import { getFilteredDepartments } from "../service/department.service"
import type {
  Department,
  DepartmentCard,
  DepartmentFilters,
  FlatDepartment,
  FilteredDepartmentsMeta,
} from "../types/department.types"
import { DepartmentsList } from "../components/departments-list"
import { DepartmentsFlatList } from "../components/departments-flat-list"
import { DepartmentSheet } from "../components/department-sheet"

// ── Card icon map ─────────────────────────────────────────────────────────────

const CARD_ICONS: Record<string, React.ReactNode> = {
  total_departments: <LayoutGridIcon className="h-5 w-5" />,
  root_departments: <BuildingIcon className="h-5 w-5" />,
  users_with_department: <UsersIcon className="h-5 w-5" />,
}

function SummaryCards({ cards, isLoading }: { cards: DepartmentCard[]; isLoading: boolean }) {
  if (cards.length === 0 && !isLoading) return null
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {(cards.length > 0
        ? cards
        : [
            { key: "total_departments", title: "Total Departments", value: 0 },
            { key: "root_departments", title: "Parent Departments", value: 0 },
            { key: "users_with_department", title: "Users With Department", value: 0 },
          ]
      ).map((card) => (
        <div key={card.key} className="flex flex-col items-center justify-between text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
            {CARD_ICONS[card.key] ?? <LayoutGridIcon className="h-5 w-5" />}
          </div>
          <p className="text-4xl font-semibold tabular-nums text-foreground">
            {isLoading ? <Skeleton className="h-10 w-24" /> : card.value.toLocaleString()}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {card.title}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: DepartmentFilters
  rootDepts: { id: number; name: string }[]
  onFilterChange: (patch: Partial<DepartmentFilters>) => void
  onClearAll: () => void
}

function FilterBar({ filters, rootDepts, onFilterChange, onClearAll }: FilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")

  function commitSearch() {
    onFilterChange({ search: searchDraft.trim() || undefined })
  }

  const hasActive = Boolean(
    filters.search || filters.parent_id !== undefined || filters.has_users,
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name…"
          className="pl-9"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitSearch() }}
          onBlur={commitSearch}
        />
      </div>

      {/* Parent filter */}
      <Select
        value={
          filters.parent_id === "root"
            ? "root"
            : filters.parent_id != null
            ? String(filters.parent_id)
            : "all"
        }
        onValueChange={(v) => {
          if (v === "all") {
            onFilterChange({ parent_id: undefined })
          } else if (v === "root") {
            onFilterChange({ parent_id: "root" })
          } else {
            onFilterChange({ parent_id: Number(v) })
          }
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Parent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="root">Parent Departments</SelectItem>
          {rootDepts.map((d) => (
            <SelectItem key={d.id} value={String(d.id)}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Has Users toggle */}
      <Button
        variant={filters.has_users ? "secondary" : "outline"}
        size="sm"
        className="gap-1.5 border-white/10"
        onClick={() => onFilterChange({ has_users: filters.has_users ? undefined : true })}
      >
        <UsersIcon className="h-3.5 w-3.5" />
        Has Users
      </Button>

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
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DepartmentsPageContent() {
  const { departments, cards, isLoading, error, clearError, refetch } = useDepartments()

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  // Filter state (local — does not touch the store)
  const [filters, setFilters] = useState<DepartmentFilters>({})
  const [flatPage, setFlatPage] = useState(1)
  const [flatDepts, setFlatDepts] = useState<FlatDepartment[]>([])
  const [flatMeta, setFlatMeta] = useState<FilteredDepartmentsMeta>({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 20,
  })
  const [flatCards, setFlatCards] = useState<DepartmentCard[]>([])
  const [isFetchingFlat, setIsFetchingFlat] = useState(false)
  const [flatError, setFlatError] = useState<string | null>(null)

  const isFiltered = Boolean(
    filters.search || filters.parent_id !== undefined || filters.has_users,
  )

  // Fetch flat/paginated results when filters or page change
  useEffect(() => {
    if (!isFiltered) return
    setIsFetchingFlat(true)
    setFlatError(null)
    getFilteredDepartments(filters, 20, flatPage)
      .then((res) => {
        setFlatDepts(res.departments)
        setFlatMeta(res.meta)
        if (res.cards.length) setFlatCards(res.cards)
        setIsFetchingFlat(false)
      })
      .catch(() => {
        setFlatError("Failed to load departments. Please try again.")
        setIsFetchingFlat(false)
      })
  }, [filters, flatPage, isFiltered])

  function applyFilter(patch: Partial<DepartmentFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
    setFlatPage(1)
  }

  function clearFilters() {
    setFilters({})
    setFlatPage(1)
  }

  function handleCreate() {
    setEditingDepartment(null)
    setSheetOpen(true)
  }

  function handleEdit(dept: Department) {
    setEditingDepartment(dept)
    setSheetOpen(true)
  }

  function handleDeleteSuccess() {
    if (isFiltered) {
      // Re-fetch the current filtered page
      setFilters((prev) => ({ ...prev }))
    } else {
      refetch()
    }
  }

  // Root departments for the parent dropdown (sourced from tree already loaded)
  const rootDepts = departments.map((d) => ({ id: d.id, name: d.name }))

  // Cards to display — when filtered use the flat response cards, else tree cards
  const displayCards = isFiltered && flatCards.length ? flatCards : cards
  const displayIsLoading = isFiltered ? isFetchingFlat : isLoading

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title="Department Management"
        description="View and manage all departments, subdepartments, and their users."
        actions={
          <>
            <Button onClick={handleCreate} className="w-fit">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Department
            </Button>
            <Button
              onClick={refetch}
              disabled={isLoading}
              variant="outline"
              className="w-fit"
            >
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Data
            </Button>
          </>
        }
      />

      {/* ── Summary cards ── */}
      <SummaryCards cards={displayCards} isLoading={displayIsLoading} />

      {/* ── Error banners ── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="icon" className="size-6 shrink-0" onClick={clearError}>
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {flatError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{flatError}</AlertDescription>
        </Alert>
      )}

      {/* ── Filter bar ── */}
      <FilterBar
        filters={filters}
        rootDepts={rootDepts}
        onFilterChange={applyFilter}
        onClearAll={clearFilters}
      />

      {/* ── Loading state (tree, first load) ── */}
      {!isFiltered && isLoading && departments.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2Icon className="h-8 w-8 animate-spin" />
            <p>Loading organizational structure...</p>
          </div>
        </div>
      ) : isFiltered ? (
        /* ── Filtered flat table ── */
        isFetchingFlat ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DepartmentsFlatList
            departments={flatDepts}
            meta={flatMeta}
            onEdit={handleEdit}
            onDelete={handleDeleteSuccess}
            onPage={setFlatPage}
          />
        )
      ) : (
        /* ── Tree view ── */
        <DepartmentsList departments={departments} onEdit={handleEdit} onDelete={refetch} />
      )}

      {/* ── Create / Edit sheet ── */}
      <DepartmentSheet
        key={sheetOpen ? editingDepartment?.id ?? "create" : "closed"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        department={editingDepartment}
        allDepartments={departments}
        onSuccess={() => {
          refetch()
          if (isFiltered) setFilters((prev) => ({ ...prev }))
        }}
      />
    </div>
  )
}
