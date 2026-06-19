// ─── Department Sheet ─────────────────────────────────────────────────────────
// A single Sheet component that handles both Create and Edit department actions.
// Pass `department={null}` for create mode, or a Department object for edit mode.

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { SearchableSelect } from "@/components/ui/searchable-select"

import { isApiError } from "@/lib/api"
import { createDepartment, updateDepartment } from "../service/department.service"
import type { Department, DepartmentMutationPayload } from "../types/department.types"

// ── Types ──────────────────────────────────────────────────────────────────────

interface DepartmentSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = create mode; a Department object = edit mode */
  department: Department | null
  /** Full flat list used to populate the parent selector */
  allDepartments: Department[]
  /** Called after a successful create or update so the parent can refetch */
  onSuccess: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Recursively flatten a department tree into a flat array */
function flattenDepartments(deps: Department[]): Department[] {
  return deps.flatMap((d) => [d, ...flattenDepartments(d.children ?? [])])
}

/** Derive a human-readable message from a caught error */
function extractErrorMessage(err: unknown): string {
  if (isApiError(err)) {
    // 422 validation errors may carry a `errors` map
    if (err.status === 422 && err.data?.errors) {
      const first = Object.values(err.data.errors as Record<string, string[]>)[0]
      if (Array.isArray(first) && first.length > 0) return first[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    if (err.status === 403) return "You do not have permission to perform this action."
    if (err.status === 404) return "Department not found."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DepartmentSheet({
  open,
  onOpenChange,
  department,
  allDepartments,
  onSuccess,
}: DepartmentSheetProps) {
  const isEditMode = department !== null

  // Form state
  const [name, setName] = useState(() => department?.name ?? "")
  const [parentId, setParentId] = useState<string>(
    () => (department?.parent_id != null ? String(department.parent_id) : "none"),
  )
  const [sortOrder, setSortOrder] = useState(() =>
    department?.sort_order != null ? String(department.sort_order) : "",
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Flat list of all departments available as parent options.
  // In edit mode, exclude the department itself and all its descendants
  // to prevent circular parent references.
  const editingId = department?.id
  const parentOptions = flattenDepartments(allDepartments).filter(
    (d) => d.id !== editingId,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError("Name is required.")
      return
    }

    const payload: DepartmentMutationPayload = {
      name: trimmedName,
      parent_id: parentId === "none" ? null : Number(parentId),
      sort_order: sortOrder.trim() === "" ? null : Number(sortOrder),
    }

    setSubmitting(true)
    try {
      if (isEditMode) {
        // Update existing department
        await updateDepartment(department.id, payload)
        toast.success("Department updated successfully.")
      } else {
        // Create new department
        await createDepartment(payload)
        toast.success("Department created successfully.")
      }

      // Close sheet, reset form, and trigger a refetch of the departments list
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      // Ignore aborted/cancelled requests — not a real error
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Department" : "Create Department"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? `Update the details for "${department.name}".`
              : "Fill in the details to create a new department."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="department-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 px-6 py-4"
        >
          {/* Error banner — shown for API / validation errors */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="dept-name"
              placeholder="e.g. Engineering"
              maxLength={255}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Parent Department */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-parent">Parent Department</Label>
            <SearchableSelect
              id="dept-parent"
              value={parentId}
              onValueChange={setParentId}
              disabled={submitting}
              placeholder="None (root department)"
              searchPlaceholder="Search departments…"
              triggerClassName="w-full"
              emptyText="No departments found"
              /* Allow clearing parent — makes this a root department */
              pinnedOptions={[{ value: "none", label: "None (root department)" }]}
              options={parentOptions.map((d) => ({
                value: String(d.id),
                label: d.name,
              }))}
            />
          </div>

          {/* Sort Order */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dept-sort">Sort Order</Label>
            <Input
              id="dept-sort"
              type="number"
              placeholder="e.g. 1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={submitting}
            />
          </div>
        </form>

        <SheetFooter className="px-6 pb-6">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="department-form"
            disabled={submitting}
          >
            {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Create Department"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
