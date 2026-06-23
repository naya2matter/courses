// ─── OnlineCourseEnrollmentsSection ──────────────────────────────────────────
// Shows all enrolled users for a course: summary cards, filters, and table.
// Self-contained — manages its own fetch state with no external store.

import { useEffect, useRef, useState } from "react"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleDotIcon,
  Loader2Icon,
  MinusCircleIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getCourseEnrollments } from "../service/online-course.service"
import { getAllDepartments } from "@/pages/admin/user-management/departments/service/department.service"
import type {
  CourseEnrollment,
  EnrollmentFilters,
  EnrollmentListResponse,
  EnrollmentStatus,
  OnlineCourseSummaryCard,
} from "../types/online-course.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function statusLabel(s: EnrollmentStatus): string {
  if (s === "not_started") return "Not Started"
  if (s === "in_progress") return "In Progress"
  return "Completed"
}

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const classes: Record<EnrollmentStatus, string> = {
    not_started: "border-zinc-500/30 bg-zinc-500/15 text-zinc-400",
    in_progress: "border-sky-500/30 bg-sky-500/15 text-sky-400",
    completed: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  }
  return (
    <Badge className={`border text-[11px] ${classes[status]}`}>
      {statusLabel(status)}
    </Badge>
  )
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-indigo-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

// ── Cards ─────────────────────────────────────────────────────────────────────

const CARD_META: Record<string, { icon: React.ElementType; color: string }> = {
  total_enrolled: { icon: UsersIcon, color: "text-indigo-400" },
  not_started:    { icon: MinusCircleIcon, color: "text-zinc-400" },
  in_progress:    { icon: CircleDotIcon, color: "text-sky-400" },
  completed:      { icon: CheckCircle2Icon, color: "text-emerald-400" },
}

function EnrollmentCards({ cards }: { cards: OnlineCourseSummaryCard[] }) {
  if (!cards.length) return null
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(({ key, title, value }) => {
        const meta = CARD_META[key] ?? { icon: UsersIcon, color: "text-muted-foreground" }
        const Icon = meta.icon
        return (
          <div key={key} className="flex flex-col items-center text-center py-4 px-3 rounded-2xl border border-white/8 bg-white/2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className={`h-5 w-5 ${meta.color}`} />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground leading-tight">
              {title}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

function EnrollmentTable({ rows }: { rows: CourseEnrollment[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-muted-foreground">
        No enrolled users match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/3">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">User</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Department</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Assigned By</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Assigned At</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Progress</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Items Done</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Last Active</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/6">
          {rows.map((row) => (
            <tr key={row.user_id} className="hover:bg-white/2 transition-colors">
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="font-medium text-white">{row.user_name}</p>
                <p className="text-xs text-muted-foreground">{row.user_email}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {row.department ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {row.assigned_by ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmt(row.assigned_at)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ProgressBar pct={row.progress_percentage} />
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap tabular-nums">
                {row.completed_content_items}/{row.total_content_items}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmt(row.last_accessed_at)}
              </td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmt(row.completed_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  meta,
  onPage,
}: {
  meta: EnrollmentListResponse["meta"]
  onPage: (p: number) => void
}) {
  if (meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {meta.current_page} of {meta.last_page} · {meta.total} users
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-white/10 bg-white/5"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-white/10 bg-white/5"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface OnlineCourseEnrollmentsSectionProps {
  courseId: number
}

export function OnlineCourseEnrollmentsSection({
  courseId,
}: OnlineCourseEnrollmentsSectionProps) {
  const [data, setData] = useState<EnrollmentListResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<EnrollmentFilters>({})
  const [searchDraft, setSearchDraft] = useState("")
  const [page, setPage] = useState(1)

  const [deptOptions, setDeptOptions] = useState<{ id: number; name: string }[]>([])

  const abortRef = useRef<AbortController | null>(null)

  // Load department options once for the filter dropdown
  useEffect(() => {
    getAllDepartments().then(({ departments }) => {
      const flat: { id: number; name: string }[] = []
      function flatten(depts: typeof departments) {
        for (const d of depts) {
          flat.push({ id: d.id, name: d.name })
          if (d.children?.length) flatten(d.children)
        }
      }
      flatten(departments)
      setDeptOptions(flat)
    }).catch(() => {/* non-critical */})
  }, [])

  // Fetch enrollments whenever courseId, filters, or page changes
  useEffect(() => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    getCourseEnrollments(courseId, { ...filters, page, per_page: 20 })
      .then((res) => {
        setData(res)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError("Failed to load enrollment data. Please try again.")
        setIsLoading(false)
      })

    return () => abortRef.current?.abort()
  }, [courseId, filters, page])

  function applyFilter(patch: Partial<EnrollmentFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }

  function commitSearch() {
    applyFilter({ search: searchDraft.trim() || undefined })
  }

  function clearFilters() {
    setSearchDraft("")
    setFilters({})
    setPage(1)
  }

  const hasActiveFilters = Boolean(filters.search || filters.status || filters.department_id)

  return (
    <div className="space-y-5 rounded-2xl border border-white/8 bg-white/2 p-5 sm:p-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
          <UsersIcon className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Enrolled Users</h2>
          <p className="text-xs text-muted-foreground">
            {data ? `${data.meta.total} user${data.meta.total !== 1 ? "s" : ""} enrolled` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {data && <EnrollmentCards cards={data.cards} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitSearch() }}
            onBlur={commitSearch}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) =>
            applyFilter({ status: v === "all" ? undefined : (v as EnrollmentStatus) })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Department */}
        {deptOptions.length > 0 && (
          <Select
            value={filters.department_id != null ? String(filters.department_id) : "all"}
            onValueChange={(v) =>
              applyFilter({ department_id: v === "all" ? undefined : Number(v) })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {deptOptions.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Table */}
      {!isLoading && data && <EnrollmentTable rows={data.data} />}

      {/* Pagination */}
      {!isLoading && data && (
        <Pagination meta={data.meta} onPage={setPage} />
      )}
    </div>
  )
}
