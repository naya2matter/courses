// ─── DeleteBlogPostDialog ─────────────────────────────────────────────────────
// AlertDialog confirming permanent deletion of a blog post.
// Stays open on failure and shows the error inline; closes only on success.

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
import { deleteBlogPost } from "../service/blog.service"
import type { BlogPost } from "../types/blog.types"

interface DeleteBlogPostDialogProps {
  post: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted: () => void
}

export function DeleteBlogPostDialog({
  post,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBlogPostDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!post) return

    setError(null)
    setIsDeleting(true)

    try {
      await deleteBlogPost(post.id)
      toast.success(`"${post.title}" has been deleted.`)
      handleOpenChange(false)
      onDeleted()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsDeleting(false)
        return
      }
      let message = "Failed to delete blog post. Please try again."
      if (isApiError(err)) message = err.message || message
      else if (err instanceof Error) message = err.message
      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Deleting this post will also remove
            its comments and likes.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
