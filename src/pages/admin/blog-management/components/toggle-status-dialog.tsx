// ─── ToggleStatusDialog ───────────────────────────────────────────────────────
// AlertDialog for toggling a blog post between published ↔ draft.

import { useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { updateBlogPost } from "../service/blog.service"
import type { BlogPost } from "../types/blog.types"

interface ToggleStatusDialogProps {
  post: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function ToggleStatusDialog({
  post,
  open,
  onOpenChange,
  onUpdated,
}: ToggleStatusDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetStatus = post?.status === "published" ? "draft" : "published"
  const actionLabel =
    post?.status === "published" ? "Move to Draft" : "Publish"

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault()
    if (!post) return

    setError(null)
    setIsSaving(true)

    try {
      await updateBlogPost(post.id, { status: targetStatus })
      toast.success(
        targetStatus === "published"
          ? `"${post.title}" is now published.`
          : `"${post.title}" moved to drafts.`,
      )
      handleOpenChange(false)
      onUpdated()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsSaving(false)
        return
      }
      let message = "Failed to update status. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            {targetStatus === "published" ? (
              <>
                <strong className="text-foreground">{post?.title}</strong> will
                become visible in the public feed.
              </>
            ) : (
              <>
                <strong className="text-foreground">{post?.title}</strong> will
                be hidden from the public feed.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "Saving…" : actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
