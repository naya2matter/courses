// ─── Users Page ───────────────────────────────────────────────────────────────
// Full-featured User Management page.
// Fetches users via the Zustand store, handles loading/error states,
// and renders the UsersTable component.

import { AlertCircleIcon, XIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"

import { deleteUser } from "../service/user.service"
import { useUsers } from "../hook/use-users"
import { UsersTable } from "../components/users-table"

export function UsersPageContent() {
  const { users, meta, isLoading, error, filters, fetchUsers, setFilters, clearError } =
    useUsers()

  /**
   * Delete user by id and refresh the table.
   * Throws user-friendly errors so the table dialog can render them.
   */
  async function handleDeleteUser(userId: number) {
    try {
      await deleteUser(userId)
      await fetchUsers()
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }

      if (isApiError(err)) {
        if (err.status === 422 && err.data?.errors) {
          const first = Object.values(err.data.errors as Record<string, string[]>)[0]
          throw new Error(
            Array.isArray(first) && first.length > 0
              ? first[0]
              : "Validation error while deleting user.",
          )
        }
        throw new Error(err.message || "Failed to delete user.")
      }

      throw err
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            View, search, and manage all users in the system.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="w-fit">
            <Link to="/admin/user-management/users/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>

          {/* Manual refresh triggers a re-fetch with the current filters */}
          <Button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            variant="outline"
            className="w-fit"
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {/* Shown for real API/network errors; AbortError is never surfaced. */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Users table — always rendered; skeleton shown while loading ──────── */}
      <UsersTable
        users={users}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  )
}
