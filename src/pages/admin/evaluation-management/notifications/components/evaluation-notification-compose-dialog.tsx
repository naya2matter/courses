// ─── EvaluationNotificationComposeDialog ─────────────────────────────────────
// Multi-step dialog: Form → Preview → Confirm Send → Result
// Steps:
//   1. "compose"  — fill form fields
//   2. "preview"  — show dry-run result, no email sent
//   3. "confirm"  — AlertDialog asking for final confirmation
//   4. "result"   — show send outcome

import { useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  SendIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { isApiError } from "@/lib/api"
import {
  previewEvaluationNotification,
  sendEvaluationNotification,
} from "../service/evaluation-notification.service"
import type {
  EvaluationNotificationPreviewData,
  EvaluationNotificationSendResponse,
  ApiValidationError,
} from "../types/evaluation-notification.types"
import { ManagerMultiSelect } from "./manager-multi-select"

// ── Validation ────────────────────────────────────────────────────────────────

interface FormErrors {
  manager_ids?: string
  subject?: string
  message?: string
  date?: string
}

interface FormState {
  manager_ids: number[]
  subject: string
  message: string
  start_date: string
  end_date: string
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {}
  if (form.manager_ids.length === 0) {
    errors.manager_ids = "Select at least one manager."
  }
  if (!form.subject.trim()) {
    errors.subject = "Subject is required."
  } else if (form.subject.length > 255) {
    errors.subject = "Subject must be 255 characters or fewer."
  }
  if (!form.message.trim()) {
    errors.message = "Message is required."
  } else if (form.message.length > 2000) {
    errors.message = "Message must be 2000 characters or fewer."
  }
  if (form.start_date && form.end_date && form.end_date < form.start_date) {
    errors.date = "End date must be on or after start date."
  }
  return errors
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0
}

// ── Step: Compose ─────────────────────────────────────────────────────────────

interface ComposeStepProps {
  form: FormState
  errors: FormErrors
  apiErrors: Record<string, string[]>
  isPreviewing: boolean
  onChange: (partial: Partial<FormState>) => void
  onPreview: () => void
  onClose: () => void
}

function ComposeStep({
  form,
  errors,
  apiErrors,
  isPreviewing,
  onChange,
  onPreview,
  onClose,
}: ComposeStepProps) {
  function fieldError(field: string): string | undefined {
    return apiErrors[field]?.[0]
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Managers */}
      <div className="space-y-1.5">
        <Label className="text-sm">
          Managers <span className="text-red-400">*</span>
        </Label>
        <ManagerMultiSelect
          selectedIds={form.manager_ids}
          onChange={(ids) => onChange({ manager_ids: ids })}
          error={errors.manager_ids ?? fieldError("manager_ids")}
        />
      </div>

      {/* Subject */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="notif-subject" className="text-sm">
            Subject <span className="text-red-400">*</span>
          </Label>
          <span className={`text-xs tabular-nums ${form.subject.length > 240 ? "text-amber-400" : "text-muted-foreground"}`}>
            {form.subject.length}/255
          </span>
        </div>
        <Input
          id="notif-subject"
          value={form.subject}
          maxLength={255}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="e.g. Q1 2026 Evaluation Report"
          aria-invalid={!!(errors.subject || fieldError("subject"))}
        />
        {(errors.subject || fieldError("subject")) && (
          <p className="text-xs text-red-400">{errors.subject ?? fieldError("subject")}</p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="notif-message" className="text-sm">
            Message <span className="text-red-400">*</span>
          </Label>
          <span className={`text-xs tabular-nums ${form.message.length > 1900 ? "text-amber-400" : "text-muted-foreground"}`}>
            {form.message.length}/2000
          </span>
        </div>
        <Textarea
          id="notif-message"
          value={form.message}
          maxLength={2000}
          rows={4}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Please review the evaluation results for your team…"
          aria-invalid={!!(errors.message || fieldError("message"))}
        />
        {(errors.message || fieldError("message")) && (
          <p className="text-xs text-red-400">{errors.message ?? fieldError("message")}</p>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="notif-start" className="text-sm text-muted-foreground">
            Start Date <span className="text-muted-foreground/50">(optional)</span>
          </Label>
          <Input
            id="notif-start"
            type="date"
            value={form.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notif-end" className="text-sm text-muted-foreground">
            End Date <span className="text-muted-foreground/50">(optional)</span>
          </Label>
          <Input
            id="notif-end"
            type="date"
            value={form.end_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
          />
        </div>
      </div>
      {errors.date && <p className="text-xs text-red-400">{errors.date}</p>}

      <Separator className="opacity-20" />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onPreview}
          disabled={isPreviewing || hasErrors(validateForm(form))}
        >
          {isPreviewing ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : null}
          Preview
        </Button>
      </div>
    </div>
  )
}

// ── Step: Preview ─────────────────────────────────────────────────────────────

interface PreviewStepProps {
  preview: EvaluationNotificationPreviewData
  isSending: boolean
  onBack: () => void
  onSend: () => void
}

function PreviewStep({ preview, isSending, onBack, onSend }: PreviewStepProps) {
  return (
    <div className="space-y-4">
      {/* No-email-sent banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
        No emails have been sent yet. This is a preview only.
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-0.5">
          <p className="text-muted-foreground text-xs">Employees covered</p>
          <p className="text-2xl font-bold tabular-nums">{preview.employee_count}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-0.5">
          <p className="text-muted-foreground text-xs">Evaluations included</p>
          <p className={`text-2xl font-bold tabular-nums ${preview.evaluation_count === 0 ? "text-amber-400" : ""}`}>
            {preview.evaluation_count}
          </p>
        </div>
      </div>

      {preview.evaluation_count === 0 && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>
            No evaluations match the selected criteria. The email will be sent but may have no data.
          </AlertDescription>
        </Alert>
      )}

      {/* Date range */}
      {(preview.date_range?.start || preview.date_range?.end) && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground">
          Date range: {preview.date_range.start ?? "all"} → {preview.date_range.end ?? "all"}
        </div>
      )}

      {/* Recipients */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Recipients ({preview.managers.length})
        </p>
        <div className="max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
          {preview.managers.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="font-medium text-foreground">{m.name}</span>
              <span className="text-muted-foreground">{m.email}</span>
            </div>
          ))}
        </div>
      </div>

      <Separator className="opacity-20" />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onBack} type="button">
          Back
        </Button>
        <Button
          type="button"
          onClick={onSend}
          disabled={isSending}
        >
          {isSending ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <SendIcon className="mr-2 size-4" />
          )}
          Send Emails
        </Button>
      </div>
    </div>
  )
}

// ── Step: Result ──────────────────────────────────────────────────────────────

interface ResultStepProps {
  result: EvaluationNotificationSendResponse
  onClose: () => void
}

function ResultStep({ result, onClose }: ResultStepProps) {
  const allSuccess = result.success_count > 0 && result.failed_count === 0
  const allFailed = result.success_count === 0 && result.failed_count > 0

  return (
    <div className="space-y-4">
      {/* Outcome banner */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
          allSuccess
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : allFailed
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
        }`}
      >
        {allSuccess ? (
          <CheckCircle2Icon className="size-4 shrink-0" />
        ) : (
          <XCircleIcon className="size-4 shrink-0" />
        )}
        <span>
          {allSuccess
            ? "All emails were queued successfully."
            : allFailed
            ? "All emails failed to queue."
            : `${result.success_count} queued, ${result.failed_count} failed.`}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Emails are queued and may be delivered shortly.
      </p>

      {/* Counts */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-muted-foreground">Queued</p>
          <p className="text-2xl font-bold tabular-nums text-emerald-400">
            {result.success_count}
          </p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold tabular-nums text-red-400">
            {result.failed_count}
          </p>
        </div>
      </div>

      {/* Sent to */}
      {result.sent_to?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Sent to
          </p>
          <div className="max-h-28 overflow-y-auto rounded-xl border border-white/10 bg-white/5 divide-y divide-white/10">
            {result.sent_to.map((m) => (
              <p key={m.id} className="px-3 py-2 text-xs text-foreground">
                {m.email}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Failed */}
      {result.failed_to?.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-widest text-red-400">
            Failed
          </p>
          <div className="max-h-28 overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 divide-y divide-red-500/10">
            {result.failed_to.map((m) => (
              <div key={m.id} className="px-3 py-2 text-xs">
                <span className="text-red-300">{m.email}</span>
                {m.error && (
                  <span className="ml-2 text-red-400/70">{m.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator className="opacity-20" />

      <div className="flex justify-end">
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationNotificationComposeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: () => void
}

// ── Main component ────────────────────────────────────────────────────────────

type Step = "compose" | "preview" | "result"

const EMPTY_FORM: FormState = {
  manager_ids: [],
  subject: "",
  message: "",
  start_date: "",
  end_date: "",
}

export function EvaluationNotificationComposeDialog({
  open,
  onOpenChange,
  onSent,
}: EvaluationNotificationComposeDialogProps) {
  const [step, setStep] = useState<Step>("compose")
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [touchedErrors, setTouchedErrors] = useState<FormErrors>({})
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const [isPreviewing, setIsPreviewing] = useState(false)
  const [preview, setPreview] = useState<EvaluationNotificationPreviewData | null>(null)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<EvaluationNotificationSendResponse | null>(null)

  function handleChange(partial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...partial }))
    setApiErrors({})
    setApiError(null)
  }

  function handleClose() {
    // Reset fully
    setStep("compose")
    setForm(EMPTY_FORM)
    setTouchedErrors({})
    setApiErrors({})
    setApiError(null)
    setPreview(null)
    setSendResult(null)
    onOpenChange(false)
  }

  async function handlePreview() {
    const errors = validateForm(form)
    setTouchedErrors(errors)
    if (hasErrors(errors)) return

    setIsPreviewing(true)
    setApiError(null)
    setApiErrors({})
    try {
      const payload = {
        manager_ids: form.manager_ids,
        subject: form.subject,
        message: form.message,
        ...(form.start_date ? { start_date: form.start_date } : {}),
        ...(form.end_date ? { end_date: form.end_date } : {}),
      }
      const res = await previewEvaluationNotification(payload)
      setPreview(res.data)
      setStep("preview")
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      if (isApiError(err)) {
        if (err.status === 422) {
          const ve = err.data as ApiValidationError
          setApiErrors(ve.errors ?? {})
          setApiError(ve.message ?? "Validation failed.")
        } else {
          setApiError(err.message ?? "Preview failed.")
        }
      } else if (err instanceof Error) {
        setApiError(err.message)
      }
    } finally {
      setIsPreviewing(false)
    }
  }

  async function handleSend() {
    setConfirmOpen(false)
    setIsSending(true)
    setApiError(null)
    try {
      const payload = {
        manager_ids: form.manager_ids,
        subject: form.subject,
        message: form.message,
        ...(form.start_date ? { start_date: form.start_date } : {}),
        ...(form.end_date ? { end_date: form.end_date } : {}),
      }
      const res = await sendEvaluationNotification(payload)
      setSendResult(res)
      setStep("result")
      onSent()

      if (res.failed_count === 0) {
        toast.success(`${res.success_count} email${res.success_count !== 1 ? "s" : ""} queued successfully.`)
      } else if (res.success_count > 0) {
        toast.warning(`${res.success_count} queued, ${res.failed_count} failed.`)
      } else {
        toast.error("All emails failed to queue.")
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to send notifications."
      if (isApiError(err)) msg = err.message ?? msg
      else if (err instanceof Error) msg = err.message
      setApiError(msg)
      toast.error(msg)
    } finally {
      setIsSending(false)
    }
  }

  const formErrors = touchedErrors

  const titles: Record<Step, string> = {
    compose: "Compose Notification",
    preview: "Preview",
    result: "Send Result",
  }

  const descriptions: Record<Step, string> = {
    compose: "Fill in the details for your evaluation report email.",
    preview: "Review what will be sent before confirming.",
    result: "Email queue status.",
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{titles[step]}</DialogTitle>
            <DialogDescription>{descriptions[step]}</DialogDescription>
          </DialogHeader>

          {apiError && step === "compose" && (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {step === "compose" && (
            <ComposeStep
              form={form}
              errors={formErrors}
              apiErrors={apiErrors}
              isPreviewing={isPreviewing}
              onChange={handleChange}
              onPreview={handlePreview}
              onClose={handleClose}
            />
          )}

          {step === "preview" && preview && (
            <PreviewStep
              preview={preview}
              isSending={isSending}
              onBack={() => setStep("compose")}
              onSend={() => setConfirmOpen(true)}
            />
          )}

          {step === "result" && sendResult && (
            <ResultStep result={sendResult} onClose={handleClose} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Send confirmation AlertDialog ──────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send evaluation report emails?</AlertDialogTitle>
            <AlertDialogDescription>
              Emails will be queued for the selected managers. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <SendIcon className="mr-2 size-4" />
              )}
              Send Emails
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
