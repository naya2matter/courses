// ─── Config Version History ─────────────────────────────────────────────────────
// Every config version ever saved, newest first. Restoring clones an old version
// into a new active one — nothing is ever edited or deleted in place, so this
// table is the audit trail for "who changed the scoring, and when".

import { useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  HistoryIcon,
  Loader2Icon,
  RefreshCwIcon,
  RotateCcwIcon,
  UserIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { RestoreConfirmDialog } from "./restore-confirm-dialog"
import type { AttentionScoreConfigHistoryItem } from "../types/attention-score.types"

interface HistoryPanelProps {
  history: AttentionScoreConfigHistoryItem[]
  isLoading: boolean
  error: string | null
  /** Id of the version currently being restored, if any. */
  restoringId: number | null
  /** True while any save/restore is in flight — restore buttons stay disabled. */
  isBusy: boolean
  onRestore: (id: number) => Promise<void>
  onRetry: () => void
}

/** "3 days ago" — falls back to the raw string if the date won't parse. */
function relativeTime(iso: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const units: Array<[number, string]> = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [2592000, "month"],
    [31536000, "year"],
  ]
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, name] = units[i]
    if (seconds >= size) {
      const n = Math.floor(seconds / size)
      return `${n} ${name}${n === 1 ? "" : "s"} ago`
    }
  }
  return "just now"
}

function absoluteTime(iso: string | null): string {
  if (!iso) return "Unknown date"
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

export function HistoryPanel({
  history,
  isLoading,
  error,
  restoringId,
  isBusy,
  onRestore,
  onRetry,
}: HistoryPanelProps) {
  const [target, setTarget] = useState<AttentionScoreConfigHistoryItem | null>(null)

  // Keep the dialog open (and showing its spinner) until the request settles,
  // rather than closing optimistically on click.
  async function handleConfirm() {
    if (!target) return
    await onRestore(target.id)
    setTarget(null)
  }

  // ── Error ──
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
        <AlertCircleIcon className="size-4" />
        <AlertTitle>Couldn't load version history</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{error}</span>
          <Button
            size="sm" variant="outline" onClick={onRetry}
            className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // ── Loading ──
  if (isLoading && history.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/8 bg-card/40 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Empty ──
  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/12 px-6 py-14 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/5 text-white/25">
          <HistoryIcon className="size-5" />
        </span>
        <p className="text-sm font-medium text-white/70">No saved versions yet</p>
        <p className="max-w-sm text-xs leading-relaxed text-white/35">
          The first time you save changes on the Edit tab, that version is recorded here — along with
          who saved it and when — so you can always roll back.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/35">
          {history.length} {history.length === 1 ? "version" : "versions"}, newest first
        </p>
        <Button
          size="sm" variant="ghost" onClick={onRetry} disabled={isLoading}
          className="h-7 gap-1.5 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white"
        >
          <RefreshCwIcon className={cn("size-3", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {history.map((item) => {
          const isRestoringThis = restoringId === item.id

          return (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                item.is_active
                  ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                  : "border-white/8 bg-card/40 hover:border-white/14",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  item.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30",
                )}
              >
                {item.is_active ? <CheckCircle2Icon className="size-4" /> : <HistoryIcon className="size-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">{item.name}</p>
                  {item.is_active ? (
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/35">
                      Archived
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/35">
                  <span className="flex items-center gap-1">
                    <UserIcon className="size-3 text-white/20" />
                    {item.created_by ?? "Unknown"}
                  </span>
                  <span className="flex items-center gap-1" title={absoluteTime(item.created_at)}>
                    <ClockIcon className="size-3 text-white/20" />
                    {relativeTime(item.created_at)}
                  </span>
                </div>
              </div>

              {item.is_active ? (
                <span className="text-[11px] text-white/25">Currently in use</span>
              ) : (
                <Button
                  type="button" variant="outline" size="sm"
                  disabled={isBusy}
                  onClick={() => setTarget(item)}
                  className="h-8 shrink-0 gap-1.5 border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                >
                  {isRestoringThis ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCcwIcon className="size-3.5" />
                  )}
                  {isRestoringThis ? "Restoring…" : "Restore"}
                </Button>
              )}
            </div>
          )
        })}
      </div>

      <RestoreConfirmDialog
        target={target}
        onOpenChange={(open) => { if (!open) setTarget(null) }}
        isRestoring={restoringId !== null}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
