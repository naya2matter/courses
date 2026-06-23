// ─── EditAttendanceDialog ─────────────────────────────────────────────────────

import { useEffect, useState, useMemo } from "react"
import { AlertCircleIcon, ClockIcon, Loader2Icon, SaveIcon, StarIcon, UserIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DateTimePickerField } from "@/components/ui/date-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { ClockingRecord, UpdateAttendancePayload } from "../types/attendance.types"
import { updateAttendance } from "../service/attendance.service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    const offset = d.getTimezoneOffset() * 60_000
    const local  = new Date(d.getTime() - offset)
    return local.toISOString().slice(0, 16)
  } catch { return "" }
}

function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null
  try { return new Date(value).toISOString() } catch { return null }
}

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message || fallback
  return fallback
}

/** Format minutes → "Xh Ym" or "Ym" */
function formatDuration(mins: number): string {
  if (mins <= 0) return "—"
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const numeric = value.trim() !== "" ? Number(value) : 0
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= numeric
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onMouseEnter={() => setHovered(star)}
            onClick={() => onChange(value.trim() !== "" && numeric === star ? "" : String(star))}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            <StarIcon
              className={cn(
                "size-5 transition-colors duration-100",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/25 hover:text-amber-400/40",
              )}
            />
          </button>
        )
      })}
      {numeric > 0 && (
        <span className="ml-1 text-xs text-muted-foreground/60 tabular-nums">{numeric}/5</span>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface EditAttendanceDialogProps {
  open: boolean
  record: ClockingRecord | null
  onClose: () => void
  onUpdated: (updated: ClockingRecord) => void
}

interface FormState {
  clock_in:  string
  clock_out: string
  comment:   string
  rating:    string
}

function recordToForm(record: ClockingRecord | null): FormState {
  return {
    clock_in:  toDatetimeLocal(record?.clock_in),
    clock_out: toDatetimeLocal(record?.clock_out),
    comment:   record?.comment ?? "",
    rating:    record?.rating != null ? String(record.rating) : "",
  }
}

export function EditAttendanceDialog({
  open,
  record,
  onClose,
  onUpdated,
}: EditAttendanceDialogProps) {
  const [form, setForm]                   = useState<FormState>(recordToForm(record))
  const [isSaving, setIsSaving]           = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [validationErrors, setValidation] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setForm(recordToForm(record))
      setError(null)
      setValidation({})
    }
  }, [open, record])

  // Compute duration in minutes
  const durationMins = useMemo(() => {
    if (!form.clock_in || !form.clock_out) return null
    const inMs  = new Date(form.clock_in).getTime()
    const outMs = new Date(form.clock_out).getTime()
    if (isNaN(inMs) || isNaN(outMs) || outMs < inMs) return null
    return Math.round((outMs - inMs) / 60_000)
  }, [form.clock_in, form.clock_out])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidation((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {}
    const ratingNum = form.rating.trim() !== "" ? Number(form.rating) : null
    if (ratingNum !== null && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5))
      errors.rating = "Rating must be between 1 and 5."
    if (form.comment.length > 1000)
      errors.comment = "Comment must not exceed 1000 characters."
    if (form.clock_in && form.clock_out) {
      const inMs  = new Date(form.clock_in).getTime()
      const outMs = new Date(form.clock_out).getTime()
      if (!isNaN(inMs) && !isNaN(outMs) && outMs < inMs)
        errors.clock_out = "Clock-out must be after clock-in."
    }
    setValidation(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSave() {
    if (!record || !validate()) return
    setError(null)
    setIsSaving(true)

    const payload: UpdateAttendancePayload = {
      clock_in:  form.clock_in  ? fromDatetimeLocal(form.clock_in)  : null,
      clock_out: form.clock_out ? fromDatetimeLocal(form.clock_out) : null,
      comment:   form.comment.trim() || null,
      rating:    form.rating.trim() !== "" ? Number(form.rating) : undefined,
    }

    try {
      const updated = await updateAttendance(record.id, payload)
      toast.success("Attendance record updated.")
      onUpdated(updated)
      onClose()
    } catch (err) {
      if (isCanceledError(err)) return
      const apiErr = err as { status?: number; data?: { errors?: Record<string, string[]> } }
      if (apiErr?.status === 422 && apiErr?.data?.errors) {
        const serverErrors: Record<string, string> = {}
        for (const [field, messages] of Object.entries(apiErr.data.errors))
          serverErrors[field] = Array.isArray(messages) ? messages[0] : String(messages)
        setValidation(serverErrors)
        setError("Please fix the highlighted fields.")
      } else {
        const msg = extractErrorMessage(err, "Failed to update attendance record.")
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleOpenChange(next: boolean) {
    if (next || isSaving) return
    setError(null); setValidation({})
    onClose()
  }

  const userName   = record?.user?.name   ?? "Unknown user"
  const courseName = record?.course?.name ?? "—"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isSaving}
        className="w-full max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border border-white/[0.08] bg-[#0a0917]/98 p-0 text-sm shadow-2xl shadow-indigo-950/30 backdrop-blur-2xl sm:max-w-lg"
      >
        {/* Top glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-600/10 to-transparent" />

        {/* ── Header ── */}
        <DialogHeader className="relative gap-0 px-5 pb-4 pt-6 sm:px-6 sm:pt-7">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 shadow-sm">
              <ClockIcon className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold sm:text-[17px]">
                Edit attendance record
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground/70 sm:text-[13px]">
                Update clocking times, rating, or comment.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ── */}
        <div className="relative max-h-[62vh] space-y-4 overflow-y-auto px-5 pb-3 sm:px-6">

          {/* Context strip */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: UserIcon, label: "Attendee", value: userName },
              { label: "Course", value: courseName },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
                {Icon && <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/40" />}
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">{label}</p>
                  <p className="mt-1 truncate text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Clock times card ── */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
            {/* Clock In */}
            <div className="p-4">
              <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Clock In
              </Label>
              <DateTimePickerField
                value={form.clock_in}
                onChange={(v) => handleChange("clock_in", v)}
                disabled={isSaving}
                placeholder="Pick clock-in time"
              />
              {validationErrors.clock_in && (
                <p className="mt-1.5 text-xs text-destructive">{validationErrors.clock_in}</p>
              )}
            </div>

            {/* Duration indicator */}
            <div className="flex items-center gap-3 px-4 py-1">
              <div className="h-px flex-1 bg-white/[0.06]" />
              <div className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
                durationMins !== null
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                  : "bg-white/[0.04] text-muted-foreground/30",
              )}>
                <ClockIcon className="size-3 shrink-0" />
                {durationMins !== null ? formatDuration(durationMins) : "Duration"}
              </div>
              <div className="h-px flex-1 bg-white/[0.06]" />
            </div>

            {/* Clock Out */}
            <div className="p-4">
              <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Clock Out
              </Label>
              <DateTimePickerField
                value={form.clock_out}
                onChange={(v) => handleChange("clock_out", v)}
                disabled={isSaving}
                placeholder="Pick clock-out time"
              />
              {validationErrors.clock_out && (
                <p className="mt-1.5 text-xs text-destructive">{validationErrors.clock_out}</p>
              )}
            </div>
          </div>

          {/* ── Rating ── */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Rating
            </Label>
            <StarRating
              value={form.rating}
              onChange={(v) => handleChange("rating", v)}
              disabled={isSaving}
            />
            {validationErrors.rating && (
              <p className="text-xs text-destructive">{validationErrors.rating}</p>
            )}
          </div>

          {/* ── Comment ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Comment
              <span className="normal-case tracking-normal text-muted-foreground/35">
                ({form.comment.length}/1000)
              </span>
            </Label>
            <textarea
              rows={3}
              placeholder="Optional comment…"
              value={form.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              disabled={isSaving}
              maxLength={1000}
              className={cn(
                "flex w-full resize-none rounded-xl border bg-white/[0.03] px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground/30 focus-visible:outline-none",
                "focus-visible:ring-1 focus-visible:ring-indigo-500/40",
                "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                validationErrors.comment ? "border-destructive" : "border-white/[0.08]",
              )}
            />
            {validationErrors.comment && (
              <p className="text-xs text-destructive">{validationErrors.comment}</p>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="gap-2 border-t border-white/[0.07] bg-white/[0.02] px-5 py-3.5 sm:px-6">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSaving}
            className="h-9 w-full border-white/10 bg-white/[0.03] hover:bg-white/[0.07] sm:w-auto sm:min-w-[90px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 w-full gap-2 sm:w-auto sm:min-w-[110px]"
          >
            {isSaving
              ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              : <SaveIcon className="h-3.5 w-3.5" />}
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
