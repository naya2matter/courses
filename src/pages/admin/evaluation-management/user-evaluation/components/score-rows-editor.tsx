// ─── ScoreRowsEditor ─────────────────────────────────────────────────────────
// Reusable dynamic score rows editor. Used in both Create and Re-score dialogs.
// Requires a list of available evaluation types to choose from.

import { useMemo, useState } from "react"
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
  // Distinct evaluation configs derived from the available types.
  const configs = useMemo(() => {
    const map = new Map<number, string>()
    for (const t of availableTypes) {
      if (!map.has(t.config_id)) map.set(t.config_id, t.config_name ?? `Config ${t.config_id}`)
    }
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [availableTypes])

  // Per-row selected config (UI-local). Falls back to the config of the row's
  // currently-selected type (so existing rows resolve correctly on edit).
  const [configByRow, setConfigByRow] = useState<Record<number, number>>({})

  function configForRow(index: number, row: EvaluationScorePayload): number {
    if (configByRow[index]) return configByRow[index]
    const t = availableTypes.find((t) => t.id === row.evaluation_type_id)
    return t?.config_id ?? 0
  }

  function addRow() {
    onChange([...rows, { evaluation_type_id: 0, score_given: 0 }])
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
    setConfigByRow((prev) => {
      const next: Record<number, number> = {}
      // Re-index the map since rows shift down after a removal.
      Object.entries(prev).forEach(([k, v]) => {
        const idx = Number(k)
        if (idx < index) next[idx] = v
        else if (idx > index) next[idx - 1] = v
      })
      return next
    })
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
        const selectedConfigId = configForRow(i, row)
        const typesForConfig = availableTypes.filter((t) => t.config_id === selectedConfigId)
        return (
          <div key={i} className="flex items-center gap-2">
            {/* Evaluation Config selector */}
            <Select
              value={selectedConfigId ? String(selectedConfigId) : "__none__"}
              onValueChange={(v) => {
                const configId = v === "__none__" ? 0 : Number(v)
                setConfigByRow((prev) => ({ ...prev, [i]: configId }))
                // Reset type + score when the config changes.
                updateRow(i, { evaluation_type_id: 0, score_given: 0 })
              }}
              disabled={disabled}
            >
              <SelectTrigger className="flex-1 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Evaluation Config…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select config —</SelectItem>
                {configs.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Config type selector */}
            <Select
              value={row.evaluation_type_id ? String(row.evaluation_type_id) : "__none__"}
              onValueChange={(v) => {
                if (v === "__none__") {
                  updateRow(i, { evaluation_type_id: 0, score_given: 0 })
                  return
                }
                const t = availableTypes.find((t) => t.id === Number(v))
                updateRow(i, {
                  evaluation_type_id: Number(v),
                  // Default the score to the type's max score.
                  score_given: t?.score_value ?? 0,
                })
              }}
              disabled={disabled || !selectedConfigId}
            >
              <SelectTrigger className="flex-1 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Config type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select type —</SelectItem>
                {typesForConfig.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.type_name} <span className="text-white/40">(max {t.score_value})</span>
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
