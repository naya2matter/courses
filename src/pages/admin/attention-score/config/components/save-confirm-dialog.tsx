// ─── Save Confirmation Dialog ───────────────────────────────────────────────────
// Saving a config change recalculates every historical session, which is a
// visible, one-way change to real data and reports — so we warn before it runs.

import { Loader2Icon } from "lucide-react"
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

interface SaveConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onConfirm: () => void
}

export function SaveConfirmDialog({ open, onOpenChange, isSaving, onConfirm }: SaveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Save and recalculate?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Saving this config creates a new active version and immediately starts recalculating
            every historical session's attention score with these new numbers. This updates all
            reports, dashboards, and KPI counts. The previous config remains in history and can be
            restored at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save & Recalculate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
