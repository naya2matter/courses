// ─── Live Preview Panel ─────────────────────────────────────────────────────────
// Runs the draft config against the worked examples from the spec so the effect
// of an edit is visible before saving — saving triggers a full recalculation, so
// finding out afterwards is expensive.

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  Loader2Icon,
  MinusIcon,
  PlayIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PreviewExampleResult } from "../types/attention-score.types"

interface PreviewPanelProps {
  results: PreviewExampleResult[] | null
  isPreviewing: boolean
  error: string | null
  /** False when the draft fails validation — previewing invalid numbers just 422s. */
  canPreview: boolean
  onPreview: () => void
}

export function PreviewPanel({ results, isPreviewing, error, canPreview, onPreview }: PreviewPanelProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-card/40">
      {/* Plain div — see the note in section-card.tsx about the global `header` rule. */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <FlaskConicalIcon className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Preview</h3>
            <p className="mt-1 text-xs leading-relaxed text-white/40">
              Scores the example learners from the spec using your unsaved numbers. Nothing is
              written and no recalculation runs.
            </p>
          </div>
        </div>

        <Button
          type="button" size="sm" onClick={onPreview} disabled={isPreviewing || !canPreview}
          title={canPreview ? undefined : "Fix the highlighted errors before previewing"}
          className="h-8 shrink-0 gap-1.5 bg-indigo-600 text-xs text-white hover:bg-indigo-500"
        >
          {isPreviewing ? <Loader2Icon className="size-3.5 animate-spin" /> : <PlayIcon className="size-3.5" />}
          {isPreviewing ? "Running…" : "Run preview"}
        </Button>
      </div>

      <div className="p-5">
        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.07] px-3 py-2.5 text-xs leading-relaxed text-red-400">
            <AlertCircleIcon className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : isPreviewing ? (
          <p className="flex items-center gap-2 py-4 text-xs text-white/40">
            <Loader2Icon className="size-3.5 animate-spin" /> Scoring the example learners…
          </p>
        ) : !results ? (
          <p className="py-4 text-center text-xs text-white/30">
            Run a preview to see how your changes move each example learner's score.
          </p>
        ) : results.length === 0 ? (
          <p className="py-4 text-center text-xs text-white/30">
            The server returned no examples to score against.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((example) => (
              <ExampleCard key={example.label} example={example} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ExampleCard({ example }: { example: PreviewExampleResult }) {
  const score = example.result?.score
  const hasScore = Number.isFinite(score)
  const delta = hasScore ? (score as number) - example.expected : 0
  const breakdown = Object.entries(example.result?.breakdown ?? {})

  const Trend = delta > 0 ? TrendingUpIcon : delta < 0 ? TrendingDownIcon : MinusIcon
  const trendCls =
    delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-white/35"

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
      <p className="truncate text-xs font-medium text-white/60" title={example.label}>
        {example.label}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-white">
          {hasScore ? score : "—"}
        </span>
        {hasScore && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium tabular-nums", trendCls)}>
            <Trend className="size-3" />
            {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${round(delta)}`}
          </span>
        )}
      </div>

      <p className="mt-1 flex items-center gap-1 text-[11px] text-white/30">
        {delta === 0 && hasScore ? (
          <>
            <CheckCircle2Icon className="size-3 text-emerald-500/70" />
            matches the {example.expected} baseline
          </>
        ) : (
          <>baseline {example.expected}</>
        )}
      </p>

      {breakdown.length > 0 && (
        <dl className="mt-3 space-y-1 border-t border-white/8 pt-3">
          {breakdown.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-2 text-[11px]">
              <dt className="truncate capitalize text-white/35">{key.replace(/_/g, " ")}</dt>
              <dd className="shrink-0 tabular-nums text-white/60">{round(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

function round(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}
