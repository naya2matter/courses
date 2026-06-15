// ─── Shared Table Shell ───────────────────────────────────────────────────────
// Reusable error + pagination wrapper used by all online-report tables.

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { PaginationMeta } from "../types/online-report.types"

interface ColDef {
  header: string
  align?: "left" | "right"
}

interface Props {
  cols: ColDef[]
  rows: React.ReactNode[]
  isLoading: boolean
  error: string | null
  meta: PaginationMeta | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
  emptyText?: string
}

export function ReportTableShell({
  cols, rows, isLoading, error, meta, page, onPageChange, onRetry, emptyText = "No data found.",
}: Props) {
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Failed to load data</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{error}</span>
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-white/8">
        <Table>
          <TableHeader>
            <TableRow className="border-white/8 hover:bg-transparent">
              {cols.map((c) => (
                <TableHead key={c.header} className={`text-white/50 ${c.align === "right" ? "text-right" : ""}`}>
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="border-white/5">
                {cols.map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full bg-white/5" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={cols.length} className="py-12 text-center text-sm text-white/35">
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length > 0 && rows}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>{meta.total} total · page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => onPageChange(page + 1)} className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10">Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
