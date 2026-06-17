// ─── Video Category Form Dialog ────────────────────────────────────────────────
// Modal Dialog used for both Creating and Editing a video category.
//
// Props:
//   • open          — controls visibility
//   • onClose       — called when the dialog should close
//   • onSuccess     — called after a successful save (triggers list refresh)
//   • category      — if provided, the dialog is in "edit" mode; otherwise "create"
//   • onSubmit      — async function that calls the store action (create or update)

import { useEffect, useState } from "react"
import { Loader2Icon, AlertCircleIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { isApiError } from "@/lib/api"

import type { VideoCategory, VideoCategoryPayload } from "../types/category.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryFormSheetProps {
  open: boolean
  onClose: () => void
  /** Called after a successful create or update so the parent can update the list */
  onSuccess: () => void
  /** When set, the dialog operates in edit mode pre-filled with this category's data */
  category?: VideoCategory | null
  /** Async action to perform on submit — should be store.createCategory or store.updateCategory */
  onSubmit: (payload: VideoCategoryPayload) => Promise<VideoCategory>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategoryFormSheet({
  open,
  onClose,
  onSuccess,
  category,
  onSubmit,
}: CategoryFormSheetProps) {
  const [name, setName] = useState("")
  const [sortOrder, setSortOrder] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Sync form when the dialog opens ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setSortOrder(category?.sort_order != null ? String(category.sort_order) : "")
      setSubmitError(null)
    }
  }, [open, category])

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleClose() {
    if (isSubmitting) return
    setSubmitError(null)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    // Client-side validation
    const trimmed = name.trim()
    if (!trimmed) {
      setSubmitError("Name is required.")
      return
    }
    if (trimmed.length > 255) {
      setSubmitError("Name must be 255 characters or fewer.")
      return
    }
    if (sortOrder !== "") {
      const n = Number(sortOrder)
      if (!Number.isInteger(n) || n < 0) {
        setSubmitError("Sort order must be a whole number of 0 or greater.")
        return
      }
    }

    const payload: VideoCategoryPayload = {
      name: trimmed,
      ...(sortOrder !== "" && { sort_order: Number(sortOrder) }),
    }

    setIsSubmitting(true)
    try {
      await onSubmit(payload)
      toast.success(
        category
          ? `"${payload.name}" updated successfully.`
          : `"${payload.name}" created successfully.`,
      )
      onSuccess()
      handleClose()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsSubmitting(false)
        return
      }

      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const messages = Object.values(err.data.errors as Record<string, string[]>)
            .flat()
            .slice(0, 3)
          setSubmitError(messages.join(" "))
        } else if (err.status === 401) {
          setSubmitError("Your session has expired. Please log in again.")
        } else {
          setSubmitError(err.message || "An unexpected error occurred.")
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message)
      } else {
        setSubmitError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Derived labels ─────────────────────────────────────────────────────────
  const isEditing = Boolean(category)
  const title = isEditing ? "Edit Video Category" : "Create Video Category"
  const description = isEditing
    ? "Update the name or sort order of this video category. The slug updates automatically."
    : "Add a new video category. The slug is generated from the name automatically."
  const submitLabel = isEditing ? "Save changes" : "Create"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* ── Error alert ─────────────────────────────────────────────────── */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* ── Name ─────────────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="vc-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vc-name"
              placeholder="e.g. Leadership & Management"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              disabled={isSubmitting}
              className="h-10"
              autoFocus
            />
          </div>

          {/* ── Sort Order ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="vc-sort-order" className="text-sm font-medium">Sort Order</Label>
            <Input
              id="vc-sort-order"
              type="number"
              placeholder="0"
              min={0}
              step={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={isSubmitting}
              className="h-10"
            />
            <p className="text-sm text-muted-foreground">
              Optional. Lower numbers appear first.
            </p>
          </div>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
