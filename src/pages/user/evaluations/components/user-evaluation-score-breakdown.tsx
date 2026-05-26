import { Progress } from "@/components/ui/progress"
import type { UserEvaluationHistoryRow } from "../types/user-evaluation.types"

interface UserEvaluationScoreBreakdownProps {
  rows: UserEvaluationHistoryRow[]
}

export function UserEvaluationScoreBreakdown({
  rows,
}: UserEvaluationScoreBreakdownProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted-foreground">
        No score breakdown rows were included for this evaluation.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const max = row.max_score > 0 ? row.max_score : 1
        const percent = Math.max(0, Math.min(100, (row.score_given / max) * 100))

        return (
          <div
            key={row.id}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.config_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.type_name}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {row.score_given}/{row.max_score}
              </p>
            </div>

            <Progress
              value={percent}
              className="h-2 bg-white/10"
              aria-label={`${row.config_name} score progress`}
            />
          </div>
        )
      })}
    </div>
  )
}
