// ─── Recalculation Progress Banner ─────────────────────────────────────────────
// Shown after saving/restoring a config while the background job rewrites every
// historical session's attention_score under the new numbers. Reports and
// dashboards are mid-change while this runs, which is worth saying out loud.

import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { AttentionScoreRecalculationJob } from "../types/attention-score.types"

interface RecalculationProgressProps {
  job: AttentionScoreRecalculationJob | null
  onDismiss: () => void
}

export function RecalculationProgress({ job, onDismiss }: RecalculationProgressProps) {
  if (!job) return null

  const total = Math.max(0, job.total_sessions ?? 0)
  const processed = Math.min(Math.max(0, job.processed_sessions ?? 0), total || Infinity)
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0

  // ── Done ──
  if (job.status === "done") {
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5">
        <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-300">Recalculation complete</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/45">
            {total.toLocaleString()} historical {total === 1 ? "session" : "sessions"} rescored with
            the new numbers. Reports and dashboards now reflect the updated values.
          </p>
        </div>
        <DismissButton onDismiss={onDismiss} />
      </div>
    )
  }

  // ── Failed ──
  if (job.status === "failed") {
    return (
      <div className="flex flex-wrap items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3.5">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-red-300">Recalculation failed</p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/45">
            {job.error_message ?? "An unexpected error occurred."}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/35">
            Your config was still saved and is active. Some sessions may hold scores from the
            previous version until a recalculation completes.
          </p>
        </div>
        <DismissButton onDismiss={onDismiss} />
      </div>
    )
  }

  // ── Queued / running ──
  const queued = job.status === "queued"

  return (
    <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06] px-4 py-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <Loader2Icon className="mt-0.5 size-4 shrink-0 animate-spin text-indigo-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-indigo-200">
            {queued ? "Recalculation queued" : "Recalculating historical sessions…"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-white/45">
            Every past session's attention score, plus all reports and dashboards, is being updated
            to match the new numbers. You can leave this page — the job keeps running.
          </p>
        </div>
        {total > 0 && (
          <span className="shrink-0 text-xs font-medium tabular-nums text-indigo-300">{percent}%</span>
        )}
      </div>

      {total > 0 && (
        <div className="mt-3 space-y-1.5">
          <Progress value={percent} className="h-1.5" />
          <p className="text-[11px] tabular-nums text-white/35">
            {processed.toLocaleString()} of {total.toLocaleString()} sessions
          </p>
        </div>
      )}
    </div>
  )
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Button
      type="button" variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss"
      className="size-7 shrink-0 text-white/30 hover:bg-white/5 hover:text-white/70"
    >
      <XIcon className="size-3.5" />
    </Button>
  )
}
