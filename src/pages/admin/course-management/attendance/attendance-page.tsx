// ─── Attendance Page ──────────────────────────────────────────────────────────
// Displays all clocking records in a paginated, searchable data table.
// Supports inline Edit (PUT) and Delete operations.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIcon,
  AlertCircleIcon,
  BoltIcon,
  ClockIcon,
  Loader2Icon,
  PencilIcon,
  RefreshCwIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
  UserIcon,
  BookOpenIcon,
  TimerIcon,
  FilterXIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getAllAttendance } from "./service/attendance.service"
import { EditAttendanceDialog } from "./components/edit-attendance-dialog"
import { DeleteAttendanceDialog } from "./components/delete-attendance-dialog"
import type { AttendanceListFilters, AttendanceSummaryCard, ClockingRecord } from "./types/attendance.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

function formatDatetime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getSummaryIcon(key: string) {
  switch (key) {
    case "total_clocking_records":
      return ClockIcon
    case "active_sessions":
      return ActivityIcon
    case "total_hours_logged":
      return BoltIcon
    case "total_records":
      return ClockIcon
    case "visible_records":
      return UserIcon
    case "page":
      return TimerIcon
    default:
      return ClockIcon
  }
}

function RatingStars({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground text-sm">—</span>
  const clamped = Math.min(5, Math.max(1, Math.round(value)))
  return (
    <span className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={`h-3.5 w-3.5 ${i < clamped ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </span>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationBarProps {
  currentPage: number
  lastPage: number
  total: number
  from: number | null
  to: number | null
  isLoading: boolean
  onPageChange: (page: number) => void
}

function PaginationBar({
  currentPage,
  lastPage,
  total,
  from,
  to,
  isLoading,
  onPageChange,
}: PaginationBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground">
      <span>
        {from != null && to != null
          ? `Showing ${from}–${to} of ${total} records`
          : `${total} record${total !== 1 ? "s" : ""}`}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(1)}
        >
          «
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ‹
        </Button>
        <span className="px-3 text-sm font-medium">
          {currentPage} / {lastPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          ›
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage || isLoading}
          onClick={() => onPageChange(lastPage)}
        >
          »
        </Button>
      </div>
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function TableSkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PER_PAGE = 15

export default function AttendancePage() {
  const [records, setRecords] = useState<ClockingRecord[]>([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: null as number | null, to: null as number | null })
  const [summaryCards, setSummaryCards] = useState<AttendanceSummaryCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)

  // Edit state
  const [editRecord, setEditRecord] = useState<ClockingRecord | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Delete state
  const [deleteRecord, setDeleteRecord] = useState<ClockingRecord | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounce search ──────────────────────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  // ── Fetch data ───────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters: AttendanceListFilters = {
        page,
        per_page: PER_PAGE,
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      }
      const result = await getAllAttendance(filters)
      setRecords(result.data)
      setMeta({
        current_page: result.meta.current_page,
        last_page: result.meta.last_page,
        total: result.meta.total,
        from: result.meta.from,
        to: result.meta.to,
      })
      setSummaryCards(result.cards)
    } catch (err) {
      if (isCanceledError(err)) return
      const message = err instanceof Error ? err.message : "Failed to load attendance records."
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Edit handlers ────────────────────────────────────────────────────────

  function openEdit(record: ClockingRecord) {
    setEditRecord(record)
    setIsEditOpen(true)
  }

  function handleUpdated(updated: ClockingRecord) {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
  }

  // ── Delete handlers ──────────────────────────────────────────────────────

  function openDelete(record: ClockingRecord) {
    setDeleteRecord(record)
    setIsDeleteOpen(true)
  }

  function handleDeleted(id: number) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setMeta((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
  }

  // ── Clear search ─────────────────────────────────────────────────────────

  function clearSearch() {
    setSearch("")
    setDebouncedSearch("")
    setPage(1)
  }

  const hasActiveSearch = debouncedSearch.trim().length > 0
  const isEmpty = !isLoading && records.length === 0 && !error

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-6 p-4 md:p-6">

        {/* ── Header ── */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ClockIcon className="h-6 w-6 text-primary" />
              Attendance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and review all clocking records across courses.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
            className="self-start sm:self-auto"
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4" />
            )}
            <span className="ml-1.5">Refresh</span>
          </Button>
        </div>

        

        {/* ── Summary Cards ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(summaryCards.length > 0 ? summaryCards : [
            { key: "total_records", title: "Total Records", value: meta.total },
            { key: "visible_records", title: "Showing", value: records.length },
            { key: "page", title: "Page", value: `${meta.current_page} / ${meta.last_page}` },
          ]).map((card) => {
            const Icon = getSummaryIcon(card.key)
            return (
              <div
                key={card.key}
                className="flex flex-col items-center justify-between "
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mb-3">
                  <Icon className="h-5 w-5 text-sky-400" />
                </div>
                <p className="text-4xl font-semibold tabular-nums text-foreground">
                  {isLoading ? <Skeleton className="h-10 w-24" /> : card.value}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {card.title}
                </p>
              </div>
            )
          })}
        </section>

        {/* ── Search & Filters ── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by user or course…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {hasActiveSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="text-muted-foreground gap-1.5"
            >
              <FilterXIcon className="h-4 w-4" />
              Clear filter
            </Button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Error loading records</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="link"
                className="ml-2 h-auto p-0 text-destructive-foreground underline"
                onClick={fetchData}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ── Table ── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5" />
                      User
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <BookOpenIcon className="h-3.5 w-3.5" />
                      Course
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Clock In
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Clock Out
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <TimerIcon className="h-3.5 w-3.5" />
                      Duration
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <span className="flex items-center gap-1.5">
                      <StarIcon className="h-3.5 w-3.5" />
                      Rating
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold">Comment</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows count={PER_PAGE} />
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <ClockIcon className="h-10 w-10 opacity-30" />
                        <p className="text-base font-medium">
                          {hasActiveSearch
                            ? "No records match your search."
                            : "No attendance records found."}
                        </p>
                        {hasActiveSearch && (
                          <Button variant="outline" size="sm" onClick={clearSearch}>
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record, idx) => {
                    const rowNumber =
                      (meta.current_page - 1) * PER_PAGE + idx + 1
                    return (
                      <TableRow
                        key={record.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-muted-foreground text-xs">
                          {rowNumber}
                        </TableCell>

                        {/* User */}
                        <TableCell>
                          {record.user ? (
                            <div>
                              <p className="font-medium text-sm leading-tight">
                                {record.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                {record.user.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Course */}
                        <TableCell>
                          {record.course ? (
                            <Badge variant="secondary" className="font-normal max-w-[140px] truncate">
                              {record.course.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Clock In */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {record.clock_in ? (
                            <span className="text-green-600 dark:text-green-400">
                              {formatDatetime(record.clock_in)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Clock Out */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {record.clock_out ? (
                            <span className="text-red-500 dark:text-red-400">
                              {formatDatetime(record.clock_out)}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs font-normal text-amber-600 border-amber-400">
                              In Progress
                            </Badge>
                          )}
                        </TableCell>

                        {/* Duration */}
                        <TableCell className="text-sm font-medium">
                          {formatDuration(record.duration)}
                        </TableCell>

                        {/* Rating */}
                        <TableCell>
                          <RatingStars value={record.rating} />
                        </TableCell>

                        {/* Comment */}
                        <TableCell className="max-w-[200px]">
                          {record.comment ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="truncate text-sm cursor-default">
                                  {record.comment}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="max-w-xs whitespace-pre-wrap text-sm"
                              >
                                {record.comment}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                  onClick={() => openEdit(record)}
                                  aria-label="Edit record"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => openDelete(record)}
                                  aria-label="Delete record"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── Pagination ── */}
        {!isLoading && !error && meta.last_page > 1 && (
          <PaginationBar
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            from={meta.from}
            to={meta.to}
            isLoading={isLoading}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* ── Edit Sheet ── */}
      <EditAttendanceDialog
        open={isEditOpen}
        record={editRecord}
        onClose={() => setIsEditOpen(false)}
        onUpdated={handleUpdated}
      />

      {/* ── Delete AlertDialog ── */}
      <DeleteAttendanceDialog
        open={isDeleteOpen}
        record={deleteRecord}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
    </TooltipProvider>
  )
}
