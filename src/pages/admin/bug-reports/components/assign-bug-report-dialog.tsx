// ─── Assign Bug Report Dialog ─────────────────────────────────────────────────
// Fetches admin users and lets you assign a report to one of them.

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { assignBugReport } from "../service/bug-report.service"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { BugReport } from "../types/bug-report.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

interface AssignBugReportDialogProps {
  report: BugReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned: () => void
}

export function AssignBugReportDialog({
  report,
  open,
  onOpenChange,
  onAssigned,
}: AssignBugReportDialogProps) {
  const [admins, setAdmins] = useState<UserListResource[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-select the currently assigned admin when the dialog opens
  useEffect(() => {
    if (!open) {
      setSelectedId(null)
      setError(null)
      setAdmins([])
      return
    }

    setSelectedId(report?.assigned_to?.id ?? null)

    setLoadingAdmins(true)
    setError(null)
    getAllUsers({ per_page: 200 })
      .then((res) => setAdmins(res.data.filter((u) => u.role === "admin")))
      .catch(() => setError("Failed to load admin users."))
      .finally(() => setLoadingAdmins(false))
  }, [open, report])

  async function handleAssign() {
    if (!report || selectedId === null) return
    setError(null)
    setIsSubmitting(true)

    try {
      await assignBugReport(report.id, selectedId)
      onOpenChange(false)
      onAssigned()
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Failed to assign bug report.")
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Bug Report</DialogTitle>
          <DialogDescription>
            Select an admin to assign{" "}
            <span className="font-medium text-foreground">
              &ldquo;{report?.title}&rdquo;
            </span>{" "}
            to.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="assign-admin">Assigned User</Label>
          <Select
            value={selectedId !== null ? String(selectedId) : undefined}
            onValueChange={(v) => setSelectedId(Number(v))}
            disabled={loadingAdmins || isSubmitting || admins.length === 0}
          >
            <SelectTrigger id="assign-admin">
              <SelectValue
                placeholder={loadingAdmins ? "Loading admins..." : "Select an admin"}
              />
            </SelectTrigger>
            <SelectContent>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={String(admin.id)}>
                  {admin.name} ({admin.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isSubmitting || selectedId === null}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
