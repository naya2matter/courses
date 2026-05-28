import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ClipboardListIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  UserPlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"
import { getAllUsers } from "@/pages/admin/user-management/users/service/user.service"
import type { UserListResource } from "@/pages/admin/user-management/users/types/user.types"

import { getOnlineCourses } from "../service/online-course.service"
import type { OnlineCourse } from "../types/online-course.types"
import { useOnlineCourseAssignments } from "../hook/use-online-course-assignments"
import { AssignOnlineCourseDialog } from "../components/assign-online-course-dialog"
import { OnlineCourseAssignmentSummaryCards } from "../components/online-course-assignment-summary-cards"
import { OnlineCourseAssignmentFiltersToolbar } from "../components/online-course-assignment-filters-toolbar"
import type { OnlineCourseAssignmentResource } from "../types/online-course-assignment.types"

function fmtDate(value?: string | null): string {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function AssignmentItem({
  assignment,
  isDeleting,
  onDelete,
}: {
  assignment: OnlineCourseAssignmentResource
  isDeleting: boolean
  onDelete: (id: number) => void
}) {
  return (
    <Card className="border border-white/8 bg-card/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {assignment.course?.name ?? `Course #${assignment.id}`}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <UsersIcon className="h-3.5 w-3.5" />
              {assignment.user?.name ?? "Unknown user"}
              {assignment.user?.email ? `(${assignment.user.email})` : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(assignment.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2Icon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={assignment.is_overdue ? "destructive" : "secondary"}>
            {assignment.is_overdue ? "Overdue" : "On Track"}
          </Badge>
          <span className="text-muted-foreground">Assigned: {fmtDate(assignment.assigned_at)}</span>
          {assignment.deadline && (
            <span className="text-muted-foreground">Deadline: {fmtDate(assignment.deadline)}</span>
          )}
        </div>

        {assignment.assigned_by && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Assigned by {assignment.assigned_by.name}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function OnlineCourseAssignmentsPage() {
  const navigate = useNavigate()
  const {
    items,
    meta,
    summaryCards,
    isLoading,
    error,
    filters,
    isDeleting,
    fetchAssignments,
    setFilters,
    deleteAssignment,
    clearError,
  } = useOnlineCourseAssignments()

  const [courses, setCourses] = useState<OnlineCourse[]>([])
  const [users, setUsers] = useState<UserListResource[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<OnlineCourseAssignmentResource | null>(null)
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null)
  const deletingIdRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true
    setLoadingOptions(true)

    Promise.all([
      getOnlineCourses({ per_page: 200 }),
      getAllUsers({ per_page: 300 }),
    ])
      .then(([coursesRes, usersRes]) => {
        if (!mounted) return
        setCourses(coursesRes.data)
        setUsers(usersRes.data)
      })
      .catch((err: Error) => {
        if (!mounted) return
        toast.error(err.message || "Failed to load filter options")
      })
      .finally(() => {
        if (mounted) setLoadingOptions(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const resultCount = useMemo(() => {
    if (!meta) return null
    return {
      from: meta.from ?? 0,
      to: meta.to ?? 0,
      total: meta.total ?? 0,
    }
  }, [meta])

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    deletingIdRef.current = deleteTarget.id
    setDeleteDialogError(null)
    try {
      await deleteAssignment(deleteTarget.id)
      toast.success("Assignment removed.")
      setDeleteTarget(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove assignment."
      setDeleteDialogError(message)
    } finally {
      deletingIdRef.current = null
    }
  }

  function handlePage(page: number) {
    fetchAssignments({ ...filters, page })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1"
            onClick={() => navigate("/admin/course-management/online-courses")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Online Course Assignments</h1>
            <p className="text-muted-foreground mt-1">
              Assign online courses to users and manage deadlines.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => fetchAssignments()} disabled={isLoading}>
            {isLoading ? <Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCwIcon className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => setAssignOpen(true)}>
            <UserPlusIcon className="h-4 w-4" />
            Assign Course
          </Button>
        </div>
      </div>

      <OnlineCourseAssignmentSummaryCards cards={summaryCards} />

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearError}>
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <OnlineCourseAssignmentFiltersToolbar
        filters={filters}
        courses={courses}
        users={users}
        resultCount={resultCount}
        onFilterChange={setFilters}
        onClearAll={() =>
          setFilters({
            course_online_id: undefined,
            user_id: undefined,
            is_overdue: undefined,
            page: 1,
          })
        }
      />

      {loadingOptions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card/40 py-16 text-center">
          <ClipboardListIcon className="h-10 w-10 text-muted-foreground/35" />
          <p className="mt-4 font-semibold text-muted-foreground">No assignments found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try changing filters or create a new assignment.
          </p>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {items.map((assignment) => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              onDelete={() => {
                setDeleteDialogError(null)
                setDeleteTarget(assignment)
              }}
              isDeleting={isDeleting && deletingIdRef.current === assignment.id}
            />
          ))}
        </div>
      )}

      {!isLoading && meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <Button
            variant="outline"
            onClick={() => handlePage(meta.current_page - 1)}
            disabled={meta.current_page <= 1}
          >
            Previous
          </Button>

          <p className="text-sm text-muted-foreground">
            Page {meta.current_page} of {meta.last_page}
          </p>

          <Button
            variant="outline"
            onClick={() => handlePage(meta.current_page + 1)}
            disabled={meta.current_page >= meta.last_page}
          >
            Next
          </Button>
        </div>
      )}

      <AssignOnlineCourseDialog
        open={assignOpen}
        courses={courses}
        users={users}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => fetchAssignments({ page: 1 })}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
            setDeleteDialogError(null)
          }
        }}
        title="Unassign this user?"
        description={
          deleteTarget
            ? `${deleteTarget.user?.name ?? "This user"} will be unassigned from ${deleteTarget.course?.name ?? "this course"}. This removes the active assignment.`
            : "This action cannot be undone."
        }
        confirmLabel="Unassign"
        isLoading={isDeleting}
        error={deleteDialogError}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
