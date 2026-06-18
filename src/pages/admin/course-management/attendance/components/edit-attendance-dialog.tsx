// ─── EditAttendanceDialog ─────────────────────────────────────────────────────
// Centered dialog for editing a clocking record. Mirrors the premium styling of
// DeleteAttendanceDialog so the two share one visual language. Fully responsive:
// full-width sheet-like feel on mobile, comfortable centered card on desktop.

import { useEffect, useState } from "react"
import { AlertCircleIcon, Loader2Icon, PencilIcon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { ClockingRecord, UpdateAttendancePayload } from "../types/attendance.types"
import { updateAttendance } from "../service/attendance.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert an ISO 8601 datetime string to the value accepted by
 * <input type="datetime-local"> (YYYY-MM-DDTHH:mm, local-time).
 */
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    // Offset to local time
    const offset = d.getTimezoneOffset() * 60_000
    const local = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
  } catch {
    return ""
  }
}

/**
 * Convert a <input type="datetime-local"> value back to RFC 3339 UTC string.
 * Returns null if the value is empty.
 */
function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null
  try {
    return new Date(value).toISOString()
  } catch {
    return null
  }
}

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback
  return fallback
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EditAttendanceDialogProps {
  open: boolean
  record: ClockingRecord | null
  onClose: () => void
  onUpdated: (updated: ClockingRecord) => void
}

interface FormState {
  clock_in: string
  clock_out: string
  comment: string
  rating: string
}

function recordToForm(record: ClockingRecord | null): FormState {
  return {
    clock_in: toDatetimeLocal(record?.clock_in),
    clock_out: toDatetimeLocal(record?.clock_out),
    comment: record?.comment ?? "",
    rating: record?.rating != null ? String(record.rating) : "",
  }
}

export function EditAttendanceDialog({
  open,
  record,
  onClose,
  onUpdated,
}: EditAttendanceDialogProps) {
  const [form, setForm] = useState<FormState>(recordToForm(record))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Reset form whenever the record changes or dialog opens
  useEffect(() => {
    if (open) {
      setForm(recordToForm(record))
      setError(null)
      setValidationErrors({})
    }
  }, [open, record])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear field-level validation error on change
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}

    const ratingNum = form.rating.trim() !== "" ? Number(form.rating) : null
    if (ratingNum !== null && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)) {
      errors.rating = "Rating must be between 1 and 5."
    }

    if (form.comment.length > 1000) {
      errors.comment = "Comment must not exceed 1000 characters."
    }

    // Validate clock_in/clock_out ordering
    if (form.clock_in && form.clock_out) {
      const inMs = new Date(form.clock_in).getTime()
      const outMs = new Date(form.clock_out).getTime()
      if (!isNaN(inMs) && !isNaN(outMs) && outMs < inMs) {
        errors.clock_out = "Clock-out must be after clock-in."
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!record) return
    if (!validate()) return

    setError(null)
    setIsSaving(true)

    const payload: UpdateAttendancePayload = {
      clock_in: form.clock_in ? fromDatetimeLocal(form.clock_in) : null,
      clock_out: form.clock_out ? fromDatetimeLocal(form.clock_out) : null,
      comment: form.comment.trim() || null,
      rating: form.rating.trim() !== "" ? Number(form.rating) : undefined,
    }

    try {
      const updated = await updateAttendance(record.id, payload)
      toast.success("Attendance record updated successfully.")
      onUpdated(updated)
      onClose()
    } catch (err) {
      if (isCanceledError(err)) return

      // Handle 422 validation errors from server
      const apiErr = err as { status?: number; data?: { errors?: Record<string, string[]> } }
      if (apiErr?.status === 422 && apiErr?.data?.errors) {
        const serverErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(apiErr.data.errors)) {
          serverErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
        }
        setValidationErrors(serverErrors)
        setError("Please fix the highlighted fields.")
      } else {
        const message = extractErrorMessage(err, "Failed to update attendance record.")
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (next || isSaving) return
    setError(null)
    setValidationErrors({})
    onClose()
  }

  const userName = record?.user?.name ?? "Unknown user"
  const courseName = record?.course?.name ?? "—"

  const textareaClasses = [
    "flex w-full rounded-xl border bg-background/80 px-3 py-2 text-sm",
    "placeholder:text-muted-foreground focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors",
    validationErrors.comment ? "border-destructive" : "border-border/60",
  ].join(" ")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isSaving}
        className="w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border border-border/60 bg-background/95 p-0 text-sm shadow-2xl shadow-indigo-950/20 backdrop-blur-2xl sm:max-w-lg"
      >
        {/* Soft top glow to match the delete dialog */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-primary/15 to-transparent" />

        <DialogHeader className="relative gap-0 px-5 pb-5 pt-6 sm:px-6 sm:pt-7">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm backdrop-blur-sm sm:h-14 sm:w-14">
              <PencilIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold text-foreground sm:text-lg">
                Edit attendance record
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Update clocking times, comment, or rating. Duration is recalculated automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body — caps height so tall forms never overflow the viewport */}
        <div className="relative max-h-[60vh] space-y-5 overflow-y-auto px-5 pb-2 sm:px-6">
          {/* Context strip: who / which course (read-only) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-card/70 p-3.5 ring-1 ring-border/40">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Attendee</p>
              <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{userName}</p>
            </div>
            <div className="rounded-2xl bg-card/70 p-3.5 ring-1 ring-border/40">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Course</p>
              <p className="mt-1.5 truncate text-sm font-semibold text-foreground">{courseName}</p>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Clock In / Clock Out — side by side on larger screens */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-clock-in" className="text-sm font-medium">Clock In</Label>
              <Input
                id="edit-clock-in"
                type="datetime-local"
                value={form.clock_in}
                onChange={(e) => handleChange("clock_in", e.target.value)}
                disabled={isSaving}
                className={`h-10 ${validationErrors.clock_in ? "border-destructive" : ""}`}
              />
              {validationErrors.clock_in && (
                <p className="text-sm text-destructive">{validationErrors.clock_in}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-clock-out" className="text-sm font-medium">Clock Out</Label>
              <Input
                id="edit-clock-out"
                type="datetime-local"
                value={form.clock_out}
                onChange={(e) => handleChange("clock_out", e.target.value)}
                disabled={isSaving}
                className={`h-10 ${validationErrors.clock_out ? "border-destructive" : ""}`}
              />
              {validationErrors.clock_out && (
                <p className="text-sm text-destructive">{validationErrors.clock_out}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="edit-rating" className="text-sm font-medium">Rating (1–5)</Label>
            <Input
              id="edit-rating"
              type="number"
              min={1}
              max={5}
              step={0.5}
              placeholder="e.g. 4"
              value={form.rating}
              onChange={(e) => handleChange("rating", e.target.value)}
              disabled={isSaving}
              className={`h-10 ${validationErrors.rating ? "border-destructive" : ""}`}
            />
            {validationErrors.rating && (
              <p className="text-sm text-destructive">{validationErrors.rating}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="edit-comment" className="text-sm font-medium">
              Comment
              <span className="ml-1 text-xs text-muted-foreground">
                ({form.comment.length}/1000)
              </span>
            </Label>
            <textarea
              id="edit-comment"
              rows={4}
              placeholder="Optional comment…"
              value={form.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              disabled={isSaving}
              maxLength={1000}
              className={textareaClasses}
            />
            {validationErrors.comment && (
              <p className="text-sm text-destructive">{validationErrors.comment}</p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 border-t border-border/40 bg-background/40 px-5 py-4 backdrop-blur-sm sm:px-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2 sm:w-auto sm:min-w-[110px]"
          >
            {isSaving ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4" />
            )}
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
