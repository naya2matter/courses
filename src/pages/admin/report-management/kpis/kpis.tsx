// ─── Admin KPI Reporting Page ─────────────────────────────────────────────────

import { useState } from "react"
import {
  AlertCircleIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { useKpi } from "./hook/use-kpi"
import { KpiOverviewCards } from "./components/kpi-overview-cards"
import { KpiTrendsChart } from "./components/kpi-trends-chart"
import { exportKpiOverviewCsv } from "./service/kpi.service"

const EMPTY_FILTERS = { date_from: "", date_to: "", department_id: "" }

function countActiveFilters(obj: Record<string, unknown>): number {
  return Object.values(obj).filter((v) => v !== "" && v !== undefined && v !== null).length
}

export default function KpisPage() {
  const { overview, isLoading, error, filters, setFilters, refetch } = useKpi()
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await exportKpiOverviewCsv(filters)
      toast.success("KPI overview downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExporting(false)
    }
  }

  const activeCount = countActiveFilters(filters as Record<string, unknown>)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">KPI Overview</h1>
        <p className="mt-0.5 text-sm text-white/40">
          High-level engagement metrics and learning analytics.
        </p>
      </div>

      {/* ── Filter + action bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
        <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
        <Separator orientation="vertical" className="h-4 bg-white/10" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">From</Label>
            <Input
              type="date"
              value={filters.date_from ?? ""}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]"
            />
          </div>
          <span className="mt-4 text-white/25 text-xs">—</span>
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">To</Label>
            <Input
              type="date"
              value={filters.date_to ?? ""}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {activeCount > 0 && (
            <Badge
              variant="outline"
              className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
            >
              {activeCount} active
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="h-7 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
          >
            Clear
          </Button>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
          >
            <RefreshCwIcon className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="h-7 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            {exporting
              ? <Loader2Icon className="size-3 animate-spin" />
              : <DownloadIcon className="size-3" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load KPI data</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={refetch}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Overview cards ── */}
      <KpiOverviewCards data={overview} isLoading={isLoading} />

      {/* ── Charts ── */}
      <KpiTrendsChart data={overview} isLoading={isLoading} error={error} />
    </div>
  )
}
