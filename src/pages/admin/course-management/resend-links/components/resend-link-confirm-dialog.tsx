// ─── ResendLinkConfirmDialog ──────────────────────────────────────────────────
// Confirmation dialog before resending a login link.

import { useState } from "react"
import { toast } from "sonner"
import { SendIcon, Loader2Icon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { isApiError } from "@/lib/api"
import { resendLoginLink } from "../service/resend-links.service"
import type { ExpiredLinkAssignment } from "../types/resend-links.types"

interface ResendLinkConfirmDialogProps {
  assignment: ExpiredLinkAssignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a successful resend so the parent can refetch */
  onResent: () => void
}

export function ResendLinkConfirmDialog({
  assignment,
  open,
  onOpenChange,
  onResent,
}: ResendLinkConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!assignment) return
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await resendLoginLink(assignment.id)
      toast.success(res.message || "Login link resent successfully.")
      onOpenChange(false)
      onResent()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let message = "Failed to resend the login link. Please try again."
      if (isApiError(err)) {
        if (err.status === 404) message = "Assignment not found."
        else if (err.status === 422) {
          const firstField = err.data?.errors
            ? Object.values(err.data.errors as Record<string, string[]>)[0]?.[0]
            : null
          message = firstField ?? err.message ?? message
        } else {
          message = err.message || message
        }
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!isSubmitting) {
      setError(null)
      onOpenChange(open)
    }
  }

  if (!assignment) return null

  const isNeverSent = assignment.user.link_expires_at === null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SendIcon className="h-4 w-4 text-amber-400" />
            Resend Login Link
          </DialogTitle>
          <DialogDescription>
            {isNeverSent
              ? "A login link has never been sent to this user for this course."
              : "The login link for this user has expired."}
            {" "}A fresh link valid for 72 hours will be generated and emailed.
          </DialogDescription>
        </DialogHeader>

        {/* User + course info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="w-16 shrink-0 text-muted-foreground">User</span>
            <div className="min-w-0">
              <p className="font-medium truncate">{assignment.user.name}</p>
              <p className="text-muted-foreground text-xs truncate">{assignment.user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-16 shrink-0 text-muted-foreground">Course</span>
            <p className="font-medium line-clamp-2">{assignment.course.name}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-16 shrink-0 text-muted-foreground">Status</span>
            <p className={isNeverSent ? "text-rose-400" : "text-amber-400"}>
              {isNeverSent ? "Never sent" : "Expired"}
            </p>
          </div>
        </div>

        {/* Inline error */}
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SendIcon className="mr-2 h-4 w-4" />
            )}
            {isSubmitting ? "Sending…" : "Send Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
