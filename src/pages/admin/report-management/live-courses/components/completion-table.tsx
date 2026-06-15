// ─── Course Completion Table ──────────────────────────────────────────────────

import { AlertCircleIcon, RefreshCwIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { CourseCompletion, PaginationMeta } from "../types/live-report.types"

function fmt(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

interface Props {
  data: CourseCompletion[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  page: number
  onPageChange: (p: number) => void
  onRetry: () => void
}

export function CompletionTable({ data, meta, isLoading, error, page, onPageChange, onRetry }: Props) {
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Failed to load completions</AlertTitle>
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
              <TableHead className="text-white/50">User</TableHead>
              <TableHead className="text-white/50">Department</TableHead>
              <TableHead className="text-white/50">Course</TableHead>
              <TableHead className="text-white/50">Registered</TableHead>
              <TableHead className="text-white/50">Completed</TableHead>
              <TableHead className="text-right text-white/50">Days</TableHead>
              <TableHead className="text-right text-white/50">Rating</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={`sk-${i}`} className="border-white/5">
                {Array.from({ length: 7 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full bg-white/5" /></TableCell>
                ))}
              </TableRow>
            ))}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-white/35">
                  No completions found.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data.length > 0 && data.map((r, idx) => (
              <TableRow key={r.id ?? idx} className="border-white/5 hover:bg-white/3">
                <TableCell>
                  <div className="font-medium text-white">{r.user_name}</div>
                  {r.user_email && <div className="text-xs text-white/40">{r.user_email}</div>}
                </TableCell>
                <TableCell className="text-white/70">{r.department_name ?? "—"}</TableCell>
                <TableCell className="text-white/70">{r.course_name}</TableCell>
                <TableCell className="text-white/60 text-sm">{fmt(r.registered_at)}</TableCell>
                <TableCell className="text-white/60 text-sm">{fmt(r.completed_at)}</TableCell>
                <TableCell className="text-right">
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                    {r.days_to_complete}d
                  </span>
                </TableCell>
                <TableCell className="text-right text-white/70">
                  {r.rating != null ? `${r.rating}/5` : "—"}
                </TableCell>
              </TableRow>
            ))}
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
