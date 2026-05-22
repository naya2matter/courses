// ─── EvaluationConfigFormDialog ───────────────────────────────────────────────
// Handles both Create (config=null) and Edit (config=EvaluationConfig) modes.

import { useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { isApiError } from "@/lib/api"
import {
  createEvaluationConfig,
  updateEvaluationConfig,
} from "../service/evaluation-config.service"
import type {
  AppliesToValue,
  EvaluationConfig,
  EvaluationConfigPayload,
} from "../types/evaluation-config.types"

// ── Types ──────────────────────────────────────────────────────────────────────

interface EvaluationConfigFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null → create mode; EvaluationConfig → edit mode */
  config: EvaluationConfig | null
  onSuccess: () => void
}

interface FieldErrors {
  name?: string
  max_score?: string
  applies_to?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function validate(name: string, maxScore: string, appliesTo: string): FieldErrors {
  const errors: FieldErrors = {}

  if (!name.trim()) {
    errors.name = "Name is required."
  } else if (name.trim().length > 255) {
    errors.name = "Name must be at most 255 characters."
  }

  if (!maxScore.trim()) {
    errors.max_score = "Max score is required."
  } else {
    const n = Number(maxScore)
    if (!Number.isInteger(n) || n < 1) {
      errors.max_score = "Max score must be a whole number of at least 1."
    }
  }

  if (!appliesTo) {
    errors.applies_to = "Applies to is required."
  }

  return errors
}

function extractApiError(err: unknown): string {
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      const messages = Object.values(err.data.errors as Record<string, string[]>).flat()
      if (messages.length > 0) return messages[0]
    }
    if (err.status === 401) return "You are not authenticated. Please log in again."
    return err.message || "An unexpected error occurred."
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EvaluationConfigFormDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: EvaluationConfigFormDialogProps) {
  const isEdit = config !== null

  const [name, setName] = useState("")
  const [maxScore, setMaxScore] = useState("")
  const [appliesTo, setAppliesTo] = useState<AppliesToValue | "">("")

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Populate / reset whenever the dialog opens or switches between create/edit
  useEffect(() => {
    if (open) {
      setName(config?.name ?? "")
      setMaxScore(config != null ? String(config.max_score) : "")
      setAppliesTo(config?.applies_to ?? "")
      setFieldErrors({})
      setApiError(null)
    }
  }, [open, config])

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError(null)

    const errors = validate(name, maxScore, appliesTo)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const payload: EvaluationConfigPayload = {
      name: name.trim(),
      max_score: Number(maxScore),
      applies_to: appliesTo as AppliesToValue,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await updateEvaluationConfig(config.id, payload)
        toast.success("Evaluation config updated successfully.")
      } else {
        await createEvaluationConfig(payload)
        toast.success("Evaluation config created successfully.")
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      setApiError(extractApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Evaluation Config" : "New Evaluation Config"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update the scoring category "${config.name}".`
              : "Define a new scoring category for evaluations."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-5" noValidate>
          {/* ── Name ──────────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="cfg-name">
              Name <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Input
              id="cfg-name"
              placeholder="e.g. Attendance"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearFieldError("name")
              }}
              aria-invalid={!!fieldErrors.name}
              disabled={submitting}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* ── Max Score ─────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="cfg-max-score">
              Max Score <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Input
              id="cfg-max-score"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 5"
              value={maxScore}
              onChange={(e) => {
                setMaxScore(e.target.value)
                clearFieldError("max_score")
              }}
              aria-invalid={!!fieldErrors.max_score}
              disabled={submitting}
            />
            {fieldErrors.max_score && (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.max_score}
              </p>
            )}
          </div>

          {/* ── Applies To ────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="cfg-applies-to">
              Applies To <span className="text-destructive" aria-hidden>*</span>
            </Label>
            <Select
              value={appliesTo}
              onValueChange={(v) => {
                setAppliesTo(v as AppliesToValue)
                clearFieldError("applies_to")
              }}
              disabled={submitting}
            >
              <SelectTrigger id="cfg-applies-to" aria-invalid={!!fieldErrors.applies_to}>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.applies_to && (
              <p className="text-xs text-destructive" role="alert">
                {fieldErrors.applies_to}
              </p>
            )}
          </div>

          {/* ── API error ─────────────────────────────────────────────────── */}
          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* ── Footer ────────────────────────────────────────────────────── */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Config"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
