// ─── Recalculation Progress Banner ─────────────────────────────────────────────
// Shown after saving/restoring a config while the background job recalculates
// every historical session's attention_score under the new numbers.

import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { AttentionScoreRecalculationJob } from "../types/attention-score.types"

interface RecalculationProgressProps {
  job: AttentionScoreRecalculationJob | null
}

export function RecalculationProgress({ job }: RecalculationProgressProps) {
  if (!job) return null

  const percent = job.total_sessions > 0 ? Math.round((job.processed_sessions / job.total_sessions) * 100) : 0

  if (job.status === "done") {
    return (
      <Alert>
        <CheckCircle2Icon className="h-4 w-4 text-emerald-600" />
        <AlertTitle>Recalculation complete</AlertTitle>
        <AlertDescription>
          {job.total_sessions.toLocaleString()} historical sessions were recalculated with the new numbers.
          Reports and dashboards now reflect the updated scores.
        </AlertDescription>
      </Alert>
    )
  }

  if (job.status === "failed") {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Recalculation failed</AlertTitle>
        <AlertDescription>{job.error_message ?? "An unexpected error occurred."}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Loader2Icon className="h-4 w-4 animate-spin" />
      <AlertTitle>
        Recalculating historical sessions… {job.processed_sessions.toLocaleString()} / {job.total_sessions.toLocaleString()}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>This updates every past session's attention score, plus all reports and dashboards, to match the new numbers.</p>
        <Progress value={percent} />
      </AlertDescription>
    </Alert>
  )
}
