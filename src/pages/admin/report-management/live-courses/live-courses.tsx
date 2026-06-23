// ─── Admin Live Courses Report Page ──────────────────────────────────────────

import { useState } from "react"
import {
  CheckCircle2Icon,
  ClipboardListIcon,
  Clock3Icon,
  DownloadIcon,
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DatePickerField } from "@/components/ui/date-picker"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useLiveReport, DEFAULT_REG_FILTERS, DEFAULT_ATT_FILTERS, DEFAULT_COMP_FILTERS } from "./hook/use-live-report"
import { RegistrationsTable } from "./components/registrations-table"
import { AttendanceTable } from "./components/attendance-table"
import { CompletionTable } from "./components/completion-table"
import {
  exportRegistrationsCsv,
  exportAttendanceCsv,
  exportCompletionCsv,
} from "./service/live-report.service"

type ExportKey = "registrations" | "attendance" | "completion"

const DEPARTMENTS = [
  { id: "1", name: "IT" }, { id: "2", name: "HR" },
  { id: "3", name: "Finance" }, { id: "4", name: "Ops" },
]

const STATUS_OPTIONS = ["pending", "in_progress", "completed"] as const

const TABS = [
  { value: "registrations", label: "Registrations", icon: ClipboardListIcon, desc: "Enrollment & status" },
  { value: "attendance",    label: "Attendance",    icon: Clock3Icon,         desc: "Clock-in/out records" },
  { value: "completion",    label: "Completion",    icon: CheckCircle2Icon,   desc: "Completions & ratings" },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function countActiveFilters(obj: object): number {
  const IGNORED = new Set(["page", "per_page"])
  return Object.entries(obj as Record<string, unknown>).filter(([k, v]) => !IGNORED.has(k) && v !== "" && v !== undefined && v !== null).length
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FilterBar({
  children,
  activeCount,
  isLoading,
  isExporting,
  onRefresh,
  onExport,
  onClear,
}: {
  children: React.ReactNode
  activeCount: number
  isLoading: boolean
  isExporting: boolean
  onRefresh: () => void
  onExport: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
      <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
      <Separator orientation="vertical" className="h-4 bg-white/10" />
      {children}
      <div className="ml-auto flex items-center gap-1.5">
        {activeCount > 0 && (
          <Badge variant="outline" className="rounded-full border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
            {activeCount} active
          </Badge>
        )}
        <Button
          variant="ghost" size="sm"
          onClick={onClear}
          className="h-7 px-2.5 text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
        >
          Clear
        </Button>
        <Separator orientation="vertical" className="h-4 bg-white/10" />
        <Button
          variant="ghost" size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-7 gap-1.5 px-2.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
        >
          <RefreshCwIcon className={`size-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          variant="outline" size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-7 gap-1.5 border-white/10 bg-white/5 px-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          {isExporting
            ? <Loader2Icon className="size-3 animate-spin" />
            : <DownloadIcon className="size-3" />}
          Export CSV
        </Button>
      </div>
    </div>
  )
}

function DateRange({ from, to, onFrom, onTo }: {
  from: string; to: string
  onFrom: (v: string) => void; onTo: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col gap-0.5">
        <Label className="text-[10px] text-white/35">From</Label>
        <DatePickerField value={from} onChange={onFrom} placeholder="From"
          className="h-7 w-36 border-white/10 bg-white/5 text-xs" />
      </div>
      <span className="mt-4 text-white/25 text-xs">—</span>
      <div className="flex flex-col gap-0.5">
        <Label className="text-[10px] text-white/35">To</Label>
        <DatePickerField value={to} onChange={onTo} placeholder="To"
          className="h-7 w-36 border-white/10 bg-white/5 text-xs" />
      </div>
    </div>
  )
}

function DeptSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-[10px] text-white/35">Department</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
          <SelectValue placeholder="All depts" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#0f0f1a]">
          <SelectItem value="all">All departments</SelectItem>
          {DEPARTMENTS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportLiveCoursesPage() {
  const {
    regs, regFilters, setRegFilters, setRegPage, refetchRegs,
    att, attFilters, setAttFilters, setAttPage, refetchAtt,
    comp, compFilters, setCompFilters, setCompPage, refetchComp,
  } = useLiveReport()

  const [exporting, setExporting] = useState<ExportKey | null>(null)

  async function handleExport(key: ExportKey) {
    setExporting(key)
    try {
      if (key === "registrations") await exportRegistrationsCsv(regFilters)
      else if (key === "attendance") await exportAttendanceCsv(attFilters)
      else await exportCompletionCsv(compFilters)
      toast.success("CSV downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Live Courses Report</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Registrations, attendance records, and completions for traditional live courses.
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="registrations">
        <TabsList className="h-auto w-max gap-0 rounded-none border-b border-white/10 bg-transparent p-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => {
            const Icon = t.icon
            return (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="group relative rounded-none border-b-2 border-transparent px-4 py-2.5 text-white/45
                  hover:text-white/70
                  data-[state=active]:border-sky-400 data-[state=active]:bg-transparent data-[state=active]:text-white
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

        {/* ── Registrations ── */}
        <TabsContent value="registrations" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(regFilters)}
            isLoading={regs.isLoading}
            isExporting={exporting === "registrations"}
            onRefresh={refetchRegs}
            onExport={() => handleExport("registrations")}
            onClear={() => setRegFilters(DEFAULT_REG_FILTERS)}
          >
            <DateRange
              from={regFilters.date_from ?? ""} to={regFilters.date_to ?? ""}
              onFrom={(v) => setRegFilters({ ...regFilters, date_from: v, page: 1 })}
              onTo={(v) => setRegFilters({ ...regFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(regFilters.department_id ?? "")}
              onChange={(v) => setRegFilters({ ...regFilters, department_id: v, page: 1 })}
            />
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-white/35">Status</Label>
              <Select
                value={regFilters.status ?? ""}
                onValueChange={(v) => setRegFilters({ ...regFilters, status: (v === "all" ? "" : v) as typeof regFilters.status, page: 1 })}
              >
                <SelectTrigger className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f1a]">
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
          <RegistrationsTable
            data={regs.data} meta={regs.meta} isLoading={regs.isLoading}
            error={regs.error} page={regFilters.page ?? 1}
            onPageChange={setRegPage} onRetry={refetchRegs}
          />
        </TabsContent>

        {/* ── Attendance ── */}
        <TabsContent value="attendance" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(attFilters)}
            isLoading={att.isLoading}
            isExporting={exporting === "attendance"}
            onRefresh={refetchAtt}
            onExport={() => handleExport("attendance")}
            onClear={() => setAttFilters(DEFAULT_ATT_FILTERS)}
          >
            <DateRange
              from={attFilters.date_from ?? ""} to={attFilters.date_to ?? ""}
              onFrom={(v) => setAttFilters({ ...attFilters, date_from: v, page: 1 })}
              onTo={(v) => setAttFilters({ ...attFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(attFilters.department_id ?? "")}
              onChange={(v) => setAttFilters({ ...attFilters, department_id: v, page: 1 })}
            />
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-white/35">Course</Label>
              <Select
                value={String(attFilters.course_id ?? "")}
                onValueChange={(v) => setAttFilters({ ...attFilters, course_id: v === "all" ? "" : v, page: 1 })}
              >
                <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="All courses" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f1a]">
                  <SelectItem value="all">All courses</SelectItem>
                  <SelectItem value="general">General (no course)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
          <AttendanceTable
            data={att.data} meta={att.meta} isLoading={att.isLoading}
            error={att.error} page={attFilters.page ?? 1}
            onPageChange={setAttPage} onRetry={refetchAtt}
          />
        </TabsContent>

        {/* ── Completion ── */}
        <TabsContent value="completion" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(compFilters)}
            isLoading={comp.isLoading}
            isExporting={exporting === "completion"}
            onRefresh={refetchComp}
            onExport={() => handleExport("completion")}
            onClear={() => setCompFilters(DEFAULT_COMP_FILTERS)}
          >
            <DateRange
              from={compFilters.date_from ?? ""} to={compFilters.date_to ?? ""}
              onFrom={(v) => setCompFilters({ ...compFilters, date_from: v, page: 1 })}
              onTo={(v) => setCompFilters({ ...compFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(compFilters.department_id ?? "")}
              onChange={(v) => setCompFilters({ ...compFilters, department_id: v, page: 1 })}
            />
          </FilterBar>
          <CompletionTable
            data={comp.data} meta={comp.meta} isLoading={comp.isLoading}
            error={comp.error} page={compFilters.page ?? 1}
            onPageChange={setCompPage} onRetry={refetchComp}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
