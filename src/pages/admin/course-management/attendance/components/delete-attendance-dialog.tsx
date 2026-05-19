// ─── DeleteAttendanceDialog ───────────────────────────────────────────────────
// Professional confirmation dialog before permanently deleting a clocking record.

import { useState } from "react"
import { AlertTriangleIcon, Loader2Icon, Trash2Icon } from "lucide-react"
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
      <AlertDialogContent className="overflow-hidden border border-border/60 bg-background/95 shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-destructive/20 to-transparent" />

        <AlertDialogHeader className="relative pb-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10 text-destructive shadow-sm backdrop-blur-sm">
              <Trash2Icon className="h-6 w-6" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-foreground">
                Delete attendance record
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-sm text-muted-foreground max-w-xl">
                This will permanently remove the record from the system. Please confirm that you want to delete the attendance entry below.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="relative rounded-4xl border border-border/40 bg-card/80 p-5 shadow-sm ring-1 ring-white/5">
          <div className="flex items-center gap-3 rounded-3xl bg-destructive/10 px-3 py-2 text-destructive">
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium leading-5">
              This action cannot be undone.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-background/90 p-4 ring-1 ring-border/40">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Attendee
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {userName}
              </p>
            </div>
            <div className="rounded-2xl bg-background/90 p-4 ring-1 ring-border/40">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Clock In Time
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {clockIn}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            onClick={handleClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              "Delete record"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
