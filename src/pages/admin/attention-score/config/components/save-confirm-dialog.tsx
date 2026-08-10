// ─── Save Confirmation Dialog ───────────────────────────────────────────────────
// Saving a config change recalculates every historical session, which is a
// visible change to real data and reports — so we warn before it runs, and keep
// the dialog open on failure so the client sees why nothing happened.

import { AlertCircleIcon, AlertTriangleIcon, Loader2Icon } from "lucide-react"

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
  configName: string
  /** Non-blocking validation warnings, surfaced one last time before committing. */
  warningCount: number
  /** Server-side failure from the previous attempt, if any. */
  error: string | null
  onConfirm: () => void
}

export function SaveConfirmDialog({
  open,
  onOpenChange,
  isSaving,
  configName,
  warningCount,
  error,
  onConfirm,
}: SaveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Save and recalculate?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 text-sm leading-relaxed">
            <span className="block">
              This saves <span className="font-medium text-white/80">{configName || "the config"}</span>{" "}
              as the new active version and immediately starts recalculating every historical
              session's attention score. All reports, dashboards, and KPI counts will change to
              match.
            </span>
            <span className="block text-white/50">
              The version that is active now stays in history and can be restored at any time.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {warningCount > 0 && !error && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-2.5 text-xs leading-relaxed text-amber-300">
            <AlertTriangleIcon className="mt-px size-3.5 shrink-0" />
            {warningCount === 1
              ? "There is 1 warning on this config — it will save, but double-check the highlighted section first."
              : `There are ${warningCount} warnings on this config — it will save, but double-check the highlighted sections first.`}
          </p>
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5 text-xs leading-relaxed text-red-400">
            <AlertCircleIcon className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        )}

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
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : error ? (
              "Try again"
            ) : (
              "Save & Recalculate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
