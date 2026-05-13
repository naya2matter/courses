// --- ClockOutDialog (Redesigned) ----------------------------------------------

import { useEffect, useState } from "react"
import { LogOutIcon, Loader2Icon, AlertCircleIcon, StarIcon } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { clockOut } from "../service/clocking.service"
import type { ClockingRecord } from "../types/clocking.types"

// -- Helpers -------------------------------------------------------------------

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function extractError(err: unknown, fallback: string): string {
  const apiErr = err as { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }
  if (apiErr?.status === 422 && apiErr?.data?.errors) {
    const first = Object.values(apiErr.data.errors)[0]
    return Array.isArray(first) ? first[0] : String(first)
  }
  if (apiErr?.data?.message) return apiErr.data.message
  if (err instanceof Error) return err.message || fallback
  return fallback
}

// -- StarRating ----------------------------------------------------------------

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Great",
  5: "Excellent",
}

interface StarRatingProps {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}

function StarRating({ value, onChange, disabled }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star === value ? 0 : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="group transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <StarIcon
              className={[
                "h-8 w-8 transition-all duration-150",
                active >= star
                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "fill-transparent text-foreground/20 group-hover:text-amber-400/40",
              ].join(" ")}
            />
          </button>
        ))}
      </div>
      <span className="h-4 text-xs font-medium text-amber-400/80">
        {active > 0 ? RATING_LABELS[active] : ""}
      </span>
    </div>
  )
}

// -- Component -----------------------------------------------------------------

interface ClockOutDialogProps {
  open: boolean
  clockInTime: string | null
  onClose: () => void
  onClockOut: (record: ClockingRecord) => void
}

export function ClockOutDialog({ open, clockInTime, onClose, onClockOut }: ClockOutDialogProps) {
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState("—")

  useEffect(() => {
    if (!open || !clockInTime) return
    function tick() {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(clockInTime!).getTime()) / 1000))
      const h = Math.floor(diff / 3600)
      const m = Math.floor((diff % 3600) / 60)
      const s = diff % 60
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${m}m ${String(s).padStart(2, "0")}s`,
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [open, clockInTime])

  function handleClose() {
    if (isLoading) return
    setComment("")
    setRating(0)
    setError(null)
    onClose()
  }

  async function handleSubmit() {
    if (comment.length > 1000) {
      setError("Comment must not exceed 1000 characters.")
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const record = await clockOut({
        comment: comment.trim() || null,
        rating: rating > 0 ? rating : undefined,
      })
      toast.success("Session ended!")
      onClockOut(record)
      handleClose()
    } catch (err) {
      if (isCanceledError(err)) return
      setError(extractError(err, "Failed to clock out. Please try again."))
    } finally {
      setIsLoading(false)
    }
  }

  const charPct = Math.min(100, (comment.length / 1000) * 100)
  const charColor = comment.length > 900 ? "bg-red-500" : comment.length > 700 ? "bg-amber-500" : "bg-indigo-500"

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden border border-border bg-background backdrop-blur-2xl text-foreground">
        {/* Glows */}
        <div className="pointer-events-none absolute -top-14 left-1/2 h-28 w-44 -translate-x-1/2 rounded-full bg-red-500/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-28 w-28 rounded-full bg-indigo-500/8 blur-2xl" />

        <DialogHeader className="relative pb-2 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-linear-to-br from-red-500/15 to-rose-500/10">
            <LogOutIcon className="h-7 w-7 text-red-400" />
          </div>
          <DialogTitle className="text-xl font-semibold text-foreground">End Session</DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Wrap up your session. Add a rating or note before finishing.
          </p>
        </DialogHeader>

        {/* Live elapsed timer */}
        {clockInTime && (
          <div className="relative mx-auto w-full max-w-65 rounded-2xl border border-white/8 bg-white/4 px-5 py-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">Session Duration</p>
            <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-foreground">{elapsed}</p>
            <p className="mt-1 text-[11px] text-foreground/25">
              Started {new Date(clockInTime).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>
        )}

        <div className="relative mt-2 space-y-5">
          {error && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-400">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <label className="block text-center text-xs font-medium text-foreground/55">
              How was this session?
            </label>
            <StarRating value={rating} onChange={setRating} disabled={isLoading} />
          </div>

          {/* Divider */}
          <div className="h-px bg-white/6" />

          {/* Comment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="clock-out-comment" className="text-xs font-medium text-foreground/55">
                Notes
                <span className="ml-1.5 text-foreground/25">(optional)</span>
              </label>
              <span className={`text-[11px] ${comment.length > 900 ? "text-red-400" : "text-foreground/25"}`}>
                {comment.length}/1000
              </span>
            </div>
            <textarea
              id="clock-out-comment"
              rows={3}
              placeholder="How did the session go?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isLoading}
              maxLength={1000}
              className={[
                "flex w-full resize-none rounded-xl border bg-white/5 px-3 py-2.5 text-sm",
                "placeholder:text-foreground/20 text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/35 focus-visible:ring-offset-0",
                "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                comment.length > 900 ? "border-red-500/40" : "border-border",
              ].join(" ")}
            />
            {/* Character progress bar */}
            {comment.length > 0 && (
              <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${charColor}`}
                  style={{ width: `${charPct}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6 flex-col gap-2 sm:flex-row">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 border border-border text-foreground/55 hover:bg-white/5 hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-foreground transition-all hover:bg-red-500"
          >
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Ending…
              </>
            ) : (
              <>
                <LogOutIcon className="mr-2 h-4 w-4" />
                Clock Out
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
