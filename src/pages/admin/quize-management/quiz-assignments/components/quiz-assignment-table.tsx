// ─── Quiz Assignment Table ────────────────────────────────────────────────────
// Shows quiz assignments in a responsive table with filters, pagination, delete.

import { useMemo, useState } from "react"
import {
  AlertCircleIcon,
  BellIcon,
  BellOffIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterXIcon,
  Loader2Icon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useEffect } from "react"
import { getAllQuizzes } from "../../quizes/service/quiz.service"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { QuizResource } from "../../quizes/types/quiz.types"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

import type {
  PaginationMeta,
  QuizAssignmentListFilters,
  QuizAssignmentResource,
} from "../types/quiz-assignment.types"

// ── Props ─────────────────────────────────────────────────────────────────────

interface QuizAssignmentTableProps {
  items: QuizAssignmentResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: QuizAssignmentListFilters
  onFilterChange: (filters: QuizAssignmentListFilters) => void
  onDelete: (id: number) => Promise<void>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-3.5 w-10" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-36" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-7 w-8 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuizAssignmentTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onDelete,
}: QuizAssignmentTableProps) {
  const [quizOptions, setQuizOptions] = useState<QuizResource[]>([])
  const [userOptions, setUserOptions] = useState<UserListResource[]>([])

  const [quizSearch, setQuizSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<QuizAssignmentResource | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredQuizOptions = useMemo(() => {
    const q = quizSearch.trim().toLowerCase()
    if (!q) return quizOptions
    return quizOptions.filter((quiz) => quiz.title.toLowerCase().includes(q))
  }, [quizOptions, quizSearch])

  const filteredUserOptions = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return userOptions
    return userOptions.filter((u) =>
      `${u.name} ${u.email}`.toLowerCase().includes(q),
    )
  }, [userOptions, userSearch])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [quizzesResponse, usersResponse] = await Promise.all([
          getAllQuizzes({ page: 1, per_page: 500, status: "published" }),
          getAllUsers({ page: 1, per_page: 500 }),
        ])
        setQuizOptions(quizzesResponse.data)
        setUserOptions(usersResponse.data)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        console.error("Failed to load options for filters", err)
      }
    }
    loadOptions()
  }, [])

  function handleNotificationFilterChange(value: string) {
    if (value === "all") {
      onFilterChange({ notification_sent: null, page: 1 })
    } else {
      onFilterChange({ notification_sent: value === "true", page: 1 })
    }
  }

  function clearFilters() {
    setQuizSearch("")
    setUserSearch("")
    onFilterChange({ quiz_id: undefined, user_id: undefined, notification_sent: null, page: 1 })
  }

  const hasActiveFilters =
    filters.quiz_id != null || filters.user_id != null || filters.notification_sent != null

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to remove assignment.")
    } finally {
      setIsDeleting(false)
    }
  }

  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1
  const total = meta?.total ?? 0
  const from = meta?.from ?? 0
  const to = meta?.to ?? 0

  const notificationValue =
    filters.notification_sent === true
      ? "true"
      : filters.notification_sent === false
        ? "false"
        : "all"

  return (
    <div className="space-y-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        {/* Count row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {meta && (
            <p className="shrink-0 text-sm text-muted-foreground">
              {total === 0
                ? "No assignments found"
                : `Showing ${from}–${to} of ${total} assignment${total !== 1 ? "s" : ""}`}
              {isLoading && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                  <Loader2Icon className="h-3 w-3 animate-spin" /> Refreshing…
                </span>
              )}
            </p>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.quiz_id != null ? String(filters.quiz_id) : "all"}
            onValueChange={(v) =>
              onFilterChange({ quiz_id: v === "all" ? undefined : Number(v), page: 1 })
            }
          >
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue placeholder="All quizzes" />
            </SelectTrigger>
            <SelectContent className="max-h-[420px]" position="popper" sideOffset={4}>
              <div className="sticky top-0 z-10 bg-popover px-2 pt-2 pb-1">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={quizSearch}
                    onChange={(e) => setQuizSearch(e.target.value)}
                    placeholder="Search quizzes..."
                    className="h-9 pl-8"
                  />
                </div>
              </div>
              <SelectItem value="all">All quizzes</SelectItem>
              {filteredQuizOptions.map((q) => (
                <SelectItem key={q.id} value={String(q.id)}>
                  {q.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.user_id != null ? String(filters.user_id) : "all"}
            onValueChange={(v) =>
              onFilterChange({ user_id: v === "all" ? undefined : Number(v), page: 1 })
            }
          >
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent className="max-h-[420px]" position="popper" sideOffset={4}>
              <div className="sticky top-0 z-10 bg-popover px-2 pt-2 pb-1">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="h-9 pl-8"
                  />
                </div>
              </div>
              <SelectItem value="all">All users</SelectItem>
              {filteredUserOptions.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={notificationValue} onValueChange={handleNotificationFilterChange}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All notifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notifications</SelectItem>
              <SelectItem value="true">Sent</SelectItem>
              <SelectItem value="false">Not sent</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              <FilterXIcon className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="w-16 font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Quiz</TableHead>
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Assigned By</TableHead>
              <TableHead className="w-28 font-semibold">Status</TableHead>
              <TableHead className="w-40 font-semibold">Assigned At</TableHead>
              <TableHead className="w-16 text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && items.length === 0 && <TableSkeleton />}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-48 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🎯</span>
                    <p className="font-medium">No assignments yet</p>
                    <p className="text-xs">Assign a quiz to get started</p>
                    {hasActiveFilters && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary mt-2"
                        onClick={clearFilters}
                      >
                        Clear filters to see all
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {items.map((assignment) => (
              <TableRow
                key={assignment.id}
                className={`border-b transition-colors hover:bg-muted/30 ${isLoading ? "opacity-50" : ""}`}
              >
                <TableCell className="font-mono text-xs font-medium text-muted-foreground py-3">
                  #{assignment.id}
                </TableCell>

                <TableCell className="py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm leading-tight">
                      {assignment.quiz_title || assignment.quiz?.title || "—"}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm leading-tight">
                      {assignment.user?.name ?? "—"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground leading-tight">
                      {assignment.user?.email ?? ""}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground py-3">
                  <div className="truncate">{assignment.assigned_by?.name ?? "—"}</div>
                </TableCell>

                <TableCell className="py-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex">
                          <Badge
                            variant={assignment.notification_sent ? "default" : "outline"}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                              assignment.notification_sent
                                ? ""
                                : "border-muted-foreground/30 text-muted-foreground"
                            }`}
                          >
                            {assignment.notification_sent ? (
                              <>
                                <BellIcon className="h-3 w-3" />
                                Sent
                              </>
                            ) : (
                              <>
                                <BellOffIcon className="h-3 w-3" />
                                Unsent
                              </>
                            )}
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">
                        {assignment.notification_sent
                          ? "Notification was sent to the user"
                          : "No notification was sent"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground py-3">
                  {formatDate(assignment.assigned_at ?? assignment.created_at)}
                </TableCell>

                <TableCell className="text-right py-3">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setDeleteError(null)
                            setDeleteTarget(assignment)
                          }}
                          aria-label={`Delete assignment ${assignment.id}`}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {meta && (lastPage > 1 || total > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No assignments"
              : `Showing ${from}–${to} of ${total} assignment${total !== 1 ? "s" : ""}`}
            {isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground/60">
                <Loader2Icon className="h-3 w-3 animate-spin" /> Refreshing…
              </span>
            )}
          </p>
          {lastPage > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onFilterChange({ page: 1 })}
                aria-label="First page"
              >
                <ChevronFirstIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onFilterChange({ page: currentPage - 1 })}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="ml-1">Prev</span>
              </Button>
              <span className="px-3 text-sm font-medium text-muted-foreground">
                {currentPage} / {lastPage}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={currentPage >= lastPage || isLoading}
                onClick={() => onFilterChange({ page: currentPage + 1 })}
              >
                <span className="mr-1">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                disabled={currentPage >= lastPage || isLoading}
                onClick={() => onFilterChange({ page: lastPage })}
                aria-label="Last page"
              >
                <ChevronLastIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the assignment for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.user?.name ?? `user #${deleteTarget?.id}`}
              </span>{" "}
              on quiz{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.quiz?.title ?? `#${deleteTarget?.quiz?.id}`}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
