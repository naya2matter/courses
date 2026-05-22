// ─── DeleteEvaluationDialog ───────────────────────────────────────────────────
// AlertDialog confirmation before deleting an evaluation.
// Uses plain Button (NOT AlertDialogAction) to prevent Radix auto-close on 422.

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
import { deleteEvaluation } from "../service/evaluation.service"
import type { Evaluation } from "../types/evaluation.types"

interface Props {
  evaluation: Evaluation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteEvaluationDialog({ evaluation, open, onOpenChange, onSuccess }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!evaluation) return
    setIsDeleting(true)
    try {
      await deleteEvaluation(evaluation.id)
      toast.success("Evaluation deleted successfully.")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to delete evaluation."
      if (isApiError(err)) msg = err.message ?? msg
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border border-white/10 bg-[oklch(0.18_0.02_260)] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Evaluation</AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            This will permanently delete the evaluation for{" "}
            <span className="font-semibold text-white">
              {evaluation?.user?.name ?? `User #${evaluation?.user_id}`}
            </span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </AlertDialogCancel>
          {/* Plain Button — NOT AlertDialogAction — prevents Radix auto-close on API error */}
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
