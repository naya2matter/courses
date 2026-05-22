// ─── DeleteBugReportDialog ────────────────────────────────────────────────────
// AlertDialog confirming permanent deletion of a bug report.
// Stays open on failure and shows the error inline. Closes only on success.

import { useState } from "react"
import { toast } from "sonner"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { deleteBugReport } from "../service/bug-report.service"
import type { BugReport } from "../types/bug-report.types"

interface DeleteBugReportDialogProps {
  report: BugReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteBugReportDialog({
  report,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBugReportDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleDelete(e: React.MouseEvent) {
    // Prevent the dialog from closing before we finish
    e.preventDefault()
    if (!report) return

    setError(null)
    setIsDeleting(true)

    try {
      await deleteBugReport(report.id)
      toast.success(`"${report.title}" has been deleted.`)
      handleOpenChange(false)
      onDeleted()
    } catch (err) {
      // Silently ignore canceled (aborted) requests
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsDeleting(false)
        return
      }
      let message = "Failed to delete bug report. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete bug report?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The bug report will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
