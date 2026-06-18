// ─── Assignment Table ────────────────────────────────────────────────────────
// Shows assignments in a responsive table with search, pagination, and delete.

import { useEffect, useRef, useState } from "react"
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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

import type {
  AssignmentListFilters,
  AudioAssignmentResource,
  PaginationMeta,
} from "../types/assignment.types"

interface AssignmentTableProps {
  items: AudioAssignmentResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: AssignmentListFilters
  onFilterChange: (filters: AssignmentListFilters) => void
  onDelete: (id: number) => Promise<void>
}

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
  return new Date(value).toLocaleString()
}

export function AssignmentTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onDelete,
}: AssignmentTableProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)

  const [deleteTarget, setDeleteTarget] = useState<AudioAssignmentResource | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if ((filters.search ?? "") !== searchDraft) {
        onFilterChange({ search: searchDraft, page: 1 })
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft])

  function commitSearch() {
    onFilterChange({ search: searchDraft, page: 1 })
  }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
            placeholder="Search by user or audio"
            className="pl-9"
          />
        </div>

        {meta && (
          <p className="text-sm text-muted-foreground">
            {total === 0 ? "No assignments" : `Showing ${from}–${to} of ${total}`}
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Audio</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>Notification</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && items.length === 0 && <TableSkeleton />}

            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-sm text-muted-foreground">
                  No assignments found.
                </TableCell>
              </TableRow>
            )}

            {items.map((assignment) => (
              <TableRow key={assignment.id} className={isLoading ? "opacity-50" : ""}>
                <TableCell className="text-muted-foreground">#{assignment.id}</TableCell>
                <TableCell>{assignment.audio?.name ?? "—"}</TableCell>
                <TableCell>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{assignment.user?.name ?? "—"}</p>
                    <p className="truncate text-xs text-muted-foreground">{assignment.user?.email ?? ""}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{assignment.assigned_by?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={assignment.notification_sent ? "default" : "secondary"}>
                    {assignment.notification_sent ? "Sent" : "Not Sent"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(assignment.assigned_at)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleteTarget(assignment)
                    }}
                    aria-label={`Delete assignment ${assignment.id}`}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || currentPage <= 1}
            onClick={() => onFilterChange({ page: currentPage - 1 })}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Prev
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || currentPage >= lastPage}
            onClick={() => onFilterChange({ page: currentPage + 1 })}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the assignment for <strong>{deleteTarget?.user?.name ?? "this user"}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
