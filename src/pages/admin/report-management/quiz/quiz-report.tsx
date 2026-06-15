// ─── Admin Quiz Report Page ───────────────────────────────────────────────────

import { useState } from "react"
import {
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import { useQuizReport, DEFAULT_QUIZ_FILTERS } from "./hook/use-quiz-report"
import { QuizAttemptsTable } from "./components/quiz-attempts-table"
import { exportQuizAttemptsCsv, exportQuizDetailedCsv } from "./service/quiz-report.service"

const DEPARTMENTS = [
  { id: "1", name: "IT" }, { id: "2", name: "HR" },
  { id: "3", name: "Finance" }, { id: "4", name: "Ops" },
]

function countActiveFilters(obj: Record<string, unknown>): number {
  const IGNORED = new Set(["page", "per_page"])
  return Object.entries(obj).filter(([k, v]) => !IGNORED.has(k) && v !== "" && v !== undefined && v !== null).length
}

export default function QuizReportPage() {
  const { data, meta, isLoading, error, filters, setFilters, setPage, refetch } = useQuizReport()

  const [exportingAttempts, setExportingAttempts] = useState(false)
  const [exportingDetailed, setExportingDetailed] = useState(false)

  async function handleExportAttempts() {
    setExportingAttempts(true)
    try {
      await exportQuizAttemptsCsv(filters)
      toast.success("Quiz attempts downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExportingAttempts(false)
    }
  }

  async function handleExportDetailed() {
    setExportingDetailed(true)
    try {
      await exportQuizDetailedCsv({
        quiz_id: filters.quiz_id,
        user_id: filters.user_id,
        department_id: filters.department_id,
        status: filters.status === "pending" ? "" : filters.status,
        date_from: filters.date_from,
        date_to: filters.date_to,
      })
      toast.success("Detailed quiz data downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExportingDetailed(false)
    }
  }

  const activeCount = countActiveFilters(filters as Record<string, unknown>)

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15">
          <FileTextIcon className="size-5 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-white">Quiz Report</h1>
          <p className="mt-0.5 text-sm text-white/40">
            Attempt summaries with scores, pass/fail status, and detailed question-level exports.
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
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]" />
          </div>
          <span className="mt-4 text-white/25 text-xs">—</span>
          <div className="flex flex-col gap-0.5">
            <Label className="text-[10px] text-white/35">To</Label>
            <Input type="date" value={filters.date_to ?? ""}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
              className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white [color-scheme:dark]" />
          </div>
        </div>

        {/* Department */}
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-white/35">Department</Label>
          <Select value={String(filters.department_id ?? "")}
            onValueChange={(v) => setFilters({ ...filters, department_id: v === "all" ? "" : v, page: 1 })}>
            <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
              <SelectValue placeholder="All depts" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value="all">All departments</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-0.5">
          <Label className="text-[10px] text-white/35">Status</Label>
          <Select value={filters.status ?? ""}
            onValueChange={(v) => setFilters({ ...filters, status: (v === "all" ? "" : v) as typeof filters.status, page: 1 })}>
            <SelectTrigger className="h-7 w-28 border-white/10 bg-white/5 text-xs text-white">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0f0f1a]">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {activeCount > 0 && (
            <Badge variant="outline" className="rounded-full border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              {activeCount} active
            </Badge>
          )}
          <Button variant="ghost" size="sm"
            onClick={() => setFilters(DEFAULT_QUIZ_FILTERS)}
            className="h-7 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/70">
            Clear
          </Button>
          <Separator orientation="vertical" className="h-4 bg-white/10" />
          <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading}
            className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white">
            <RefreshCwIcon className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {/* Two export buttons for quiz (attempts + detailed) */}
          <Button variant="outline" size="sm" onClick={handleExportAttempts} disabled={exportingAttempts}
            className="h-7 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
            {exportingAttempts
              ? <Loader2Icon className="size-3 animate-spin" />
              : <DownloadIcon className="size-3" />}
            Attempts
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportDetailed} disabled={exportingDetailed}
            className="h-7 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white">
            {exportingDetailed
              ? <Loader2Icon className="size-3 animate-spin" />
              : <DownloadIcon className="size-3" />}
            Detailed
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <QuizAttemptsTable
        data={data} meta={meta} isLoading={isLoading} error={error}
        page={filters.page ?? 1} onPageChange={setPage} onRetry={refetch}
      />
    </div>
  )
}
