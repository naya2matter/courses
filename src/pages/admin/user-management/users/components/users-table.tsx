// ─── Users Table ──────────────────────────────────────────────────────────────
// Renders the paginated list of users in a responsive shadcn Table.
// Includes a search bar and pagination controls.

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Loader2Icon,
  PencilIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  UserIcon,
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

import type { PaginationMeta, UserListFilters, UserListResource } from "../types/user.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map a role string to a badge variant so admins stand out visually */
function RoleBadge({ role }: { role: string }) {
  return (
    <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
      {role}
    </Badge>
  )
}

/** Skeleton rows shown while the first page is loading */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {/* Avatar + name/email cell */}
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UsersTableProps {
  users: UserListResource[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: UserListFilters
  /** Called when the user changes the search field or navigates pages */
  onFilterChange: (filters: UserListFilters) => void
  /** Called when user confirms delete in dialog */
  onDeleteUser: (userId: number) => Promise<void>
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UsersTable({
  users,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onDeleteUser,
}: UsersTableProps) {
  const navigate = useNavigate()

  // Local search draft — only committed to the store on Enter or after a debounce
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "")
  const [userToDelete, setUserToDelete] = useState<UserListResource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  /** Commit the current search draft to the store (triggers a new fetch) */
  function commitSearch() {
    onFilterChange({ search: searchDraft, page: 1 })
  }

  /** Navigate to a different page */
  function goToPage(page: number) {
    onFilterChange({ page })
  }

  /** Open the edit page and prefill it via router state. */
  function handleEdit(user: UserListResource) {
    navigate(`/admin/user-management/users/edit/${user.id}`, {
      state: { user },
    })
  }

  /** Execute confirmed deletion and keep dialog open on error. */
  async function handleConfirmDelete() {
    if (!userToDelete) return

    setDeleteError(null)
    setIsDeleting(true)

    try {
      await onDeleteUser(userToDelete.id)
      setUserToDelete(null)
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete user. Please try again.",
      )
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
    <div className="flex flex-col gap-4">
      {/* ── Toolbar: search input ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search field */}
        <div className="relative w-full sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email…"
            className="pl-9"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            // Commit search on Enter key
            onKeyDown={(e) => e.key === "Enter" && commitSearch()}
          />
        </div>

        {/* Result count */}
        {meta && (
          <p className="shrink-0 text-sm text-muted-foreground">
            {total === 0
              ? "No users found"
              : `Showing ${from}–${to} of ${total} user${total !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-70">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Tier / Level</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading state — show skeleton rows on first load */}
            {isLoading && users.length === 0 && <TableSkeleton />}

            {/* Empty state — no results after a successful fetch */}
            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UserIcon className="h-8 w-8 opacity-40" />
                    <p className="text-sm">No users found.</p>
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

            {/* Data rows */}
            {users.map((user) => (
              <TableRow key={user.id} className={isLoading ? "opacity-50" : ""}>
                {/* User cell: avatar + name + email */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <UserIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-none">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* Role badge */}
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>

                {/* Department */}
                <TableCell className="text-muted-foreground">
                  {user.department?.name ?? (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Tier + level */}
                <TableCell className="text-muted-foreground">
                  {user.tier ? (
                    <span>
                      {user.tier.tier_name}
                      {(user.tier.level_name || user.tier.level?.name) && (
                        <span className="text-xs text-muted-foreground/70">
                          {" "}/ {user.tier.level_name ?? user.tier.level?.name}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="italic text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Joined date */}
                <TableCell className="text-muted-foreground">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : <span className="italic text-muted-foreground/50">—</span>}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEdit(user)}
                      aria-label={`Edit ${user.name}`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        setDeleteError(null)
                        setUserToDelete(user)
                      }}
                      aria-label={`Delete ${user.name}`}
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
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => goToPage(currentPage - 1)}
            className="gap-1.5"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>

          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {lastPage}
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= lastPage || isLoading}
            onClick={() => goToPage(currentPage + 1)}
            className="gap-1.5"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setUserToDelete(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete {userToDelete?.name}. If this user is a direct
              manager, the API may reject this action.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <p className="px-1 text-sm text-destructive">{deleteError}</p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                handleConfirmDelete()
              }}
            >
              {isDeleting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
