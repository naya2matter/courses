// ─── Audio Table ──────────────────────────────────────────────────────────────
// Renders the paginated list of audio items.
// Includes:
//   • Search toolbar
//   • Responsive shadcn Table with skeleton loading rows
//   • Detail Sheet (slide-in panel) showing full audio info fetched by ID
//   • Soft-delete confirmation AlertDialog

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Loader2Icon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  Music2Icon,
  AlertCircleIcon,
  PencilIcon,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

import type { AudioListFilters, AudioResource, PaginationMeta } from "../types/audio.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a duration value (seconds) into mm:ss display, or return raw string */
function formatDuration(duration: number | string | null | undefined): string {
  if (duration == null) return "—"
  if (typeof duration === "string") return duration
  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  return `${mins}:${String(secs).padStart(2, "0")}`
}

/** Skeleton rows shown while the first page is loading */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {/* Icon + title cell */}
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-7 w-16 ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}


// ── Props ─────────────────────────────────────────────────────────────────────

interface AudioTableProps {
  items: AudioResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: AudioListFilters
  /** Called when the user changes search text or navigates pages */
  onFilterChange: (filters: AudioListFilters) => void
  /** Called when the user confirms deletion */
  onDeleteAudio: (id: number) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AudioTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onDeleteAudio,
}: AudioTableProps) {
  const navigate = useNavigate()

  // Local search draft — committed to the store on Enter
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")

  // ── Delete dialog state ────────────────────────────────────────────────────
  const [itemToDelete, setItemToDelete] = useState<AudioResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)


  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Commit the current search draft and reset to page 1 */
  function commitSearch() {
    onFilterChange({ search: searchDraft, page: 1 })
  }

  /** Navigate to a specific page */
  function goToPage(page: number) {
    onFilterChange({ page })
  }

  /**
   * Open the detail sheet and fetch full audio info from the API by ID.
   * Keeps the sheet open on error so the user can see the message.
   */
  /**
   * Execute confirmed soft-delete.
   * Keeps the dialog open and shows the error instead of closing on failure.
   */
  async function handleConfirmDelete() {
    if (!itemToDelete) return

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await onDeleteAudio(itemToDelete.id)
      setItemToDelete(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete audio. Please try again.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // ── Pagination helpers ────────────────────────────────────────────────────
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1
  const total = meta?.total ?? 0
  const from = meta?.from ?? 0
  const to = meta?.to ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar: search + result count ────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search field */}
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search audio…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
          />
        </div>

        {/* Result count summary */}
        {meta && (
          <p className="shrink-0 text-sm text-muted-foreground">
            {total === 0
              ? "No audio items found"
              : `Showing ${from}–${to} of ${total} item${total !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-50">Audio</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading skeleton — shown only on the initial empty load */}
            {isLoading && items.length === 0 && <TableSkeleton />}

            {/* Empty state — shown after a successful fetch with no results */}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Music2Icon className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No audio items found.</p>
                    {/* Let the user clear the search filter quickly */}
                    {filters.search && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchDraft("")
                          onFilterChange({ search: "", page: 1 })
                        }}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows — dimmed while a page-change fetch is in-flight */}
            {items.map((audio) => (
              <TableRow key={audio.id} className={isLoading ? "opacity-50" : ""}>
                {/* Icon + title cell */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Music2Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto max-w-full p-0 text-left font-medium leading-none"
                        onClick={() => navigate(`/admin/audio-management/audio/view/${audio.id}`)}
                      >
                        <span className="truncate">
                          {audio.title ?? <span className="italic text-muted-foreground/50">Untitled</span>}
                        </span>
                      </Button>
                      {audio.course && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {audio.course}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Category */}
                <TableCell className="text-muted-foreground">
                  {audio.category ?? <span className="italic text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Duration */}
                <TableCell className="text-muted-foreground">
                  {formatDuration(audio.duration)}
                </TableCell>

                {/* Status badge */}
                <TableCell>
                  {audio.status ? (
                    <Badge
                      variant={typeof audio.status === "string" && audio.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {typeof audio.status === "string" ? audio.status : "Status summary"}
                    </Badge>
                  ) : (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Created date */}
                <TableCell className="text-muted-foreground">
                  {audio.created_at
                    ? new Date(audio.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : <span className="italic text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Action buttons: View detail + Edit + Delete */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    

                    {/* Navigate to the edit page, passing the row data via router state */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        navigate(`/admin/audio-management/audio/edit/${audio.id}`, {
                          state: { audio },
                        })
                      }
                      aria-label={`Edit ${audio.title ?? "audio"}`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>

                    {/* Opens the delete confirmation dialog */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteError(null)
                        setItemToDelete(audio)
                      }}
                      aria-label={`Delete ${audio.title ?? "audio"}`}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination controls ────────────────────────────────────────────── */}
      {meta && lastPage > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || isLoading}
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
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= lastPage || isLoading}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <AlertDialog
        open={itemToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setItemToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete audio item?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete{" "}
              <strong>{itemToDelete?.title ?? `audio #${itemToDelete?.id}`}</strong>.
              This action performs a soft-delete — the record can be restored by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Inline error shown when the delete request fails */}
          {deleteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircleIcon className="size-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Prevent the dialog from closing before we handle the result
                e.preventDefault()
                handleConfirmDelete()
              }}
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
