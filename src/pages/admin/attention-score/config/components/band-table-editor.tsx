// ─── Band Table Editor ──────────────────────────────────────────────────────────
// Generic editable grid for the attention-score band tables (time ratio, speed
// change, completion, skip ratio). Each row has an optional "min" column, a
// "max" column (empty = open-ended / null), and one value column (points or
// adjustment). Rows are added/removed inline; validation is caller's job.

import { PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface BandRow {
  min?: number
  max: number | null
  points?: number
  adjustment?: number
}

interface BandTableEditorProps {
  rows: BandRow[]
  onChange: (rows: BandRow[]) => void
  hasMin: boolean
  valueField: "points" | "adjustment"
  valueLabel: string
  disabled?: boolean
}

export function BandTableEditor({ rows, onChange, hasMin, valueField, valueLabel, disabled }: BandTableEditorProps) {
  function updateRow(index: number, patch: Partial<BandRow>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    const base: BandRow = hasMin ? { min: 0, max: null } : { max: null }
    onChange([...rows, { ...base, [valueField]: 0 }])
  }

  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            {hasMin && <TableHead className="w-28">Min</TableHead>}
            <TableHead className="w-28">Max (blank = ∞)</TableHead>
            <TableHead className="w-32">{valueLabel}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              {hasMin && (
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    value={row.min ?? 0}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { min: Number(e.target.value) })}
                    className="h-9"
                  />
                </TableCell>
              )}
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  placeholder="∞"
                  value={row.max ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    updateRow(index, { max: e.target.value === "" ? null : Number(e.target.value) })
                  }
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  value={row[valueField] ?? 0}
                  disabled={disabled}
                  onChange={(e) => updateRow(index, { [valueField]: Number(e.target.value) } as Partial<BandRow>)}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => removeRow(index)}
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}>
        <PlusIcon className="mr-2 h-4 w-4" /> Add row
      </Button>
    </div>
  )
}
