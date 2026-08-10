// ─── Band Table Editor ──────────────────────────────────────────────────────────
// Editable grid for the attention-score band tables (time ratio, speed change,
// completion, skip ratio). Each row has an optional "min" column, a "max" column
// (blank = open-ended), and one value column (points or adjustment). A plain
// table, matching the rest of the admin UI — no per-row cards or decoration.

import { PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { NumberField } from "./number-field"
import type { ConfigIssue } from "../lib/validate-config"

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
  /** Config path this table lives at, e.g. `video.time_ratio_bands`. */
  basePath: string
  /** Validation issues keyed by config path. */
  issueByPath: Record<string, ConfigIssue>
  errorPaths: Set<string>
  /** Unit shown in the Min/Max column headers, e.g. "%". */
  unit?: string
  disabled?: boolean
}

export function BandTableEditor({
  rows,
  onChange,
  hasMin,
  valueField,
  valueLabel,
  basePath,
  issueByPath,
  errorPaths,
  unit = "",
  disabled,
}: BandTableEditorProps) {
  /** Splits a path's issue into the error/warning props NumberField expects. */
  function issueProps(path: string): { error?: string; warning?: string } {
    const issue = issueByPath[path]
    if (!issue) return {}
    return issue.severity === "error" ? { error: issue.message } : { warning: issue.message }
  }

  function updateRow(index: number, patch: Partial<BandRow>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    // Start the new band where the last one ended, so the common case (append a
    // contiguous band) needs no extra typing.
    const last = rows[rows.length - 1]
    const suggestedMin = last && Number.isFinite(last.max) ? (last.max as number) : 0
    const base: BandRow = hasMin ? { min: suggestedMin, max: null } : { max: null }
    onChange([...rows, { ...base, [valueField]: 0 }])
  }

  const unitSuffix = unit ? ` (${unit})` : ""

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/12 px-4 py-5 text-center text-xs text-white/40">
          No bands defined — every value scores nothing.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {hasMin && <TableHead className="w-32">Min{unitSuffix}</TableHead>}
              <TableHead className="w-32">Max{unitSuffix} <span className="text-white/25">(blank = ∞)</span></TableHead>
              <TableHead className="w-32">{valueLabel}</TableHead>
              <TableHead className="w-9" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const rowPath = `${basePath}[${index}]`
              const minIssue = issueProps(`${rowPath}.min`)
              const maxIssue = issueProps(`${rowPath}.max`)
              const valueIssue = issueProps(`${rowPath}.${valueField}`)
              const hasRowError =
                errorPaths.has(`${rowPath}.min`) ||
                errorPaths.has(`${rowPath}.max`) ||
                errorPaths.has(`${rowPath}.${valueField}`)

              return (
                // border-b-0 drops shadcn's default row divider, which reads as a
                // soft drop shadow under each row rather than a clean line here.
                <TableRow key={index} className={cn("border-b-0", hasRowError && "bg-red-500/[0.04]")}>
                  {hasMin && (
                    <TableCell className="align-top py-2">
                      <NumberField
                        ariaLabel={`Band ${index + 1} minimum`}
                        value={row.min ?? NaN}
                        {...minIssue}
                        disabled={disabled}
                        onChange={(n) => updateRow(index, { min: n })}
                      />
                    </TableCell>
                  )}
                  <TableCell className="align-top py-2">
                    <NumberField
                      ariaLabel={`Band ${index + 1} maximum`}
                      value={row.max ?? NaN}
                      {...maxIssue}
                      placeholder="∞"
                      disabled={disabled}
                      // Blank is meaningful here: it means "open-ended", not "missing".
                      onChange={(n) => updateRow(index, { max: Number.isFinite(n) ? n : null })}
                    />
                  </TableCell>
                  <TableCell className="align-top py-2">
                    <NumberField
                      ariaLabel={`Band ${index + 1} ${valueLabel.toLowerCase()}`}
                      value={row[valueField] ?? NaN}
                      {...valueIssue}
                      disabled={disabled}
                      onChange={(n) => updateRow(index, { [valueField]: n } as Partial<BandRow>)}
                    />
                  </TableCell>
                  <TableCell className="align-top py-2">
                    <Button
                      type="button" variant="ghost" size="icon" disabled={disabled}
                      aria-label={`Remove band ${index + 1}`}
                      onClick={() => removeRow(index)}
                      className="size-8 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Button
        type="button" variant="outline" size="sm" disabled={disabled} onClick={addRow}
        className="h-8 gap-1.5 border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
      >
        <PlusIcon className="size-3.5" /> Add band
      </Button>
    </div>
  )
}
