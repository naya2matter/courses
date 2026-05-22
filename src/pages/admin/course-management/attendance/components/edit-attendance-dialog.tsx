// ─── EditAttendanceDialog ─────────────────────────────────────────────────────
// Sheet / dialog for editing a clocking record.

import { useEffect, useState } from "react"
import { AlertCircleIcon, Loader2Icon, SaveIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

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
  return (
    err instanceof DOMException && err.name === "AbortError"
  )
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

  function handleClose() {
    if (!isSaving) {
      setError(null)
      setValidationErrors({})
      onClose()
    }
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col gap-0 p-0 border-l border-white/10">
        <SheetHeader className="px-6 py-5 border-b border-white/10">
          <SheetTitle className="text-xl">Edit Attendance Record</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Update clocking times, comment, or rating. Duration is recalculated automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Error banner */}
            {error && (
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Clock In */}
            <div className="space-y-3">
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

            {/* Clock Out */}
            <div className="space-y-3">
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

            {/* Rating */}
            <div className="space-y-3">
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
            <div className="space-y-3">
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
                className={[
                  "flex w-full rounded-md border bg-background px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                  validationErrors.comment ? "border-destructive" : "border-input",
                ].join(" ")}
              />
              {validationErrors.comment && (
                <p className="text-sm text-destructive">{validationErrors.comment}</p>
              )}
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-white/10 mt-auto bg-background/50 backdrop-blur-sm">
            <div className="flex w-full justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="min-w-[100px]">
                {isSaving ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SaveIcon className="mr-2 h-4 w-4" />
                )}
                <span className="ml-1">Save</span>
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
