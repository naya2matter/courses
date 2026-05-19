// ─── Quiz Assignment Table ────────────────────────────────────────────────────
// Shows quiz assignments in a responsive table with filters, pagination, delete.

import { useState } from "react"
import {
  AlertCircleIcon,
  BellIcon,
  BellOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  Loader2Icon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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

  const [quizSearchDraft, setQuizSearchDraft] = useState(
    filters.quiz_id != null ? String(filters.quiz_id) : "all",
  )
  const [userSearchDraft, setUserSearchDraft] = useState(
    filters.user_id != null ? String(filters.user_id) : "all",
  )
  const [deleteTarget, setDeleteTarget] = useState<QuizAssignmentResource | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setQuizSearchDraft(filters.quiz_id != null ? String(filters.quiz_id) : "all")
    setUserSearchDraft(filters.user_id != null ? String(filters.user_id) : "all")
  }, [filters.quiz_id, filters.user_id])

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

  function applyFilters() {
    onFilterChange({
      quiz_id:
        quizSearchDraft === "all" ? undefined : Number.parseInt(quizSearchDraft, 10),
      user_id:
        userSearchDraft === "all" ? undefined : Number.parseInt(userSearchDraft, 10),
      page: 1,
    })
  }

  function handleNotificationFilterChange(value: string) {
    if (value === "all") {
      onFilterChange({ notification_sent: null, page: 1 })
    } else {
      onFilterChange({ notification_sent: value === "true", page: 1 })
    }
  }

  function clearFilters() {
    setQuizSearchDraft("all")
    setUserSearchDraft("all")
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
      {/* ── Filters bar ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-card/50 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Search & Filter</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          {meta && (
            <p className="text-xs text-muted-foreground">
              {total === 0
                ? "No assignments"
                : `${from}–${to} of ${total}`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] items-end gap-4">
          {/* Quiz name search as Select */}
          <div className="space-y-1">
            <Label htmlFor="quiz-search" className="text-xs font-medium text-muted-foreground">
              Quiz
            </Label>
            <Select
              value={quizSearchDraft}
              onValueChange={setQuizSearchDraft}
            >
              <SelectTrigger id="quiz-search" className="h-8 text-sm">
                <SelectValue placeholder="All Quizzes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quizzes</SelectItem>
                {quizOptions.map((q) => (
                  <SelectItem key={q.id} value={String(q.id)}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User search as Select */}
          <div className="space-y-1">
            <Label htmlFor="user-search" className="text-xs font-medium text-muted-foreground">
              User
            </Label>
            <Select
              value={userSearchDraft}
              onValueChange={setUserSearchDraft}
            >
              <SelectTrigger id="user-search" className="h-8 text-sm">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification filter */}
          <div className="space-y-1">
            <Label htmlFor="notification" className="text-xs font-medium text-muted-foreground">
              Notification
            </Label>
            <Select
              value={notificationValue}
              onValueChange={handleNotificationFilterChange}
            >
              <SelectTrigger id="notification" className="h-8 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Sent</SelectItem>
                <SelectItem value="false">Not Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full pt-1">
            <Button
              size="sm"
              onClick={applyFilters}
              disabled={isLoading}
              className="px-6"
            >
              Apply
            </Button>
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearFilters}
                disabled={isLoading}
              >
                Clear
              </Button>
            )}
          </div>
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
      {meta && lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onFilterChange({ page: currentPage - 1 })}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {lastPage}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage || isLoading}
            onClick={() => onFilterChange({ page: currentPage + 1 })}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Loading indicator when refreshing ──────────────────────────── */}
      {isLoading && items.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          Refreshing…
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
