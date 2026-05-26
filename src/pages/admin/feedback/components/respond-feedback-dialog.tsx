// ─── RespondFeedbackDialog ────────────────────────────────────────────────────
// Dialog for admin to respond to feedback and update its status.
// Endpoint: PUT /admin/feedback/respond/{id}

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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { respondToFeedback } from "../service/feedback.service"
import type { Feedback, FeedbackStatus } from "../types/feedback.types"

interface RespondFeedbackDialogProps {
  feedback: Feedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function RespondFeedbackDialog({
  feedback,
  open,
  onOpenChange,
  onUpdated,
}: RespondFeedbackDialogProps) {
  const [adminResponse, setAdminResponse] = useState("")
  const [status, setStatus] = useState<FeedbackStatus>("under_review")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Pre-fill when feedback changes
  useEffect(() => {
    if (feedback) {
      setAdminResponse(feedback.admin_response ?? "")
      setStatus(feedback.status)
    }
  }, [feedback])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAdminResponse("")
      setStatus("under_review")
      setError(null)
      setFieldErrors({})
    }
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!feedback) return
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await respondToFeedback(feedback.id, {
        admin_response: adminResponse.trim(),
        status,
      })
      handleOpenChange(false)
      onUpdated()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const mapped: Record<string, string> = {}
          for (const [field, msgs] of Object.entries(
            err.data.errors as Record<string, string[]>,
          )) {
            mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs)
          }
          setFieldErrors(mapped)
        } else {
          setError(err.message || "Failed to submit response.")
        }
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Respond to Feedback</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {feedback.title}
          </DialogDescription>
        </DialogHeader>

        <form id="respond-feedback-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Admin Response */}
          <div className="space-y-1.5">
            <Label htmlFor="rf-response">Admin Response *</Label>
            <Textarea
              id="rf-response"
              placeholder="Write your response here…"
              rows={4}
              maxLength={1000}
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              {fieldErrors.admin_response ? (
                <p className="text-xs text-destructive">{fieldErrors.admin_response}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {adminResponse.length}/1000
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="rf-status">Status *</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as FeedbackStatus)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="rf-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.status && (
              <p className="text-xs text-destructive">{fieldErrors.status}</p>
            )}
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
            form="respond-feedback-form"
            disabled={isSubmitting || !adminResponse.trim()}
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Submit Response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
