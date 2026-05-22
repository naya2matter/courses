// ─── EvaluationHistoryPagination ─────────────────────────────────────────────
// Pagination controls: previous / next, page indicator, per_page selector.

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { PaginationMeta } from "../types/evaluation-history.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationHistoryPaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationHistoryPagination({
  meta,
  onPageChange,
  onPerPageChange,
}: EvaluationHistoryPaginationProps) {
  const { current_page, last_page, per_page, total, from, to } = meta

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      {/* ── Result info ──────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground">
        {from != null && to != null ? (
          <>
            Showing {from.toLocaleString()}–{to.toLocaleString()} of{" "}
            {total.toLocaleString()} results
          </>
        ) : (
          <>
            Page {current_page} of {last_page} ({total.toLocaleString()} total)
          </>
        )}
      </p>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Per-page selector */}
        <Select
          value={String(per_page)}
          onValueChange={(v) => onPerPageChange(Number(v))}
        >
          <SelectTrigger className="w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 15, 25, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Prev button */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={current_page <= 1}
          onClick={() => onPageChange(current_page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        {/* Page indicator */}
        <span className="min-w-[5rem] text-center text-xs text-muted-foreground">
          {current_page} / {last_page}
        </span>

        {/* Next button */}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={current_page >= last_page}
          onClick={() => onPageChange(current_page + 1)}
          aria-label="Next page"
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
