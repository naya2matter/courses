// ─── EvaluationRescoreDialog ──────────────────────────────────────────────────
// Dialog for updating scores on an existing evaluation.
// User, department, course are read-only; only scores[] are editable.

import { useState, useEffect } from "react"
import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { isApiError } from "@/lib/api"
import { getEvaluationById, updateEvaluation } from "../service/evaluation.service"
import { ScoreRowsEditor } from "./score-rows-editor"
import type { Evaluation, EvaluationScorePayload } from "../types/evaluation.types"
import type { EvaluationType } from "./score-rows-editor"

interface Props {
  evaluation: Evaluation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTypes: EvaluationType[]
  onSuccess: () => void
}

export function EvaluationRescoreDialog({
  evaluation,
  open,
  onOpenChange,
  availableTypes,
  onSuccess,
}: Props) {
  const [scores, setScores] = useState<EvaluationScorePayload[]>([])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load full detail to pre-populate scores
  useEffect(() => {
    if (!open || !evaluation) {
      setScores([])
      setApiError(null)
      return
    }
    setLoading(true)
    getEvaluationById(evaluation.id)
      .then((detail) => {
        setScores(
          (detail.scores ?? []).map((s) => ({
            evaluation_type_id: s.evaluation_type_id,
            score_given: s.score_given,
          })),
        )
      })
      .catch(() => {
        // Fallback to empty rows
        setScores([])
      })
      .finally(() => setLoading(false))
  }, [open, evaluation])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!evaluation) return
    setApiError(null)

    if (scores.length === 0 || scores.some((s) => !s.evaluation_type_id)) {
      setApiError("Please add at least one score row with a valid type.")
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvaluation(evaluation.id, { scores })
      toast.success("Evaluation updated successfully.")
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let msg = "Failed to update evaluation."
      if (isApiError(err)) {
        if (err.status === 422) {
          const data = err.data as { errors?: Record<string, string[]>; message?: string }
          const fieldErrors = data?.errors
          if (fieldErrors) {
            msg = Object.values(fieldErrors).flat().join(" ")
          } else {
            msg = data?.message ?? msg
          }
        } else {
          msg = err.message ?? msg
        }
      }
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-2xl border-l border-white/10 bg-[oklch(0.18_0.02_260)] text-white overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <SheetHeader className="mb-5">
          <SheetTitle className="text-white text-lg font-semibold">Re-score Evaluation</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Read-only user/course info */}
          {evaluation && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {evaluation.user?.name ?? `User #${evaluation.user_id}`}
                  </p>
                  {evaluation.user?.email && (
                    <p className="text-xs text-white/40">{evaluation.user.email}</p>
                  )}
                </div>
                <Badge variant="outline" className="border-white/10 text-white/60 capitalize">
                  {evaluation.course_type}
                </Badge>
              </div>
              <p className="text-sm text-white/50">
                {evaluation.department?.name && (
                  <span className="mr-2">{evaluation.department.name}</span>
                )}
                {evaluation.course?.name && (
                  <span>· {evaluation.course.name}</span>
                )}
              </p>
              <p className="text-xs text-white/30">
                Current score: <span className="text-white/60">{evaluation.total_score}</span>
              </p>
            </div>
          )}

          {/* Scores editor */}
          <div className="space-y-1.5">
            <Label>Scores</Label>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg bg-white/5" />
                ))}
              </div>
            ) : (
              <ScoreRowsEditor
                rows={scores}
                availableTypes={availableTypes}
                onChange={setScores}
                disabled={isSubmitting}
              />
            )}
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <SheetFooter className="mt-6 flex justify-end gap-2 px-0 pb-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-white/60 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Update Scores
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
