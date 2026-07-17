// ─── Admin KPI Reporting Page ─────────────────────────────────────────────────

import { useRef, useState } from "react"
import html2canvas from "html2canvas-pro"
import {
  AlertCircleIcon,
  CameraIcon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePickerField } from "@/components/ui/date-picker"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3Icon, CalendarRangeIcon, GitCompareArrowsIcon } from "lucide-react"

import { useKpi } from "./hook/use-kpi"
import { useMonthlyKpi, DEFAULT_MONTHLY_FILTERS } from "./hook/use-monthly-kpi"
import { KpiOverviewCards } from "./components/kpi-overview-cards"
import { KpiTrendsChart } from "./components/kpi-trends-chart"
import { MonthlyFilterBar } from "./components/monthly-filter-bar"
import { MonthlyKpiPanel } from "./components/monthly-kpi-panel"
import { MonthlyComparisonPanel } from "./components/monthly-comparison-panel"
import { exportKpiOverviewCsv } from "./service/kpi.service"

const TABS = [
  { value: "overview", label: "Overview", icon: BarChart3Icon },
  { value: "monthly", label: "Monthly", icon: CalendarRangeIcon },
  { value: "comparison", label: "Comparison", icon: GitCompareArrowsIcon },
] as const

const EMPTY_FILTERS = { date_from: "", date_to: "", department_id: "" }

function countActiveFilters(obj: Record<string, unknown>): number {
  return Object.values(obj).filter((v) => v !== "" && v !== undefined && v !== null).length
}

async function captureTab(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
  const el = ref.current
  if (!el) return
  const canvas = await html2canvas(el, { backgroundColor: "#0a0a12", scale: 2, useCORS: true })
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, "image/png")
}

export default function KpisPage() {
  const { overview, isLoading, error, filters, setFilters, refetch } = useKpi()
  const monthly = useMonthlyKpi()
  const [exporting, setExporting] = useState(false)
  const [screenshotting, setScreenshotting] = useState(false)
  const overviewRef = useRef<HTMLDivElement>(null)
  const monthlyRef = useRef<HTMLDivElement>(null)

  async function handleScreenshot(ref: React.RefObject<HTMLDivElement | null>, name: string) {
    setScreenshotting(true)
    try {
      await captureTab(ref, `kpi-${name}-${new Date().toISOString().slice(0, 10)}.png`)
      toast.success("Screenshot downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Screenshot failed.")
    } finally {
      setScreenshotting(false)
    }
  }

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

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-auto w-max gap-0 rounded-none border-b border-white/10 bg-transparent p-0">
            {TABS.map((t) => {
              const Icon = t.icon
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="group relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-white/45
                    hover:text-white/70
                    data-[state=active]:border-indigo-400 data-[state=active]:bg-transparent data-[state=active]:text-white
                    data-[state=active]:shadow-none"
                >
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Icon className="size-3.5 shrink-0" />
                    <span className="text-xs font-medium">{t.label}</span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-5">
      {/* ── Filter + action bar ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
        <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
        <Separator orientation="vertical" className="h-4 bg-white/10" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">From</Label>
            <DatePickerField
              value={filters.date_from ?? ""}
              onChange={(v) => setFilters({ ...filters, date_from: v })}
              placeholder="From"
              className="h-7 w-36 border-white/10 bg-white/5 text-xs"
            />
          </div>
          <span className="mt-4 text-white/25 text-xs">—</span>
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">To</Label>
            <DatePickerField
              value={filters.date_to ?? ""}
              onChange={(v) => setFilters({ ...filters, date_to: v })}
              placeholder="To"
              className="h-7 w-36 border-white/10 bg-white/5 text-xs"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleScreenshot(overviewRef, "overview")}
            disabled={screenshotting}
            className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
            title="Screenshot this tab"
          >
            {screenshotting ? <Loader2Icon className="size-3 animate-spin" /> : <CameraIcon className="size-3" />}
            Screenshot
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

      {/* ── Overview cards + charts (wrapped for screenshot) ── */}
      <div ref={overviewRef} className="space-y-5 rounded-2xl">
        <KpiOverviewCards data={overview} isLoading={isLoading} />
        <KpiTrendsChart data={overview} isLoading={isLoading} error={error} />
      </div>
        </TabsContent>

        {/* ── Monthly tab ── */}
        <TabsContent value="monthly" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MonthlyFilterBar
              filters={monthly.filters}
              onChange={monthly.setFilters}
              onClear={() => monthly.setFilters(DEFAULT_MONTHLY_FILTERS)}
              onRefresh={monthly.refetch}
              isLoading={monthly.isLoading}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleScreenshot(monthlyRef, "monthly")}
              disabled={screenshotting}
              className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
              title="Screenshot this tab"
            >
              {screenshotting ? <Loader2Icon className="size-3 animate-spin" /> : <CameraIcon className="size-3" />}
              Screenshot
            </Button>
          </div>
          <div ref={monthlyRef} className="space-y-4 rounded-2xl">
            <MonthlyKpiPanel data={monthly.monthly} isLoading={monthly.isLoading} error={monthly.error} />
          </div>
        </TabsContent>

        {/* ── Comparison tab ── */}
        <TabsContent value="comparison" className="mt-4 space-y-4">
          <MonthlyFilterBar
            filters={monthly.filters}
            onChange={monthly.setFilters}
            onClear={() => monthly.setFilters(DEFAULT_MONTHLY_FILTERS)}
            onRefresh={monthly.refetch}
            isLoading={monthly.isLoading}
          />
          <MonthlyComparisonPanel data={monthly.comparison} isLoading={monthly.isLoading} error={monthly.error} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
