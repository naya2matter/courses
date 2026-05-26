// ─── Departments Page ─────────────────────────────────────────────────────────
// Full-featured Department Management page. Fetches data via the Zustand store,
// handles loading/error states, and renders the DepartmentsList component.

import { useState } from "react"
import { AlertCircleIcon, XIcon, Loader2Icon, PlusIcon, BuildingIcon, UsersIcon, LayoutGridIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDepartments } from "../hook/use-departments"
import type { DepartmentCard } from "../types/department.types"
import { DepartmentsList } from "../components/departments-list"
import { DepartmentSheet } from "../components/department-sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Department } from "../types/department.types"
import { PageHeader } from "@/components/admin/page-header"

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
            { key: "root_departments", title: "Root Departments", value: 0 },
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

export function DepartmentsPageContent() {
  const { departments, cards, isLoading, error, clearError, refetch } = useDepartments()

  // Sheet state — null means Create mode; a Department means Edit mode
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)

  /** Open the sheet in Create mode */
  function handleCreate() {
    setEditingDepartment(null)
    setSheetOpen(true)
  }

  /** Open the sheet in Edit mode for the selected department */
  function handleEdit(dept: Department) {
    setEditingDepartment(dept)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <PageHeader
        title="Department Management"
        description="View and manage all departments, subdepartments, and their users."
        actions={
          <>
            <Button
              onClick={handleCreate}
              className="w-fit"
            >
              <PlusIcon className="mr-2 h-4 w-4 " />
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
      <SummaryCards cards={cards} isLoading={isLoading} />

      {/* ── Error banner (dismissed per session, AbortError is never shown) ── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Loading state ── */}
      {isLoading && departments.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2Icon className="h-8 w-8 animate-spin" />
            <p>Loading organizational structure...</p>
          </div>
        </div>
      ) : (
        /* ── Data UI ── */
        <DepartmentsList departments={departments} onEdit={handleEdit} onDelete={refetch} />
      )}

      {/* ── Create / Edit sheet — rendered once, toggled by state ── */}
      <DepartmentSheet
        key={sheetOpen ? editingDepartment?.id ?? "create" : "closed"}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        department={editingDepartment}
        allDepartments={departments}
        onSuccess={refetch}
      />
    </div>
  )
}
