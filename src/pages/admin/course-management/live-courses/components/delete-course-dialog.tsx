// ─── DeleteCourseDialog ───────────────────────────────────────────────────────
// AlertDialog confirmation before permanently deleting a course.

import { useState } from "react"
import { AlertCircleIcon } from "lucide-react"
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

import type { CourseResource } from "../types/course.types"
import { extractCourseErrorMessage, isCanceledError } from "../utils/course-feedback"

interface DeleteCourseDialogProps {
  open: boolean
  course: CourseResource | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteCourseDialog({
  open,
  course,
  onClose,
  onConfirm,
}: DeleteCourseDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setIsDeleting(true)
    try {
      await onConfirm()
      toast.success(`Course \"${course?.name ?? "item"}\" deleted successfully.`)
      onClose()
    } catch (err) {
      if (isCanceledError(err)) return
      const message = extractCourseErrorMessage(err, "Failed to delete course. Please try again.")
      setError(message)
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  function handleClose() {
    if (!isDeleting) {
      setError(null)
      onClose()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Course</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {course?.name ?? "this course"}
            </span>
            ? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
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
