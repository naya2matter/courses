// ─── Restore Confirmation Dialog ────────────────────────────────────────────────
// Restoring is exactly as destructive as saving — it makes an old version active
// and recalculates every historical session against it — so it gets the same
// warning rather than firing straight off a table button.

import { Loader2Icon, RotateCcwIcon } from "lucide-react"

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
import type { AttentionScoreConfigHistoryItem } from "../types/attention-score.types"

interface RestoreConfirmDialogProps {
  /** The version being restored; null closes the dialog. */
  target: AttentionScoreConfigHistoryItem | null
  onOpenChange: (open: boolean) => void
  isRestoring: boolean
  onConfirm: () => void
}

export function RestoreConfirmDialog({
  target,
  onOpenChange,
  isRestoring,
  onConfirm,
}: RestoreConfirmDialogProps) {
  return (
    <AlertDialog open={target !== null} onOpenChange={(o) => !isRestoring && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcwIcon className="size-4 text-indigo-400" />
            Restore this version?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-sm leading-relaxed">
            <span className="block">
              <span className="font-medium text-white/80">{target?.name}</span> becomes the active
              config, and every historical session is recalculated against its numbers. All reports,
              dashboards, and KPI counts will change to match.
            </span>
            <span className="block text-white/50">
              This is saved as a new version — the config that is active right now stays in history
              and can be restored again later.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Restoring…
              </>
            ) : (
              "Restore & Recalculate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
