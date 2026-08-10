// ─── Live Preview Panel ─────────────────────────────────────────────────────────
// Runs the draft config against the 3 PDF worked examples so the client can see
// the effect of an edit before saving. Compares against each example's known
// baseline under the default config.

import { CheckCircle2Icon, Loader2Icon, PlayIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { PreviewExampleResult } from "../types/attention-score.types"

interface PreviewPanelProps {
  results: PreviewExampleResult[] | null
  isPreviewing: boolean
  onPreview: () => void
}

export function PreviewPanel({ results, isPreviewing, onPreview }: PreviewPanelProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Live Preview</h3>
          <p className="text-sm text-muted-foreground">
            Runs your edits against the 3 example learners from the client's spec.
          </p>
        </div>
        <Button type="button" onClick={onPreview} disabled={isPreviewing}>
          {isPreviewing ? (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PlayIcon className="mr-2 h-4 w-4" />
          )}
          Preview
        </Button>
      </div>

      {results && (
        <div className="grid gap-3 sm:grid-cols-3">
          {results.map((example) => {
            const changed = example.result.score !== example.expected
            return (
              <div key={example.label} className="rounded-md border p-3">
                <p className="text-sm font-medium">{example.label}</p>
                <p className="mt-1 text-2xl font-bold">{example.result.score}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  {changed ? (
                    <Badge variant="secondary">was {example.expected}</Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2Icon className="h-3.5 w-3.5" /> unchanged
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
