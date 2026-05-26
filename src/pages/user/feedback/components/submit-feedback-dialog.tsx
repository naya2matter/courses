// ─── SubmitFeedbackDialog ─────────────────────────────────────────────────────
// Dialog for the user to submit new feedback.
// Endpoint: POST /user/feedback/create

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
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
import { createMyFeedback } from "../service/user-feedback.service"
import type { CreateUserFeedbackPayload, FeedbackType } from "../types/user-feedback.types"

interface SubmitFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const INITIAL: CreateUserFeedbackPayload = {
  type: "suggestion",
  title: "",
  description: "",
}

export function SubmitFeedbackDialog({
  open,
  onOpenChange,
  onCreated,
}: SubmitFeedbackDialogProps) {
  const [form, setForm] = useState<CreateUserFeedbackPayload>(INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(INITIAL)
      setError(null)
      setFieldErrors({})
    }
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await createMyFeedback({
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
      })
      handleOpenChange(false)
      onCreated()
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
          setError(err.message || "Failed to submit feedback.")
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Share a suggestion, improvement, feature request, or general feedback.
          </DialogDescription>
        </DialogHeader>

        <form id="submit-feedback-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Type */}
          <div className="space-y-1.5">
            <Label htmlFor="sf-type">Type *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((f) => ({ ...f, type: v as FeedbackType }))}
              disabled={isSubmitting}
            >
              <SelectTrigger id="sf-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.type && (
              <p className="text-xs text-destructive">{fieldErrors.type}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="sf-title">Title *</Label>
            <Input
              id="sf-title"
              maxLength={255}
              placeholder="Short summary of your feedback"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              {fieldErrors.title ? (
                <p className="text-xs text-destructive">{fieldErrors.title}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground ml-auto">
                {form.title.length}/255
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="sf-description">Description *</Label>
            <Textarea
              id="sf-description"
              placeholder="Describe your feedback in detail…"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              {fieldErrors.description ? (
                <p className="text-xs text-destructive">{fieldErrors.description}</p>
              ) : <span />}
              <p className="text-xs text-muted-foreground ml-auto">
                {form.description.length}/2000
              </p>
            </div>
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
            form="submit-feedback-form"
            disabled={isSubmitting || !form.title.trim() || !form.description.trim()}
          >
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
