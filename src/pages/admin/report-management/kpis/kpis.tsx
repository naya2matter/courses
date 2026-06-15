// ─── Admin KPI Reporting Page ─────────────────────────────────────────────────

import { useState } from "react"
import {
  AlertCircleIcon,
  BarChart2Icon,
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { useKpi } from "./hook/use-kpi"
import { KpiOverviewCards } from "./components/kpi-overview-cards"
import { KpiTrendsChart } from "./components/kpi-trends-chart"
import { exportKpiOverviewCsv } from "./service/kpi.service"

const DEPARTMENTS = [
  { id: "1", name: "IT" },
  { id: "2", name: "HR" },
  { id: "3", name: "Finance" },
  { id: "4", name: "Ops" },
]

const EMPTY_FILTERS = { date_from: "", date_to: "", department_id: "", course_online_id: "" }

function countActiveFilters(obj: Record<string, unknown>): number {
  return Object.values(obj).filter((v) => v !== "" && v !== undefined && v !== null).length
}

export default function KpisPage() {
  const {
    overview, overviewLoading, overviewError,
    trends, trendsLoading, trendsError,
    filters, setFilters, refetch,
  } = useKpi()

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

  const anyLoading = overviewLoading || trendsLoading
  const anyError = overviewError ?? trendsError
  const activeCount = countActiveFilters(filters as Record<string, unknown>)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
          <BarChart2Icon className="size-5 text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">KPI Overview</h1>
          <p className="mt-0.5 text-sm text-white/40">
            High-level engagement metrics and daily learning trends.
          </p>
        </div>
      </div>

      {/* ── Unified filter + action bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
        <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
        <Separator orientation="vertical" className="h-4 bg-white/10" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">From</Label>
            <Input type="date" value={filters.date_from ?? ""}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]" />
          </div>
          <span className="mt-4 text-white/25 text-xs">—</span>
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">To</Label>
            <Input type="date" value={filters.date_to ?? ""}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]" />
          </div>
        </div>

        {/* Department */}
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-white/35">Department</Label>
          <Select value={String(filters.department_id ?? "")}
            onValueChange={(v) => setFilters({ ...filters, department_id: v === "all" ? "" : v })}>
            <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
              <SelectValue placeholder="All depts" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value="all">All departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {activeCount > 0 && (
            <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              {activeCount} active
            </Badge>
          )}
          <Button variant="ghost" size="sm"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="h-7 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/70">
            Clear
          </Button>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <Button variant="ghost" size="sm" onClick={refetch} disabled={anyLoading}
            className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white">
            <RefreshCwIcon className={`size-3 ${anyLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}
            className="h-7 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
            {exporting
              ? <Loader2Icon className="size-3 animate-spin" />
              : <DownloadIcon className="size-3" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* ── Error ── */}
      {anyError && (
        <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Failed to load KPI data</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{anyError}</span>
            <Button size="sm" variant="outline" onClick={refetch}
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10">
              <RefreshCwIcon className="mr-1.5 size-3.5" />Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Overview cards ── */}
      <KpiOverviewCards data={overview} isLoading={overviewLoading} />

      {/* ── Trends chart ── */}
      <KpiTrendsChart data={trends} isLoading={trendsLoading} error={trendsError} />
    </div>
  )
}
