// ─── ScoreRowsEditor ─────────────────────────────────────────────────────────
// Reusable dynamic score rows editor. Used in both Create and Re-score dialogs.
// Requires a list of available evaluation types to choose from.

import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { EvaluationScorePayload } from "../types/evaluation.types"

export interface EvaluationType {
  id: number
  type_name: string
  score_value: number
  config_id: number
  config_name?: string
}

interface Props {
  rows: EvaluationScorePayload[]
  availableTypes: EvaluationType[]
  onChange: (rows: EvaluationScorePayload[]) => void
  disabled?: boolean
}

export function ScoreRowsEditor({ rows, availableTypes, onChange, disabled }: Props) {
  function addRow() {
    onChange([...rows, { evaluation_type_id: 0, score_given: 0 }])
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, patch: Partial<EvaluationScorePayload>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const estimatedTotal = rows.reduce((acc, r) => acc + (r.score_given || 0), 0)

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 && (
        <p className="text-sm text-white/40">No score rows yet. Click &quot;Add Row&quot; to begin.</p>
      )}

      {rows.map((row, i) => {
        const selectedType = availableTypes.find((t) => t.id === row.evaluation_type_id)
        return (
          <div key={i} className="flex items-center gap-2">
            {/* Type selector */}
            <Select
              value={row.evaluation_type_id ? String(row.evaluation_type_id) : "__none__"}
              onValueChange={(v) =>
                updateRow(i, {
                  evaluation_type_id: v === "__none__" ? 0 : Number(v),
                  score_given: 0,
                })
              }
              disabled={disabled}
            >
              <SelectTrigger className="flex-1 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Select type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select type —</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.config_name ? `${t.config_name} / ${t.type_name}` : t.type_name}{" "}
                    <span className="text-white/40">(max {t.score_value})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Score input */}
            <Input
              type="number"
              min={0}
              max={selectedType?.score_value}
              value={row.score_given}
              onChange={(e) => {
                const val = Number(e.target.value)
                const max = selectedType?.score_value ?? Infinity
                updateRow(i, { score_given: Math.min(val, max) })
              }}
              disabled={disabled || !row.evaluation_type_id}
              className="w-24 border-white/10 bg-white/5 text-white"
              placeholder="Score"
            />

            {/* Max label */}
            {selectedType && (
              <span className="w-14 text-xs text-white/40">/ {selectedType.score_value}</span>
            )}

            {/* Remove */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeRow(i)}
              disabled={disabled}
              className="text-white/40 hover:text-red-400"
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        )
      })}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
          className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
          Add Row
        </Button>

        {rows.length > 0 && (
          <p className="text-sm text-white/50">
            Estimated total:{" "}
            <span className="font-semibold text-white">{estimatedTotal}</span>
            <span className="ml-1 text-xs text-white/30">— server recalculates final score</span>
          </p>
        )}
      </div>
    </div>
  )
}
