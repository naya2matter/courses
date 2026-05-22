// ─── EditBugReportDialog ──────────────────────────────────────────────────────
// Dialog for updating an existing bug report.
// Supports: priority, status, and assigned_to.

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
import { updateBugReport } from "../service/bug-report.service"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type {
  BugReport,
  BugReportPriority,
  BugReportStatus,
} from "../types/bug-report.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

interface EditBugReportDialogProps {
  report: BugReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: () => void
}

export function EditBugReportDialog({
  report,
  open,
  onOpenChange,
  onUpdated,
}: EditBugReportDialogProps) {
  const [priority, setPriority] = useState<BugReportPriority>("medium")
  const [status, setStatus] = useState<BugReportStatus>("open")
  const [assignedTo, setAssignedTo] = useState<number | null>(null)

  const [admins, setAdmins] = useState<UserListResource[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (report) {
      setPriority(report.priority)
      setStatus(report.status)
      setAssignedTo(report.assigned_to?.id ?? null)
      setError(null)
    }
  }, [report])

  useEffect(() => {
    if (!open) {
      setAdmins([])
      return
    }

    setLoadingAdmins(true)
    getAllUsers({ per_page: 200 })
      .then((res) => setAdmins(res.data.filter((u) => u.role === "admin")))
      .catch(() => setError("Failed to load admin users."))
      .finally(() => setLoadingAdmins(false))
  }, [open])

  function handleOpenChange(next: boolean) {
    if (!next) setError(null)
    onOpenChange(next)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!report) return
    setError(null)
    setIsSubmitting(true)
    try {
      await updateBugReport(report.id, { priority, status, assigned_to: assignedTo })
      handleOpenChange(false)
      onUpdated()
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message || "Failed to update bug report.")
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Bug Report</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {report?.title}
          </DialogDescription>
        </DialogHeader>

        <form id="edit-bug-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="eb-priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as BugReportPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="eb-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="eb-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as BugReportStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="eb-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eb-assignee">Assigned User</Label>
            <Select
              value={assignedTo === null ? "unassigned" : String(assignedTo)}
              onValueChange={(v) => setAssignedTo(v === "unassigned" ? null : Number(v))}
              disabled={loadingAdmins || isSubmitting}
            >
              <SelectTrigger id="eb-assignee">
                <SelectValue
                  placeholder={loadingAdmins ? "Loading admins..." : "Select assignee"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={String(admin.id)}>
                    {admin.name} ({admin.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button type="submit" form="edit-bug-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
