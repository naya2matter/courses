// ─── Admin Online Courses Report Page ────────────────────────────────────────

import { useEffect, useState } from "react"
import {
  ActivityIcon,
  AwardIcon,
  Building2Icon,
  DownloadIcon,
  FileSpreadsheetIcon,
  ListChecksIcon,
  Loader2Icon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
  UserIcon,
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

import {
  useOnlineReport,
  DEFAULT_UCD, DEFAULT_DCD, DEFAULT_SF, DEFAULT_UP, DEFAULT_UCP,
} from "./hook/use-online-report"
import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type { Department } from "@/pages/admin/user-management/departments/types/department.types"
import { getOnlineCourses } from "@/pages/admin/course-management/online-courses/service/online-course.service"
import type { OnlineCourse } from "@/pages/admin/course-management/online-courses/types/online-course.types"
import { UserCourseDailyTable } from "./components/user-course-daily-table"
import { DeptCourseDailyTable } from "./components/dept-course-daily-table"
import { SessionFactTable } from "./components/session-fact-table"
import { UserPerformanceTable } from "./components/user-performance-table"
import { UserCourseProgressTable } from "./components/user-course-progress-table"
import { DeptEvalPanel } from "./components/dept-eval-panel"
import {
  exportUserCourseDaily, exportDeptCourseDaily, exportSessionFact,
  exportUserPerformance, exportUserCourseProgress, exportUserCourseProgressExcel,
  exportDeptEvalPerformance,
} from "./service/online-report.service"

type TabKey = "ucd" | "dcd" | "sf" | "up" | "ucp" | "de"

const TABS = [
  { value: "ucd", label: "User-Course Daily",  icon: UserIcon,       desc: "Per-user daily engagement" },
  { value: "dcd", label: "Dept-Course Daily",  icon: Building2Icon,  desc: "Department aggregates" },
  { value: "sf",  label: "Session Facts",       icon: ActivityIcon,   desc: "Raw session records" },
  { value: "up",  label: "User Performance",    icon: TrendingUpIcon, desc: "Scores & risk ratings" },
  { value: "ucp", label: "Course Progress",     icon: ListChecksIcon, desc: "Compliance & completion" },
  { value: "de",  label: "Dept Evaluation",     icon: AwardIcon,      desc: "Evaluation rankings" },
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
  onExportExcel,
  isExportingExcel,
}: {
  children: React.ReactNode
  activeCount: number
  isLoading: boolean
  isExporting: boolean
  onRefresh: () => void
  onExport: () => void
  onClear: () => void
  /** Optional secondary export (e.g. styled .xlsx). Renders an extra button. */
  onExportExcel?: () => void
  isExportingExcel?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/8 bg-card/40 px-3 py-2.5">
      <SlidersHorizontalIcon className="size-3.5 shrink-0 text-white/25" />
      <Separator orientation="vertical" className="h-4 bg-white/10" />
      {children}
      <div className="ml-auto flex items-center gap-1.5">
        {activeCount > 0 && (
          <Badge variant="outline" className="rounded-full border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400">
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
        {onExportExcel && (
          <Button
            variant="outline" size="sm"
            onClick={onExportExcel}
            disabled={isExportingExcel}
            className="h-7 gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-2.5 text-xs text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
          >
            {isExportingExcel
              ? <Loader2Icon className="size-3 animate-spin" />
              : <FileSpreadsheetIcon className="size-3" />}
            Export Excel
          </Button>
        )}
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

function DeptSelect({
  value,
  onChange,
  departments,
}: {
  value: string
  onChange: (v: string) => void
  departments: Department[]
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-[10px] text-white/35">Department</Label>
      <Select value={value === "" ? "all" : String(value)} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
          <SelectValue placeholder="All depts" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#0f0f1a]">
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function CourseSelect({
  value,
  onChange,
  courses,
}: {
  value: string
  onChange: (v: string) => void
  courses: OnlineCourse[]
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-[10px] text-white/35">Course</Label>
      <Select value={value === "" ? "all" : String(value)} onValueChange={(v) => onChange(v === "all" ? "" : v)}>
        <SelectTrigger className="h-7 w-40 border-white/10 bg-white/5 text-xs text-white">
          <SelectValue placeholder="All courses" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#0f0f1a]">
          <SelectItem value="all">All courses</SelectItem>
          {courses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReportOnlineCoursesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("ucd")
  const {
    ucd, ucdFilters, setUcdFilters, setUcdPage, refetchUcd,
    dcd, dcdFilters, setDcdFilters, setDcdPage, refetchDcd,
    sf, sfFilters, setSfFilters, setSfPage, refetchSf,
    up, upFilters, setUpFilters, setUpPage, refetchUp,
    ucp, ucpFilters, setUcpFilters, setUcpPage, refetchUcp,
    de, deFilters, setDeFilters, refetchDe,
  } = useOnlineReport(activeTab)

  const [exporting, setExporting] = useState<TabKey | null>(null)
  const [exportingExcel, setExportingExcel] = useState(false)

  // Real departments for the filter — the backend validates department_id with
  // `exists:departments,id`, so hardcoded placeholder ids caused a 422 ("failed
  // to fetch") whenever one was picked.
  const [departments, setDepartments] = useState<Department[]>([])
  useEffect(() => {
    let active = true
    getAllDepartments()
      .then((res) => { if (active) setDepartments(res.departments) })
      .catch(() => { /* filter just falls back to "All departments" */ })
    return () => { active = false }
  }, [])

  // Real online courses for the filter — same "exists:course_onlines,id" story
  // as departments above, so this has to come from the backend, not a stub list.
  const [courses, setCourses] = useState<OnlineCourse[]>([])
  useEffect(() => {
    let active = true
    getOnlineCourses({ per_page: 200 })
      .then((res) => { if (active) setCourses(res.data) })
      .catch(() => { /* filter just falls back to "All courses" */ })
    return () => { active = false }
  }, [])

  async function handleExportExcel() {
    setExportingExcel(true)
    try {
      await exportUserCourseProgressExcel(ucpFilters)
      toast.success("Excel downloaded.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed.")
    } finally {
      setExportingExcel(false)
    }
  }

  async function handleExport(key: TabKey) {
    setExporting(key)
    try {
      if (key === "ucd") await exportUserCourseDaily(ucdFilters)
      else if (key === "dcd") await exportDeptCourseDaily(dcdFilters)
      else if (key === "sf") await exportSessionFact(sfFilters)
      else if (key === "up") await exportUserPerformance(upFilters)
      else if (key === "ucp") await exportUserCourseProgress(ucpFilters)
      else await exportDeptEvalPerformance(deFilters)
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Online Courses Report</h1>
        <p className="mt-0.5 text-sm text-white/40">
          Aggregated datasets, user performance, compliance, and evaluation metrics.
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        {/* Tab list — horizontal scroll on narrow viewports, scrollbar hidden */}
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

        {/* ── User-Course Daily ── */}
        <TabsContent value="ucd" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(ucdFilters)}
            isLoading={ucd.isLoading}
            isExporting={exporting === "ucd"}
            onRefresh={refetchUcd}
            onExport={() => handleExport("ucd")}
            onClear={() => setUcdFilters(DEFAULT_UCD)}
          >
            <DateRange
              from={ucdFilters.date_from ?? ""} to={ucdFilters.date_to ?? ""}
              onFrom={(v) => setUcdFilters({ ...ucdFilters, date_from: v, page: 1 })}
              onTo={(v) => setUcdFilters({ ...ucdFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(ucdFilters.department_id ?? "")}
              onChange={(v) => setUcdFilters({ ...ucdFilters, department_id: v, page: 1 })}
              departments={departments}
            />
            <CourseSelect
              value={String(ucdFilters.course_online_id ?? "")}
              onChange={(v) => setUcdFilters({ ...ucdFilters, course_online_id: v, page: 1 })}
              courses={courses}
            />
          </FilterBar>
          <UserCourseDailyTable data={ucd.data} meta={ucd.meta} isLoading={ucd.isLoading} error={ucd.error} page={ucdFilters.page ?? 1} onPageChange={setUcdPage} onRetry={refetchUcd} />
        </TabsContent>

        {/* ── Dept-Course Daily ── */}
        <TabsContent value="dcd" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(dcdFilters)}
            isLoading={dcd.isLoading}
            isExporting={exporting === "dcd"}
            onRefresh={refetchDcd}
            onExport={() => handleExport("dcd")}
            onClear={() => setDcdFilters(DEFAULT_DCD)}
          >
            <DateRange
              from={dcdFilters.date_from ?? ""} to={dcdFilters.date_to ?? ""}
              onFrom={(v) => setDcdFilters({ ...dcdFilters, date_from: v, page: 1 })}
              onTo={(v) => setDcdFilters({ ...dcdFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(dcdFilters.department_id ?? "")}
              onChange={(v) => setDcdFilters({ ...dcdFilters, department_id: v, page: 1 })}
              departments={departments}
            />
            <CourseSelect
              value={String(dcdFilters.course_online_id ?? "")}
              onChange={(v) => setDcdFilters({ ...dcdFilters, course_online_id: v, page: 1 })}
              courses={courses}
            />
          </FilterBar>
          <DeptCourseDailyTable data={dcd.data} meta={dcd.meta} isLoading={dcd.isLoading} error={dcd.error} page={dcdFilters.page ?? 1} onPageChange={setDcdPage} onRetry={refetchDcd} />
        </TabsContent>

        {/* ── Session Facts ── */}
        <TabsContent value="sf" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(sfFilters)}
            isLoading={sf.isLoading}
            isExporting={exporting === "sf"}
            onRefresh={refetchSf}
            onExport={() => handleExport("sf")}
            onClear={() => setSfFilters(DEFAULT_SF)}
          >
            <DateRange
              from={sfFilters.date_from ?? ""} to={sfFilters.date_to ?? ""}
              onFrom={(v) => setSfFilters({ ...sfFilters, date_from: v, page: 1 })}
              onTo={(v) => setSfFilters({ ...sfFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(sfFilters.department_id ?? "")}
              onChange={(v) => setSfFilters({ ...sfFilters, department_id: v, page: 1 })}
              departments={departments}
            />
            <CourseSelect
              value={String(sfFilters.course_online_id ?? "")}
              onChange={(v) => setSfFilters({ ...sfFilters, course_online_id: v, page: 1 })}
              courses={courses}
            />
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-white/35">Suspicious</Label>
              <Select
                value={sfFilters.is_suspicious === true ? "1" : sfFilters.is_suspicious === false ? "0" : ""}
                onValueChange={(v) => setSfFilters({ ...sfFilters, is_suspicious: v === "1" ? true : v === "0" ? false : "", page: 1 })}
              >
                <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="All sessions" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f1a]">
                  <SelectItem value="all">All sessions</SelectItem>
                  <SelectItem value="1">Suspicious only</SelectItem>
                  <SelectItem value="0">Clean only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
          <SessionFactTable data={sf.data} meta={sf.meta} isLoading={sf.isLoading} error={sf.error} page={sfFilters.page ?? 1} onPageChange={setSfPage} onRetry={refetchSf} />
        </TabsContent>

        {/* ── User Performance ── */}
        <TabsContent value="up" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(upFilters)}
            isLoading={up.isLoading}
            isExporting={exporting === "up"}
            onRefresh={refetchUp}
            onExport={() => handleExport("up")}
            onClear={() => setUpFilters(DEFAULT_UP)}
          >
            <DateRange
              from={upFilters.date_from ?? ""} to={upFilters.date_to ?? ""}
              onFrom={(v) => setUpFilters({ ...upFilters, date_from: v, page: 1 })}
              onTo={(v) => setUpFilters({ ...upFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(upFilters.department_id ?? "")}
              onChange={(v) => setUpFilters({ ...upFilters, department_id: v, page: 1 })}
              departments={departments}
            />
            <CourseSelect
              value={String(upFilters.course_online_id ?? "")}
              onChange={(v) => setUpFilters({ ...upFilters, course_online_id: v, page: 1 })}
              courses={courses}
            />
          </FilterBar>
          <UserPerformanceTable data={up.data} meta={up.meta} isLoading={up.isLoading} error={up.error} page={upFilters.page ?? 1} onPageChange={setUpPage} onRetry={refetchUp} />
        </TabsContent>

        {/* ── User-Course Progress ── */}
        <TabsContent value="ucp" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(ucpFilters)}
            isLoading={ucp.isLoading}
            isExporting={exporting === "ucp"}
            onRefresh={refetchUcp}
            onExport={() => handleExport("ucp")}
            onClear={() => setUcpFilters(DEFAULT_UCP)}
            onExportExcel={handleExportExcel}
            isExportingExcel={exportingExcel}
          >
            <DateRange
              from={ucpFilters.date_from ?? ""} to={ucpFilters.date_to ?? ""}
              onFrom={(v) => setUcpFilters({ ...ucpFilters, date_from: v, page: 1 })}
              onTo={(v) => setUcpFilters({ ...ucpFilters, date_to: v, page: 1 })}
            />
            <DeptSelect
              value={String(ucpFilters.department_id ?? "")}
              onChange={(v) => setUcpFilters({ ...ucpFilters, department_id: v, page: 1 })}
              departments={departments}
            />
            <CourseSelect
              value={String(ucpFilters.course_online_id ?? "")}
              onChange={(v) => setUcpFilters({ ...ucpFilters, course_online_id: v, page: 1 })}
              courses={courses}
            />
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-white/35">Status</Label>
              <Select
                value={ucpFilters.status ?? ""}
                onValueChange={(v) => setUcpFilters({ ...ucpFilters, status: (v === "all" ? "" : v) as typeof ucpFilters.status, page: 1 })}
              >
                <SelectTrigger className="h-7 w-32 border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f1a]">
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
          <UserCourseProgressTable data={ucp.data} meta={ucp.meta} isLoading={ucp.isLoading} error={ucp.error} page={ucpFilters.page ?? 1} onPageChange={setUcpPage} onRetry={refetchUcp} />
        </TabsContent>

        {/* ── Dept Evaluation ── */}
        <TabsContent value="de" className="mt-4 space-y-3">
          <FilterBar
            activeCount={countActiveFilters(deFilters)}
            isLoading={de.isLoading}
            isExporting={exporting === "de"}
            onRefresh={refetchDe}
            onExport={() => handleExport("de")}
            onClear={() => setDeFilters({})}
          >
            <div className="flex flex-col gap-0.5">
              <Label className="text-[10px] text-white/35">Course Type</Label>
              <Select
                value={deFilters.course_type ?? ""}
                onValueChange={(v) => setDeFilters({ course_type: (v === "all" ? "" : v) as typeof deFilters.course_type })}
              >
                <SelectTrigger className="h-7 w-36 border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0f0f1a]">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FilterBar>
          <DeptEvalPanel data={de.data} isLoading={de.isLoading} error={de.error} onRetry={refetchDe} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
