// ─── EvaluationHistoryDetailDrawer ───────────────────────────────────────────
// Sheet/drawer that shows a full evaluation history entry.
// Fetches fresh detail on open via GET /admin/evaluation-history/getById/{id}.
// Read-only — no create / edit / delete actions.

import { useEffect, useState } from "react"
import {
  Loader2Icon,
  AlertCircleIcon,
  UserIcon,
  BuildingIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import { isApiError } from "@/lib/api"
import { getEvaluationHistoryById } from "../service/evaluation-history.service"
import { PerformanceLevelBadge } from "./performance-level-badge"
import type { EvaluationHistoryEntry } from "../types/evaluation-history.types"

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

function ScoreBar({ score, max }: { score: number; max: number }) {
  if (!max || max <= 0) return null
  const pct = Math.min(100, Math.round((score / max) * 100))
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500"
  return (
    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Content ───────────────────────────────────────────────────────────────────

function DrawerContent({ entry }: { entry: EvaluationHistoryEntry }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-5 space-y-5">
      {/* ── User card ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30">
            <UserIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold text-white">{entry.user.name}</p>
              <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-xs capitalize text-white/70">
                {entry.course_type}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-xs text-white/50">
              <p className="flex items-center gap-1.5">
                <BuildingIcon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                {entry.department.name}
              </p>
              <p className="flex items-center gap-1.5">
                <BookOpenIcon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                {entry.course.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Score hero ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="mb-1 text-xs text-white/40">Total Score</p>
          <p className="text-4xl font-extrabold tabular-nums text-white">{entry.total_score}</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/40">Performance</p>
          <PerformanceLevelBadge level={entry.performance_level} />
          <p className="text-[11px] text-white/40">
            Range {entry.performance_level.range.min}–{entry.performance_level.range.max}
            {" · "}Level {entry.performance_level.level}
          </p>
        </div>
      </div>

      {/* ── Score snapshot ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
          Score Snapshot
          <span className="ml-1.5 text-white/25">
            ({entry.history.length} item{entry.history.length !== 1 ? "s" : ""})
          </span>
        </p>

        {entry.history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/40">
            No snapshot rows.
          </p>
        ) : (
          <div className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {entry.history.map((row) => (
              <div key={row.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/30">
                      {row.config_name}
                    </p>
                    <p className="truncate text-sm text-white">{row.type_name}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-white">
                    {row.score_given}
                    <span className="font-normal text-white/40"> / {row.max_score}</span>
                  </p>
                </div>
                <ScoreBar score={row.score_given} max={row.max_score} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Meta dates ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/30">
            <CalendarIcon className="h-3 w-3" />
            Created
          </div>
          <p className="text-xs text-white/60">{formatDateTime(entry.created_at)}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/30">
            <ClockIcon className="h-3 w-3" />
            Updated
          </div>
          <p className="text-xs text-white/60">{formatDateTime(entry.updated_at)}</p>
        </div>
      </div>

      {/* ── Audit note ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/50">
        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
        <p>
          This is a read-only audit snapshot. Deleted configs or types do not affect
          this record — config and type names are stored as plain strings at the time
          of evaluation.
        </p>
      </div>
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
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden border-l border-white/10 bg-[oklch(0.18_0.02_260)] p-0 text-white sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-white/10 px-6 py-5">
          <SheetTitle className="text-white">Evaluation Details</SheetTitle>
          <SheetDescription className="text-white/40">
            Read-only audit snapshot for this evaluation record.
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="flex flex-1 items-center justify-center gap-2 text-white/50">
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
