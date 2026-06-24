// ─── EvaluationRescoreDialog ──────────────────────────────────────────────────
// Slide-in sheet for updating scores on an existing evaluation.

import { useState, useEffect, useRef } from "react"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import type { Evaluation, EvaluationHistory, EvaluationScorePayload } from "../types/evaluation.types"
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

  // Raw history cached so we can re-map without a second API call when
  // availableTypes finishes loading after the dialog has already opened.
  const pendingHistoryRef = useRef<EvaluationHistory[]>([])

  function mapHistoryToScores(history: EvaluationHistory[], types: typeof availableTypes) {
    return history.flatMap<EvaluationScorePayload>((h) => {
      const match = types.find(
        (t) => t.type_name === h.type_name && (!h.config_name || t.config_name === h.config_name),
      )
      return match ? [{ evaluation_type_id: match.id, score_given: h.score_given }] : []
    })
  }

  // Fetch evaluation detail when the dialog opens
  useEffect(() => {
    if (!open || !evaluation) {
      setScores([])
      setApiError(null)
      pendingHistoryRef.current = []
      return
    }
    setLoading(true)
    getEvaluationById(evaluation.id)
      .then((detail) => {
        // Prefer `scores` if the API returns evaluation_type_id directly
        if (detail.scores?.length && detail.scores[0].evaluation_type_id) {
          setScores(
            detail.scores.map((s) => ({
              evaluation_type_id: s.evaluation_type_id,
              score_given: s.score_given,
            })),
          )
          pendingHistoryRef.current = []
          return
        }

        // API returns `history` — map using availableTypes
        const history = detail.history ?? []
        pendingHistoryRef.current = history
        const rows = mapHistoryToScores(history, availableTypes)
        // rows may be [] if availableTypes hasn't loaded yet;
        // the effect below will re-map once types arrive
        setScores(rows)
      })
      .catch(() => {
        setScores([])
        pendingHistoryRef.current = []
      })
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, evaluation])

  // Re-map when availableTypes arrive after the dialog has already loaded detail
  useEffect(() => {
    if (availableTypes.length > 0 && pendingHistoryRef.current.length > 0) {
      const rows = mapHistoryToScores(pendingHistoryRef.current, availableTypes)
      if (rows.length > 0) {
        setScores(rows)
        pendingHistoryRef.current = [] // mapped — no need to re-run
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTypes])

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
          msg = fieldErrors
            ? Object.values(fieldErrors).flat().join(" ")
            : (data?.message ?? msg)
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
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        {/* Header */}
        <SheetHeader className="shrink-0 border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <RefreshCwIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold">Re-score Evaluation</SheetTitle>
              <SheetDescription className="text-xs">
                Update scores for this evaluation record.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <form id="rescore-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Read-only context card */}
            {evaluation && (
              <div className="rounded-xl border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {evaluation.user?.name ?? `User #${evaluation.user_id}`}
                    </p>
                    {evaluation.user?.email && (
                      <p className="truncate text-xs text-muted-foreground">{evaluation.user.email}</p>
                    )}
                  </div>
                  <Badge variant="secondary" className="capitalize shrink-0 text-xs">
                    {evaluation.course_type}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  {evaluation.department?.name && <span>{evaluation.department.name}</span>}
                  {evaluation.course?.name && <span>· {evaluation.course.name}</span>}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs text-muted-foreground">Current total score</span>
                  <span className="text-sm font-semibold tabular-nums">{evaluation.total_score ?? "—"}</span>
                </div>
              </div>
            )}

            {/* Scores editor */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Scores</Label>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
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
          </form>
        </div>

        {/* Footer */}
        <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button form="rescore-form" type="submit" disabled={isSubmitting || loading}>
            {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Update Scores
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
