// ─── BugReportFormDialog ──────────────────────────────────────────────────────
// Dialog for creating a new bug report (POST /admin/bug-reports/create).
// Fields: title (required), description (required), priority (required),
//         steps_to_reproduce (optional), page_url (optional, valid URL ≤255).

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import { createBugReport } from "../service/bug-report.service"
import type { BugReportPriority, CreateBugReportPayload } from "../types/bug-report.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

interface BugReportFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

const INITIAL: CreateBugReportPayload = {
  title: "",
  description: "",
  priority: "medium",
  steps_to_reproduce: "",
  page_url: "",
  assigned_to: null,
}

export function BugReportFormDialog({
  open,
  onOpenChange,
  onCreated,
}: BugReportFormDialogProps) {
  const [form, setForm] = useState<CreateBugReportPayload>(INITIAL)
  const [admins, setAdmins] = useState<UserListResource[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(INITIAL)
      setAdmins([])
      setError(null)
      setFieldErrors({})
    }
    onOpenChange(next)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    setLoadingAdmins(true)
    getAllUsers({ per_page: 200 })
      .then((res) => setAdmins(res.data.filter((u) => u.role === "admin")))
      .catch(() => setError("Failed to load admin users."))
      .finally(() => setLoadingAdmins(false))
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    const payload: CreateBugReportPayload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
    }
    if (form.steps_to_reproduce?.trim()) {
      payload.steps_to_reproduce = form.steps_to_reproduce.trim()
    }
    if (form.page_url?.trim()) {
      payload.page_url = form.page_url.trim()
    }
    if (form.assigned_to != null) {
      payload.assigned_to = form.assigned_to
    }

    try {
      await createBugReport(payload)
      handleOpenChange(false)
      onCreated()
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const mapped: Record<string, string> = {}
          for (const [field, msgs] of Object.entries(
            err.data.errors as Record<string, string[]>,
          )) {
            mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs)
          }
          setFieldErrors(mapped)
        } else {
          setError(err.message || "Failed to create bug report.")
        }
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
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Bug Report</DialogTitle>
          <DialogDescription>
            Describe the issue so it can be tracked and resolved.
          </DialogDescription>
        </DialogHeader>

        <form id="bug-report-form" onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="brf-title">Title *</Label>
            <Input
              id="brf-title"
              maxLength={255}
              placeholder="Short description of the bug"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              disabled={isSubmitting}
            />
            {fieldErrors.title && (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="brf-description">Description *</Label>
            <Textarea
              id="brf-description"
              placeholder="What happened? What was expected?"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={isSubmitting}
            />
            {fieldErrors.description && (
              <p className="text-xs text-destructive">{fieldErrors.description}</p>
            )}
          </div>

          {/* Priority + Assigned to */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brf-priority">Priority *</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, priority: v as BugReportPriority }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="brf-priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.priority && (
                <p className="text-xs text-destructive">{fieldErrors.priority}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brf-assigned-to">Assign to</Label>
              <Select
                value={form.assigned_to != null ? String(form.assigned_to) : undefined}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    assigned_to: v === "none" ? null : Number(v),
                  }))
                }
                disabled={loadingAdmins || isSubmitting}
              >
                <SelectTrigger id="brf-assigned-to" className="w-full">
                  <SelectValue
                    placeholder={
                      loadingAdmins
                        ? "Loading admins..."
                        : "Unassigned"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {admins.map((admin) => (
                    <SelectItem key={admin.id} value={String(admin.id)}>
                      {admin.name} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.assigned_to && (
                <p className="text-xs text-destructive">{fieldErrors.assigned_to}</p>
              )}
            </div>
          </div>

          {/* Steps to reproduce */}
          <div className="space-y-1.5">
            <Label htmlFor="brf-steps">Steps to Reproduce</Label>
            <Textarea
              id="brf-steps"
              placeholder={"1. Open page\n2. Click button\n3. Observe error"}
              rows={3}
              value={form.steps_to_reproduce}
              onChange={(e) =>
                setForm((f) => ({ ...f, steps_to_reproduce: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          {/* Page URL */}
          <div className="space-y-1.5">
            <Label htmlFor="brf-url">Page URL</Label>
            <Input
              id="brf-url"
              type="url"
              maxLength={255}
              placeholder="https://app.example.com/path"
              value={form.page_url}
              onChange={(e) => setForm((f) => ({ ...f, page_url: e.target.value }))}
              disabled={isSubmitting}
            />
            {fieldErrors.page_url && (
              <p className="text-xs text-destructive">{fieldErrors.page_url}</p>
            )}
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
          <Button type="submit" form="bug-report-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
