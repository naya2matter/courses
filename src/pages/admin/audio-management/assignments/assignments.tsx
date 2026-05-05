// ─── Audio Assignments Page ─────────────────────────────────────────────────
// Implements list/create/delete for audio assignments.

import { useState } from "react"
import { AlertCircleIcon, Loader2Icon, PlusIcon, RefreshCwIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"

import { useAssignment } from "./hook/use-assignment"
import { AssignmentTable } from "./components/assignment-table"
import { CreateAssignmentSheet } from "./components/create-assignment-sheet"

export default function AudioAssignmentsPage() {
  const {
    items,
    meta,
    isLoading,
    error,
    filters,
    clearError,
    fetchAssignments,
    setFilters,
    createAssignment,
    deleteAssignment,
  } = useAssignment()

  const [createOpen, setCreateOpen] = useState(false)

  // Normalize delete errors so table can show a friendly message.
  async function handleDeleteAssignment(id: number) {
    try {
      await deleteAssignment(id)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return

      if (isApiError(err)) {
        if (err.status === 404) throw new Error("Assignment not found.")
        throw new Error(err.message || "Failed to remove assignment.")
      }

      throw err
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audio Assignments</h1>
          <p className="mt-1 text-muted-foreground">
            List, create, and remove audio assignments for users.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Assignment
          </Button>

          <Button variant="outline" onClick={() => fetchAssignments()} disabled={isLoading}>
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Top-level list fetch errors */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load assignments</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      )}

      <AssignmentTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onDelete={handleDeleteAssignment}
      />

      <CreateAssignmentSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createAssignment}
      />
    </div>
  )
}
