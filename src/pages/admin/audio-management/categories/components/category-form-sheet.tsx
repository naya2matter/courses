// ─── Category Form Sheet ───────────────────────────────────────────────────────
// Slide-in Sheet used for both Creating and Editing an audio category.
//
// Props:
//   • open          — controls visibility
//   • onClose       — called when the sheet should close
//   • onSuccess     — called after a successful save (triggers list refresh)
//   • category      — if provided, the sheet is in "edit" mode; otherwise "create"
//   • onSubmit      — async function that calls the store action (create or update)

import { useEffect, useState } from "react"
import { Loader2Icon, AlertCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { isApiError } from "@/lib/api"

import type { AudioCategoryResource, CreateCategoryPayload } from "../types/category.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryFormSheetProps {
  open: boolean
  onClose: () => void
  /** Called after a successful create or update so the parent can update the list */
  onSuccess: () => void
  /** When set, the sheet operates in edit mode pre-filled with this category's data */
  category?: AudioCategoryResource | null
  /** Async action to perform on submit — should be store.createCategory or store.updateCategory */
  onSubmit: (payload: CreateCategoryPayload) => Promise<AudioCategoryResource>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategoryFormSheet({
  open,
  onClose,
  onSuccess,
  category,
  onSubmit,
}: CategoryFormSheetProps) {
  // Form field states
  const [name, setName] = useState("")
  const [sortOrder, setSortOrder] = useState("")

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── Sync form when the sheet opens (edit mode pre-fills, create mode clears) ──
  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setSortOrder(category?.sort_order != null ? String(category.sort_order) : "")
      setSubmitError(null)
    }
  }, [open, category])

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Reset and close the sheet */
  function handleClose() {
    if (isSubmitting) return // prevent closing while a request is in flight
    setSubmitError(null)
    onClose()
  }

  /** Validate fields and call the store action */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    // Client-side required check
    if (!name.trim()) {
      setSubmitError("Name is required.")
      return
    }

    // Build the payload — sort_order is optional
    const payload: CreateCategoryPayload = {
      name: name.trim(),
      ...(sortOrder !== "" && { sort_order: Number(sortOrder) }),
    }

    setIsSubmitting(true)
    try {
      await onSubmit(payload)
      onSuccess()
      handleClose()
    } catch (err) {
      // Ignore navigation cancellations
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsSubmitting(false)
        return
      }

      // Surface validation errors from the API (HTTP 422)
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          // Collect the first message from each field's error array
          const messages = Object.values(err.data.errors as Record<string, string[]>)
            .flat()
            .slice(0, 3) // show at most 3 errors at once
          setSubmitError(messages.join(" "))
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

  // ── Derived labels (create vs. edit) ──────────────────────────────────────
  const isEditing = Boolean(category)
  const title = isEditing ? "Edit Category" : "Create Category"
  const description = isEditing
    ? "Update the name or sort order of this audio category."
    : "Add a new audio category. The name is required."
  const submitLabel = isEditing ? "Save changes" : "Create"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {/* Form starts right after the header */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5 px-1">

          {/* ── Error alert ──────────────────────────────────────────────── */}
          {submitError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {/* ── Name field ───────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="category-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="e.g. Meditation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* ── Sort Order field ─────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="category-sort-order">Sort Order</Label>
            <Input
              id="category-sort-order"
              type="number"
              placeholder="0"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Lower numbers appear first.
            </p>
          </div>

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
