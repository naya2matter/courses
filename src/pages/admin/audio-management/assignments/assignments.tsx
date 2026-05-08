// ─── Audio Assignments Page ─────────────────────────────────────────────────
// Implements list/create/delete for audio assignments.

import { useState } from "react"
import { AlertCircleIcon, Loader2Icon, PlusIcon, RefreshCwIcon, XIcon, FileMusicIcon, Users, Layers } from "lucide-react"

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
    summaryCards,
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

  function getSummaryIcon(key: string) {
    switch (key) {
      case "total_audio_assignments":
        return FileMusicIcon
      case "assigned_users":
        return Users
      case "assigned_audios":
        return Layers
      default:
        return FileMusicIcon
    }
  }

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

      {summaryCards.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {summaryCards.map((card) => {
            const Icon = getSummaryIcon(card.key)
            return (
              <div key={card.key} className="flex flex-col items-center text-center rounded-3xl  p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border mb-2 border-white/6 ">
                  <Icon className="size-6 text-sky-400" />
                </div>
                <p className="text-4xl font-semibold tabular-nums text-foreground">{card.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {card.title}
                </p>
              </div>
            )
          })}
        </section>
      )}

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
