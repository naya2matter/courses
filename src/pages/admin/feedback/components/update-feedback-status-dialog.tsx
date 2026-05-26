// ─── UpdateFeedbackStatusDialog ───────────────────────────────────────────────
// Minimal dialog for changing feedback status only (no admin_response).
// Endpoint: PUT /admin/feedback/status/{id}

import { useState, useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { updateFeedbackStatus } from "../service/feedback.service"
import type { Feedback, FeedbackStatus } from "../types/feedback.types"

interface UpdateFeedbackStatusDialogProps {
  feedback: Feedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function UpdateFeedbackStatusDialog({
  feedback,
  open,
  onOpenChange,
  onUpdated,
}: UpdateFeedbackStatusDialogProps) {
  const [status, setStatus] = useState<FeedbackStatus>("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (feedback) setStatus(feedback.status)
  }, [feedback])

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback) return
    setError(null)
    setIsSubmitting(true)

    try {
      await updateFeedbackStatus(feedback.id, { status })
      handleOpenChange(false)
      onUpdated()
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Failed to update status.")
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!feedback) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Status</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {feedback.title}
          </DialogDescription>
        </DialogHeader>

        <form id="update-status-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="us-status">Status *</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as FeedbackStatus)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="us-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-status-form"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
