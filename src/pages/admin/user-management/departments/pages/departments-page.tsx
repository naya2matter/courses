// ─── Departments Page ─────────────────────────────────────────────────────────
// Full-featured Department Management page. Fetches data via the Zustand store,
// handles loading/error states, and renders the DepartmentsList component.

import { useState } from "react"
import { AlertCircleIcon, XIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDepartments } from "../hook/use-departments"
import { DepartmentsList } from "../components/departments-list"
import { DepartmentSheet } from "../components/department-sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Department } from "../types/department.types"

export function DepartmentsPageContent() {
  const { departments, isLoading, error, clearError, refetch } = useDepartments()

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Department Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all departments, subdepartments, and their users.
          </p>
        </div>
        {/* Action buttons — responsive row on larger screens */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleCreate}
            className="w-fit"
          >
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
        </div>
      </div>

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
