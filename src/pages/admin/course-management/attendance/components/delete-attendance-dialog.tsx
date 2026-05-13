// ─── DeleteAttendanceDialog ───────────────────────────────────────────────────
// Professional confirmation dialog before permanently deleting a clocking record.

import { useState } from "react"
import { AlertTriangleIcon, Loader2Icon } from "lucide-react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import type { ClockingRecord } from "../types/attendance.types"
import { deleteAttendance } from "../service/attendance.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback
  return fallback
}

function formatDatetime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DeleteAttendanceDialogProps {
  open: boolean
  record: ClockingRecord | null
  onClose: () => void
  onDeleted: (id: number) => void
}

export function DeleteAttendanceDialog({
  open,
  record,
  onClose,
  onDeleted,
}: DeleteAttendanceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!record) return
    setError(null)
    setIsDeleting(true)
    try {
      await deleteAttendance(record.id)
      toast.success("Attendance record deleted successfully.")
      onDeleted(record.id)
      onClose()
    } catch (err) {
      if (isCanceledError(err)) return
      const message = extractErrorMessage(err, "Failed to delete the record. Please try again.")
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

  const userName = record?.user?.name ?? "Unknown user"
  const clockIn = formatDatetime(record?.clock_in)

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive shrink-0">
              <AlertTriangleIcon className="h-5 w-5" />
            </span>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-3 text-sm">
            You are about to permanently delete the attendance record for{" "}
            <span className="font-semibold text-foreground">{userName}</span>{" "}
            (clocked in at{" "}
            <span className="font-semibold text-foreground">{clockIn}</span>
            ).
            <br />
            <span className="mt-1 block font-medium text-destructive">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete Record"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
