// ─── ConfirmDeleteDialog ──────────────────────────────────────────────────────
// Reusable confirmation dialog for destructive delete actions.
//
// Supports two usage modes:
//   • Controlled  — pass `open` + `onOpenChange`; the parent owns open state.
//   • Trigger     — pass `children`; the child element becomes the trigger button.
//     Both modes can coexist (controlled + trigger).
//
// The parent is responsible for calling the API and managing `isLoading` /
// `error` state.  `onConfirm` fires when the user clicks the Delete button.
//
// Example (controlled mode used by tables):
//   <ConfirmDeleteDialog
//     open={deleteTarget !== null}
//     onOpenChange={(o) => { if (!o && !isDeleting) setDeleteTarget(null) }}
//     title="Delete item?"
//     isLoading={isDeleting}
//     error={deleteError}
//     onConfirm={handleDeleteConfirm}
//   />
//
// Example (trigger mode):
//   <ConfirmDeleteDialog onConfirm={handleDelete} isLoading={isDeleting}>
//     <Button variant="destructive" size="sm">Delete</Button>
//   </ConfirmDeleteDialog>

import { AlertCircleIcon, Loader2Icon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ── Props ─────────────────────────────────────────────────────────────────────

interface ConfirmDeleteDialogProps {
  /** Controlled open state. Omit to use trigger-only (uncontrolled) mode. */
  open?: boolean
  /** Called when the dialog requests a visibility change (controlled mode). */
  onOpenChange?: (open: boolean) => void
  /** Dialog heading — defaults to "Delete item?" */
  title?: string
  /** Body text — defaults to the standard destructive action warning. */
  description?: string
  /** Label for the confirm button — defaults to "Delete". */
  confirmLabel?: string
  /** When true the Delete button shows a spinner and is disabled. */
  isLoading?: boolean
  /** Error message shown as a destructive Alert inside the dialog. */
  error?: string | null
  /** Called when the user clicks the Delete (confirm) button. */
  onConfirm: () => void
  /** Optional trigger element — rendered as `AlertDialogTrigger`. */
  children?: React.ReactNode
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Delete item?",
  description = "This action cannot be undone. If this item is linked to other records, deletion may fail until related records are reassigned or removed.",
  confirmLabel = "Delete",
  isLoading = false,
  error,
  onConfirm,
  children,
}: ConfirmDeleteDialogProps) {
  const isControlled = open !== undefined

  const dialogContent = (
    <AlertDialogContent className="sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-relaxed">
          {description}
        </AlertDialogDescription>
      </AlertDialogHeader>

      {error && (
        <Alert variant="destructive" className="mt-1">
          <AlertCircleIcon className="h-4 w-4 shrink-0" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            // Prevent the default close-on-click so the parent can close
            // only after a successful API response.
            e.preventDefault()
            onConfirm()
          }}
          disabled={isLoading}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Deleting…
            </>
          ) : (
            confirmLabel
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )

  // ── Controlled mode (parent manages open state) ───────────────────────────
  if (isControlled) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        {children != null && (
          <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
        )}
        {dialogContent}
      </AlertDialog>
    )
  }

  // ── Trigger mode (uncontrolled) ───────────────────────────────────────────
  return (
    <AlertDialog>
      {children != null && (
        <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      )}
      {dialogContent}
    </AlertDialog>
  )
}
