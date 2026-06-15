// ─── Admin Reporting Refresh Operations ───────────────────────────────────────

import { useState } from "react"
import {
  AlertCircleIcon,
  CalendarRangeIcon,
  CheckCircle2Icon,
  DatabaseIcon,
  Loader2Icon,
  RefreshCwIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

import {
  triggerDailyRefresh,
  triggerRangeRefresh,
  triggerFullRefresh,
} from "./service/refresh.service"
import { useRefreshLog } from "./hook/use-refresh-log"
import type { RefreshStatus } from "./types/refresh.types"

// ── Status badge config ───────────────────────────────────────────────────────

const STATUS_CFG: Record<RefreshStatus, string> = {
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  running:   "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
  pending:   "bg-amber-500/15 text-amber-400 border-amber-500/25",
  failed:    "bg-red-500/15 text-red-400 border-red-500/25",
}

function fmtTable(name: string): string {
  return name.replace(/^reporting_/, "").replace(/_/g, " ")
}

function fmtTs(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RefreshOperationsPage() {
  const log = useRefreshLog()

  // Daily refresh
  const [dailyLoading, setDailyLoading] = useState(false)

  // Range refresh
  const [rangeFrom, setRangeFrom] = useState("")
  const [rangeTo, setRangeTo] = useState("")
  const [rangeLoading, setRangeLoading] = useState(false)

  // Full refresh
  const [fullConfirm, setFullConfirm] = useState(false)
  const [fullLoading, setFullLoading] = useState(false)

  async function handleDaily() {
    setDailyLoading(true)
    try {
      const res = await triggerDailyRefresh()
      toast.success(res.message ?? "Daily refresh triggered.")
      log.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Daily refresh failed.")
    } finally {
      setDailyLoading(false)
    }
  }

  async function handleRange() {
    if (!rangeFrom || !rangeTo) {
      toast.error("Select both From and To dates.")
      return
    }
    setRangeLoading(true)
    try {
      const res = await triggerRangeRefresh(rangeFrom, rangeTo)
      toast.success(res.message ?? "Range refresh triggered.")
      log.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Range refresh failed.")
    } finally {
      setRangeLoading(false)
    }
  }

  async function handleFull() {
    if (!fullConfirm) {
      setFullConfirm(true)
      return
    }
    setFullLoading(true)
    setFullConfirm(false)
    try {
      const res = await triggerFullRefresh()
      toast.success(res.message ?? "Full refresh triggered.")
      log.refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Full refresh failed.")
    } finally {
      setFullLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Refresh Operations</h1>
        <p className="mt-1 text-sm text-white/45">
          Manually trigger reporting data refreshes and view the operation history.
        </p>
      </div>

      {/* ── Action cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* Daily */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/15">
              <RefreshCwIcon className="size-4 text-sky-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Daily Refresh</p>
              <p className="mt-0.5 text-xs text-white/45">
                Aggregates yesterday's data into reporting tables.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDaily}
            disabled={dailyLoading}
            className="mt-auto w-full bg-sky-600 text-white hover:bg-sky-500"
          >
            {dailyLoading
              ? <><Loader2Icon className="mr-2 size-4 animate-spin" />Running…</>
              : <><RefreshCwIcon className="mr-2 size-4" />Run Daily Refresh</>}
          </Button>
        </div>

        {/* Range */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
              <CalendarRangeIcon className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Range Refresh</p>
              <p className="mt-0.5 text-xs text-white/45">
                Re-aggregate data for a specific date range.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs text-white/50">From</Label>
              <Input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="h-9 border-white/10 bg-white/5 text-sm text-white [color-scheme:dark]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <Label className="text-xs text-white/50">To</Label>
              <Input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="h-9 border-white/10 bg-white/5 text-sm text-white [color-scheme:dark]"
              />
            </div>
          </div>
          <Button
            onClick={handleRange}
            disabled={rangeLoading}
            className="mt-auto w-full bg-violet-600 text-white hover:bg-violet-500"
          >
            {rangeLoading
              ? <><Loader2Icon className="mr-2 size-4 animate-spin" />Running…</>
              : <><CalendarRangeIcon className="mr-2 size-4" />Run Range Refresh</>}
          </Button>
        </div>

        {/* Full */}
        <div className="flex flex-col gap-4 rounded-2xl border border-orange-500/20 bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
              <DatabaseIcon className="size-4 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Full Refresh</p>
              <p className="mt-0.5 text-xs text-white/45">
                Rebuilds all reporting data from scratch. This can take several minutes.
              </p>
            </div>
          </div>

          {fullConfirm && (
            <Alert className="border-orange-500/30 bg-orange-500/10 py-2.5">
              <TriangleAlertIcon className="size-4 text-orange-400" />
              <AlertDescription className="text-xs text-orange-300">
                This will rebuild <strong>all</strong> reporting tables and may take several minutes. Click again to confirm.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-auto flex gap-2">
            {fullConfirm && (
              <Button
                variant="outline" size="sm"
                onClick={() => setFullConfirm(false)}
                className="flex-1 border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={handleFull}
              disabled={fullLoading}
              className={`flex-1 ${fullConfirm ? "bg-orange-600 hover:bg-orange-500" : "bg-orange-700 hover:bg-orange-600"} text-white`}
            >
              {fullLoading
                ? <><Loader2Icon className="mr-2 size-4 animate-spin" />Running…</>
                : fullConfirm
                  ? <><CheckCircle2Icon className="mr-2 size-4" />Confirm Full Refresh</>
                  : <><DatabaseIcon className="mr-2 size-4" />Run Full Refresh</>}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Refresh Log ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Refresh History</h2>
            <p className="text-xs text-white/40">Last 50 entries across all reporting tables</p>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={log.refetch}
            disabled={log.isLoading}
            className="border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <RefreshCwIcon className={`mr-1.5 size-3.5 ${log.isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {log.error && (
          <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>Failed to load log</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>{log.error}</span>
              <Button size="sm" variant="outline" onClick={log.refetch} className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10">
                <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!log.error && (
          <div className="overflow-hidden rounded-xl border border-white/8">
            <Table>
              <TableHeader>
                <TableRow className="border-white/8 hover:bg-transparent">
                  <TableHead className="text-white/50">Table</TableHead>
                  <TableHead className="text-white/50">Report Date</TableHead>
                  <TableHead className="text-white/50">Status</TableHead>
                  <TableHead className="text-white/50">Refreshed At</TableHead>
                  <TableHead className="text-right text-white/50">Rows Written</TableHead>
                  <TableHead className="text-right text-white/50">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {log.isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-white/5">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full bg-white/5" /></TableCell>
                    ))}
                  </TableRow>
                ))}
                {!log.isLoading && log.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-white/35">
                      No refresh operations found. Run a refresh above to populate this log.
                    </TableCell>
                  </TableRow>
                )}
                {!log.isLoading && log.data.length > 0 && log.data.map((entry) => (
                  <TableRow key={entry.id} className="border-white/5 hover:bg-white/3">
                    <TableCell>
                      <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-white/70">
                        {fmtTable(entry.report_table)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-white/60">{entry.report_date ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${STATUS_CFG[entry.status] ?? ""}`}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white/60">{fmtTs(entry.refreshed_at)}</TableCell>
                    <TableCell className="text-right text-sm text-white/70">
                      {entry.rows_written != null ? entry.rows_written.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-white/70">
                      {entry.duration_seconds != null ? `${entry.duration_seconds}s` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!log.error && !log.isLoading && log.data.length > 0 && (
          <p className="text-xs text-white/30 text-right">
            Showing {log.data.length} most recent entries
          </p>
        )}
      </div>
    </div>
  )
}
