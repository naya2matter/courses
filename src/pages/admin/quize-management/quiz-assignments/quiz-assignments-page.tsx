// ─── Quiz Assignments Page ────────────────────────────────────────────────────
// Implements list, create, and delete for quiz assignments.

import { useState } from "react"
import {
  AlertCircleIcon,
  ClipboardCheckIcon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"

import { useQuizAssignment } from "./hook/use-quiz-assignment"
import { QuizAssignmentTable } from "./components/quiz-assignment-table"
import { CreateQuizAssignmentSheet } from "./components/create-quiz-assignment-sheet"

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  colorClass: string
}

function StatCard({ icon: Icon, label, value, colorClass }: StatCardProps) {
  return (
    <div className="flex flex-col items-center text-center rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 border border-white/10 mb-3">
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <p className="text-4xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function QuizAssignmentsPageContent() {
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
  } = useQuizAssignment()

  const [createOpen, setCreateOpen] = useState(false)

  // Unique quiz/user counts from the current page.
  const uniqueQuizCount = new Set(items.map((a) => a.quiz?.id ?? a.quiz_id).filter(Boolean)).size
  const uniqueUserCount = new Set(items.map((a) => a.user?.id).filter(Boolean)).size

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
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Assignments</h1>
          <p className="mt-1 text-muted-foreground">
            Assign quizzes to users and manage existing assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} disabled={isLoading}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Assign Quiz
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchAssignments()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCwIcon className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      {(meta?.total ?? items.length) > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            icon={ClipboardCheckIcon}
            label="Total Assignments"
            value={meta?.total ?? items.length}
            colorClass="text-indigo-400"
          />
          <StatCard
            icon={ClipboardCheckIcon}
            label="Quizzes Assigned"
            value={uniqueQuizCount}
            colorClass="text-violet-400"
          />
          <StatCard
            icon={UsersIcon}
            label="Assigned Users"
            value={uniqueUserCount}
            colorClass="text-sky-400"
          />
        </section>
      )}

      {/* ── Error banner ───────────────────────────────────────────────────── */}
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

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <QuizAssignmentTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onDelete={handleDeleteAssignment}
      />

      {/* ── Create sheet ───────────────────────────────────────────────────── */}
      <CreateQuizAssignmentSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createAssignment}
      />
    </div>
  )
}
