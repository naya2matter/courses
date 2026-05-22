// ─── DeleteEvaluationTypeDialog ───────────────────────────────────────────────
// AlertDialog confirming evaluation type deletion.
//
// ⚠️  The confirm button is a plain <Button> — NOT <AlertDialogAction> —
//     so Radix UI does NOT auto-close the dialog when a 422 error is returned.

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

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
import { deleteEvaluationType } from "../service/evaluation-type.service"
import type { EvaluationConfigType } from "../types/evaluation-config.types"

// ── Props ──────────────────────────────────────────────────────────────────────

interface DeleteEvaluationTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: EvaluationConfigType | null
  onSuccess: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DeleteEvaluationTypeDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: DeleteEvaluationTypeDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleConfirm() {
    if (!type) return
    setIsDeleting(true)
    setError("")

    try {
      await deleteEvaluationType(type.id)
      toast.success(`"${type.type_name}" deleted.`)
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      if (isApiError(err) && err.status === 422) {
        setError(
          "This type cannot be deleted because it is referenced in historical evaluation snapshots.",
        )
      } else {
        setError("Failed to delete type. Please try again.")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!isDeleting) {
          setError("")
          onOpenChange(next)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sub-type</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {type?.type_name ?? "this type"}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <p className="px-1 text-sm text-destructive">{error}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {/* Plain Button — prevents Radix auto-close on error */}
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
