// ─── EvaluationTypeFormDialog ─────────────────────────────────────────────────
// Dual-mode (create / edit) Dialog for evaluation sub-types.
// • type = null  → create mode (uses configId)
// • type ≠ null  → edit mode

import { useEffect, useState } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"

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

import { isApiError } from "@/lib/api"
import {
  createEvaluationType,
  updateEvaluationType,
} from "../service/evaluation-type.service"
import type {
  ApiValidationError,
  EvaluationConfigType,
} from "../types/evaluation-config.types"

// ── Helpers ────────────────────────────────────────────────────────────────────

type FieldErrors = Partial<Record<"type_name" | "score_value", string>>

function extractApiError(err: unknown): {
  message: string
  fieldErrors: FieldErrors
} {
  if (isApiError(err)) {
    if (err.status === 422) {
      const body = err.data as ApiValidationError
      const fe: FieldErrors = {}
      if (body?.errors?.type_name?.[0]) fe.type_name = body.errors.type_name[0]
      if (body?.errors?.score_value?.[0])
        fe.score_value = body.errors.score_value[0]
      return { message: body?.message ?? "Validation failed.", fieldErrors: fe }
    }
    if (err.status === 401)
      return { message: "Unauthorized.", fieldErrors: {} }
    return {
      message: `Server error (${err.status}).`,
      fieldErrors: {},
    }
  }
  return {
    message: "Unexpected error. Please try again.",
    fieldErrors: {},
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface EvaluationTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** ID of the parent config (required for create mode) */
  configId: number
  /** Upper bound for a single type score, based on the parent config */
  maxScore: number
  /** null → create mode, non-null → edit mode */
  type: EvaluationConfigType | null
  onSuccess: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationTypeFormDialog({
  open,
  onOpenChange,
  configId,
  maxScore,
  type,
  onSuccess,
}: EvaluationTypeFormDialogProps) {
  const isEdit = type !== null

  const [typeName, setTypeName] = useState("")
  const [scoreValue, setScoreValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  // Reset when the dialog opens or switches between create / edit target
  useEffect(() => {
    if (!open) return
    setTypeName(type?.type_name ?? "")
    setScoreValue(type?.score_value?.toString() ?? "")
    setServerError("")
    setFieldErrors({})
  }, [open, type])

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!typeName.trim()) {
      errs.type_name = "Type name is required."
    } else if (typeName.trim().length > 255) {
      errs.type_name = "Must be 255 characters or fewer."
    }
    const score = parseInt(scoreValue, 10)
    if (scoreValue.trim() === "") {
      errs.score_value = "Score value is required."
    } else if (isNaN(score) || score < 0) {
      errs.score_value = "Must be a non-negative integer."
    } else if (score > maxScore) {
      errs.score_value = `Cannot exceed the config max score of ${maxScore}.`
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }

    setFieldErrors({})
    setServerError("")
    setIsSubmitting(true)

    try {
      const score = parseInt(scoreValue, 10)
      if (isEdit && type) {
        await updateEvaluationType(type.id, {
          type_name: typeName.trim(),
          score_value: score,
        })
        toast.success("Type updated successfully.")
      } else {
        await createEvaluationType(configId, {
          type_name: typeName.trim(),
          score_value: score,
        })
        toast.success("Type created successfully.")
      }
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      const { message, fieldErrors: fe } = extractApiError(err)
      setServerError(message)
      setFieldErrors(fe)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Sub-type" : "New Sub-type"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update the name or score value for this evaluation sub-type. Max allowed score: ${maxScore}.`
              : `Add a new scoring sub-type to this evaluation config. Max allowed score: ${maxScore}.`}
          </DialogDescription>
        </DialogHeader>

        <form id="type-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Type Name */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-type-name">Type Name</Label>
            <Input
              id="ev-type-name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="e.g. Full Attendance"
              maxLength={255}
              disabled={isSubmitting}
            />
            {fieldErrors.type_name && (
              <p className="text-xs text-destructive">{fieldErrors.type_name}</p>
            )}
          </div>

          {/* Score Value */}
          <div className="space-y-1.5">
            <Label htmlFor="ev-score-value">Score Value</Label>
            <Input
              id="ev-score-value"
              type="number"
              min={0}
              max={maxScore}
              step={1}
              value={scoreValue}
              onChange={(e) => setScoreValue(e.target.value)}
              placeholder="e.g. 5"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Allowed range: 0 to {maxScore}
            </p>
            {fieldErrors.score_value && (
              <p className="text-xs text-destructive">
                {fieldErrors.score_value}
              </p>
            )}
          </div>

          {/* Server-level error */}
          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="type-form" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? "Save Changes" : "Create Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
