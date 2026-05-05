// ─── Category Table ────────────────────────────────────────────────────────────
// Renders the full list of audio categories in a responsive shadcn Table.
// Includes:
//   • Skeleton loading rows while the first fetch is in progress
//   • Empty state when the list is empty
//   • Edit button → opens CategoryFormSheet in edit mode
//   • Delete button → opens AlertDialog for confirmation
//   • Inline delete error displayed inside the AlertDialog

import { useState, useImperativeHandle, forwardRef } from "react"
import {
  Loader2Icon,
  Trash2Icon,
  PencilIcon,
  AlertCircleIcon,
  FileMusicIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { CategoryFormSheet } from "./category-form-sheet"
import { isApiError } from "@/lib/api"

import type { AudioCategoryResource, CreateCategoryPayload } from "../types/category.types"

// Imperative handle exposed to parent via `ref` so callers can open the
// create sheet from outside the table (used by the page-level Create button).
export type CategoryTableHandle = {
  openCreate: () => void
  openEdit: (category: AudioCategoryResource) => void
}

// ── Skeleton shown while the first fetch is loading ───────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-12" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          {/* Actions column — two ghost buttons */}
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )

}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryTableProps {
  items: AudioCategoryResource[]
  isLoading: boolean
  /** Called after a successful create or update so the parent can refresh */
  onRefetch: () => void
  /** Store action for creating a category */
  onCreate: (payload: CreateCategoryPayload) => Promise<AudioCategoryResource>
  /** Store action for updating a category */
  onUpdate: (id: number, payload: CreateCategoryPayload) => Promise<AudioCategoryResource>
  /** Store action for deleting a category */
  onDelete: (id: number) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CategoryTable = forwardRef<CategoryTableHandle, CategoryTableProps>(
  function CategoryTable({
    items,
    isLoading,
    onRefetch,
    onCreate,
    onUpdate,
    onDelete,
  }: CategoryTableProps, ref) {
  // Defensive guard: never let unexpected payload shapes crash the UI.
  const safeItems = Array.isArray(items) ? items : []

  // ── Edit sheet state ───────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<AudioCategoryResource | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<AudioCategoryResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Edit handlers ──────────────────────────────────────────────────────────

  /** Open the sheet pre-filled with the selected category */
  function openEdit(category: AudioCategoryResource) {
    setEditTarget(category)
    setSheetOpen(true)
  }

  /** Open the sheet with no pre-fill for creating a new category */
  function openCreate() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  // Expose openCreate/openEdit to parent components via ref
  useImperativeHandle(ref, () => ({ openCreate, openEdit }))

  /** Determine which store action to pass to the form sheet (create vs. update) */
  function getSubmitHandler(
    payload: CreateCategoryPayload,
  ): Promise<AudioCategoryResource> {
    if (editTarget) {
      // Edit mode: forward call to onUpdate with the target's ID
      return onUpdate(editTarget.id, payload)
    }
    // Create mode: forward call to onCreate
    return onCreate(payload)
  }

  // ── Delete handlers ────────────────────────────────────────────────────────

  /** Open the delete confirmation dialog */
  function openDelete(category: AudioCategoryResource) {
    setDeleteTarget(category)
    setDeleteError(null)
  }

  /** Execute the delete and handle errors inside the dialog */
  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await onDelete(deleteTarget.id)
      // Close the dialog on success — list refresh is handled by the store
      setDeleteTarget(null)
    } catch (err) {
      // Ignore navigation cancellations
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsDeleting(false)
        return
      }

      // Surface the error message inside the dialog
      if (isApiError(err)) {
        setDeleteError(err.message || "Failed to delete category.")
      } else if (err instanceof Error) {
        setDeleteError(err.message)
      } else {
        setDeleteError("Failed to delete category.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Format a date string for display ──────────────────────────────────────
  function formatDate(value: string | null | undefined): string {
    if (!value) return "—"
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Table card ──────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-28">Sort Order</TableHead>
              <TableHead className="w-36">Created</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* ── Loading skeleton ────────────────────────────────────────── */}
            {isLoading && safeItems.length === 0 && <TableSkeleton />}

            {/* ── Empty state ─────────────────────────────────────────────── */}
            {!isLoading && safeItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileMusicIcon className="h-10 w-10 opacity-30" />
                    <p className="text-sm">No audio categories yet.</p>
                    <Button variant="outline" size="sm" onClick={openCreate} className="mt-1">
                      Create the first one
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* ── Data rows ───────────────────────────────────────────────── */}
            {safeItems.map((category) => (
              <TableRow key={category.id}>
                {/* ID */}
                <TableCell className="text-muted-foreground text-sm">{category.id}</TableCell>

                {/* Name */}
                <TableCell className="font-medium">{category.name}</TableCell>

                {/* Sort order */}
                <TableCell className="text-muted-foreground text-sm">
                  {category.sort_order}
                </TableCell>

                {/* Created at */}
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(category.created_at)}
                </TableCell>

                {/* Actions: Edit + Delete */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Edit button — opens the form sheet in edit mode */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(category)}
                      aria-label={`Edit ${category.name}`}
                    >
                      <PencilIcon className=" h-3.5 w-3.5" />
                      
                    </Button>

                    {/* Delete button — opens the confirm dialog */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => openDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2Icon className=" h-3.5 w-3.5" />
                      
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Create / Edit Sheet ─────────────────────────────────────────────── */}
      <CategoryFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={onRefetch}
        category={editTarget}
        // Pass the right action depending on edit vs. create mode
        onSubmit={(payload) => getSubmitHandler(payload)}
      />

      {/* ── Delete Confirmation AlertDialog ─────────────────────────────────── */}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Error that occurred during the delete request */}
          {deleteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault() // prevent the dialog from auto-closing
                handleConfirmDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
});
