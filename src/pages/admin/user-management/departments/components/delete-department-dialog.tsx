// ─── Delete Department Dialog ───────────────────────────────────────────────
// Reusable component for confirming and deleting a department.

import { useState, type ReactNode } from "react"
import { AlertCircleIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@radix-ui/react-dialog"

import { isApiError } from "@/lib/api"
import { deleteDepartment } from "../service/department.service"
import type { Department } from "../types/department.types"

interface DeleteDepartmentDialogProps {
  department: Department
  onSuccess: () => void
  children: ReactNode
}

function extractDeleteError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 401) return "You are not authenticated."
    if (err.status === 403) return "You are not allowed to delete this department."
    if (err.status === 404) return "Department not found."
    if (err.status === 422 && err.data?.message) return String(err.data.message)
    return err.message || "Failed to delete the department."
  }

  if (err instanceof Error) return err.message
  return "Failed to delete the department."
}

export function DeleteDepartmentDialog({
  department,
  onSuccess,
  children,
}: DeleteDepartmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChildren = department.children && department.children.length > 0

  async function handleConfirmDelete() {
    setError(null)
    setSubmitting(true)

    try {
      // call delete API
      await deleteDepartment(department.id)
      toast.success("Department deleted successfully.")
      setOpen(false)
      onSuccess()
    } catch (err) {
      // ignore aborted requests
      if (err instanceof DOMException && err.name === "AbortError") return
      setError(extractDeleteError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value: boolean) => {
      if (!value) {
        setError(null)
      }
      setOpen(value)
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogContent className="group/dialog-content fixed top-1/2 start-1/2 z-50 grid w-full -translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 gap-3 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
          <div className="grid grid-rows-[auto_1fr] place-items-center gap-1 text-center sm:text-start">
            <AlertCircleIcon className="size-8 text-destructive" />
            <DialogTitle className="text-sm font-medium">Delete Department</DialogTitle>
            <DialogDescription className="text-xs/relaxed text-balance text-muted-foreground md:text-pretty">
              Are you sure you want to delete this department? This action cannot be undone.
            </DialogDescription>
            {hasChildren && (
              <Alert className="mt-2" variant="destructive">
                <AlertDescription>
                  This will fail if the department has subdepartments.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert className="mt-2" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline" disabled={submitting}>Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={handleConfirmDelete}
            >
              {submitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
