// ─── Video Category Table ──────────────────────────────────────────────────────
// Renders the full list of video categories with:
//   • Debounced search input
//   • Skeleton loading rows
//   • Empty state
//   • Slug badge column
//   • Edit button → CategoryFormSheet
//   • Delete button → ConfirmDeleteDialog (shared) with 422 error handling
//   • Pagination controls

import {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useRef,
  useEffect,
} from "react"
import {
  Trash2Icon,
  PencilIcon,
  VideoIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


import { CategoryFormSheet } from "./category-form-sheet"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"
import { isApiError } from "@/lib/api"

import type {
  VideoCategory,
  VideoCategoryPayload,
  VideoCategoryListResponse,
} from "../types/category.types"

// ── Imperative handle ─────────────────────────────────────────────────────────

export type CategoryTableHandle = {
  openCreate: () => void
  openEdit: (category: VideoCategory) => void
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryTableProps {
  items: VideoCategory[]
  isLoading: boolean
  search: string
  page: number
  paginationMeta: VideoCategoryListResponse["meta"] | null
  onRefetch: () => void
  onCreate: (payload: VideoCategoryPayload) => Promise<VideoCategory>
  onUpdate: (id: number, payload: VideoCategoryPayload) => Promise<VideoCategory>
  onDelete: (id: number) => Promise<void>
  onSearch: (value: string) => void
  onPageChange: (page: number) => void
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-10" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-7 w-7 rounded-md" />
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export const CategoryTable = forwardRef<CategoryTableHandle, CategoryTableProps>(
  function CategoryTable(
    {
      items,
      isLoading,
      search,
      page,
      paginationMeta,
      onRefetch,
      onCreate,
      onUpdate,
      onDelete,
      onSearch,
      onPageChange,
    },
    ref,
  ) {
    const safeItems = Array.isArray(items) ? items : []

    // ── Edit sheet state ─────────────────────────────────────────────────────
    const [editTarget, setEditTarget] = useState<VideoCategory | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    // ── Delete dialog state ──────────────────────────────────────────────────
    const [deleteTarget, setDeleteTarget] = useState<VideoCategory | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // ── Debounced search ─────────────────────────────────────────────────────
    const [localSearch, setLocalSearch] = useState(search)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Keep local value in sync when parent resets it
    useEffect(() => {
      setLocalSearch(search)
    }, [search])

    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setLocalSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
          onSearch(value)
        }, 500)
      },
      [onSearch],
    )

    // ── Edit / create handlers ────────────────────────────────────────────────

    function openEdit(category: VideoCategory) {
      setEditTarget(category)
      setSheetOpen(true)
    }

    function openCreate() {
      setEditTarget(null)
      setSheetOpen(true)
    }

    useImperativeHandle(ref, () => ({ openCreate, openEdit }))

    function getSubmitHandler(payload: VideoCategoryPayload): Promise<VideoCategory> {
      return editTarget ? onUpdate(editTarget.id, payload) : onCreate(payload)
    }

    // ── Delete handlers ──────────────────────────────────────────────────────

    function openDelete(category: VideoCategory) {
      setDeleteTarget(category)
      setDeleteError(null)
    }

    async function handleConfirmDelete() {
      if (!deleteTarget) return
      setIsDeleting(true)
      setDeleteError(null)

      try {
        await onDelete(deleteTarget.id)
        toast.success(`"${deleteTarget.name}" deleted successfully.`)
        setDeleteTarget(null)
        onRefetch()
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setIsDeleting(false)
          return
        }

        if (isApiError(err)) {
          if (err.status === 422) {
            setDeleteError(
              "This item cannot be deleted because it has linked records. Reassign or delete them first.",
            )
          } else if (err.status === 401) {
            setDeleteError("Your session has expired. Please log in again.")
          } else {
            setDeleteError(err.message || "Failed to delete category.")
          }
        } else if (err instanceof Error) {
          setDeleteError(err.message)
        } else {
          setDeleteError("Failed to delete category.")
        }
      } finally {
        setIsDeleting(false)
      }
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    const currentPage = paginationMeta?.current_page ?? page
    const lastPage = paginationMeta?.last_page ?? 1
    const totalItems = paginationMeta?.total

    // ── Helpers ───────────────────────────────────────────────────────────────

    function formatDate(value: string | null | undefined): string {
      if (!value) return "—"
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
      <>
        {/* ── Search bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-9"
              placeholder="Search categories…"
              value={localSearch}
              onChange={handleSearchChange}
              disabled={isLoading}
            />
          </div>
          {totalItems !== undefined && (
            <span className="text-sm text-muted-foreground">
              {totalItems} {totalItems === 1 ? "category" : "categories"}
            </span>
          )}
        </div>

        {/* ── Table card ────────────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-28">Sort Order</TableHead>
                <TableHead className="w-36">Created</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* ── Loading skeleton ──────────────────────────────────────── */}
              {isLoading && safeItems.length === 0 && <TableSkeleton />}

              {/* ── Empty state ───────────────────────────────────────────── */}
              {!isLoading && safeItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <VideoIcon className="h-10 w-10 opacity-30" />
                      {localSearch ? (
                        <p className="text-sm">
                          No categories match &ldquo;{localSearch}&rdquo;.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm">No video categories yet.</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openCreate}
                            className="mt-1"
                          >
                            Create the first one
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {/* ── Data rows ─────────────────────────────────────────────── */}
              {safeItems.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {category.id}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {category.slug}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {category.sort_order}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(category.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(category)}
                        aria-label={`Edit ${category.name}`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDelete(category)}
                        aria-label={`Delete ${category.name}`}
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

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {lastPage}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isLoading}
                onClick={() => onPageChange(currentPage - 1)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= lastPage || isLoading}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Create / Edit Sheet ───────────────────────────────────────────── */}
        <CategoryFormSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          onSuccess={onRefetch}
          category={editTarget}
          onSubmit={(payload) => getSubmitHandler(payload)}
        />

        {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteTarget(null)
              setDeleteError(null)
            }
          }}
          isLoading={isDeleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
        />
      </>
    )
  },
)
