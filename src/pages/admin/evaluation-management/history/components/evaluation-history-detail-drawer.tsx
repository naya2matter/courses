// ─── EvaluationHistoryDetailDrawer ───────────────────────────────────────────
// Sheet/drawer that shows a full evaluation history entry.
// Fetches fresh detail on open via GET /admin/evaluation-history/getById/{id}.
// Read-only — no create / edit / delete actions.

import { useEffect, useState } from "react"
import { Loader2Icon, AlertCircleIcon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { isApiError } from "@/lib/api"
import { getEvaluationHistoryById } from "../service/evaluation-history.service"
import { PerformanceLevelBadge } from "./performance-level-badge"
import type {
  EvaluationHistoryEntry,
} from "../types/evaluation-history.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h4>
  )
}

// ── Content ───────────────────────────────────────────────────────────────────

function DrawerContent({ entry }: { entry: EvaluationHistoryEntry }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-8 text-sm">
      {/* ── Overview ──────────────────────────────────────────────────────── */}
      <SectionHeading>Overview</SectionHeading>
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 divide-y divide-white/10">
        <InfoRow label="Employee" value={entry.user.name} />
        <InfoRow label="Department" value={entry.department.name} />
        <InfoRow label="Course" value={entry.course.name} />
        <InfoRow
          label="Course Type"
          value={
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium border-white/20 text-white/80">
              {entry.course_type}
            </span>
          }
        />
        <InfoRow label="Total Score" value={
          <span className="tabular-nums text-lg font-bold">{entry.total_score}</span>
        } />
        <InfoRow
          label="Performance"
          value={<PerformanceLevelBadge level={entry.performance_level} />}
        />
        <InfoRow label="Created" value={formatDateTime(entry.created_at)} />
        <InfoRow label="Updated" value={formatDateTime(entry.updated_at)} />
      </div>

      {/* ── Performance level detail ───────────────────────────────────────── */}
      <SectionHeading>Performance Level</SectionHeading>
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 divide-y divide-white/10">
        <InfoRow label="Label" value={entry.performance_level.label} />
        <InfoRow label="Level" value={entry.performance_level.level} />
        <InfoRow
          label="Score Range"
          value={`${entry.performance_level.range.min} – ${entry.performance_level.range.max}`}
        />
       
      </div>

      {/* ── Score snapshot ────────────────────────────────────────────────── */}
      <SectionHeading>
        Score Snapshot ({entry.history.length} item{entry.history.length !== 1 ? "s" : ""})
      </SectionHeading>

      {entry.history.length === 0 ? (
        <p className="text-xs text-muted-foreground">No snapshot rows.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs">Config</TableHead>
                <TableHead className="text-muted-foreground text-xs">Type</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs">Score</TableHead>
                <TableHead className="text-right text-muted-foreground text-xs">Max</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.history.map((row) => (
                <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-xs">{row.config_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.type_name}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs font-semibold">
                    {row.score_given}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                    {row.max_score}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Audit note ────────────────────────────────────────────────────── */}
      <Separator className="my-5 opacity-20" />
      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground leading-relaxed">
        This is a read-only audit snapshot. Deleted configs or types do not
        affect this record — config and type names are stored as plain strings
        at the time of evaluation.
      </p>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationHistoryDetailDrawerProps {
  entryId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Main component ────────────────────────────────────────────────────────────

export function EvaluationHistoryDetailDrawer({
  entryId,
  open,
  onOpenChange,
}: EvaluationHistoryDetailDrawerProps) {
  const [entry, setEntry] = useState<EvaluationHistoryEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || entryId === null) {
      setEntry(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setEntry(null)

    getEvaluationHistoryById(entryId)
      .then((res) => {
        if (!cancelled) setEntry(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof DOMException && err.name === "AbortError") return
        let msg = "Failed to load evaluation details."
        if (isApiError(err)) msg = err.message ?? msg
        else if (err instanceof Error) msg = err.message
        setError(msg)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, entryId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0 w-full sm:max-w-lg overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <SheetTitle>Evaluation Details</SheetTitle>
          <SheetDescription>
            Read-only audit snapshot for this evaluation record.
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-1 items-center justify-center gap-2 px-6 text-sm text-red-400">
            <AlertCircleIcon className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {!isLoading && !error && entry && <DrawerContent entry={entry} />}
      </SheetContent>
    </Sheet>
  )
}
