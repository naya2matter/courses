// ─── DeleteEvaluationConfigDialog ────────────────────────────────────────────
// AlertDialog that confirms deletion before calling the API.
// Stays open (with an error message) if the API returns 422 (history lock).

import { useState } from "react"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { isApiError } from "@/lib/api"
import { deleteEvaluationConfig } from "../service/evaluation-config.service"
import type { EvaluationConfig } from "../types/evaluation-config.types"

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractDeleteError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422) {
      return "This config cannot be deleted because it is used in historical evaluation snapshots."
    }
    if (err.status === 401) return "You are not authenticated."
    if (err.status === 403) return "You do not have permission to delete this config."
    if (err.status === 404) return "Config not found."
    return err.message || "Failed to delete the config."
  }
  if (err instanceof Error) return err.message
  return "Failed to delete the config."
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface DeleteEvaluationConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The config to delete, or null when the dialog is closed */
  config: EvaluationConfig | null
  onSuccess: () => void
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DeleteEvaluationConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: DeleteEvaluationConfigDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(value: boolean) {
    // Clear inline error when the dialog closes so it doesn't reappear
    if (!value) setError(null)
    onOpenChange(value)
  }

  async function handleConfirm() {
    if (!config) return
    setError(null)
    setSubmitting(true)
    try {
      await deleteEvaluationConfig(config.id)
      toast.success(`"${config.name}" deleted successfully.`)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      // Ignore browser-cancelled requests — not a real error
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractDeleteError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete evaluation config?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. If this config is used in historical
            evaluation snapshots, deletion will be blocked.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Inline error — stays visible until the user closes or retries */}
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>

          {/*
           * Use a plain Button (not AlertDialogAction) so we can prevent the
           * dialog from auto-closing when the delete fails.
           */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
