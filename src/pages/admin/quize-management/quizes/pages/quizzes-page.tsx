// ─── Quizzes Page ─────────────────────────────────────────────────────────────
// Main quiz management list page with filters, stats, and paginated table.

import { XIcon, Loader2Icon, PlusIcon, ClipboardListIcon, CheckCircleIcon, ArchiveIcon, FileEditIcon, AlertCircleIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useQuizzes } from "../hook/use-quizzes"
import { QuizTable } from "../components/quiz-table"
import type { QuizStatus } from "../types/quiz.types"

// ── Pagination ────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number
  lastPage: number
  isLoading: boolean
  onPage: (page: number) => void
}

function Pagination({ currentPage, lastPage, isLoading, onPage }: PaginationProps) {
  if (lastPage <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {lastPage}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPage(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage || isLoading}
          onClick={() => onPage(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// ── Page component ────────────────────────────────────────────────────────────

export function QuizzesPageContent() {
  const { items, meta, isLoading, error, filters, fetchQuizzes, setFilters, clearError } =
    useQuizzes()

  // ── Stats derived from the current page items ─────────────────────────────
  const total = meta?.total ?? items.length
  const publishedCount = items.filter((q) => q.status === "published").length
  const draftCount = items.filter((q) => q.status === "draft").length
  const archivedCount = items.filter((q) => q.status === "archived").length

  const summaryItems = [
    { key: "total", title: "Total Quizzes", value: total, Icon: ClipboardListIcon, color: "text-indigo-400" },
    { key: "published", title: "Published", value: publishedCount, Icon: CheckCircleIcon, color: "text-emerald-400" },
    { key: "draft", title: "Draft", value: draftCount, Icon: FileEditIcon, color: "text-amber-400" },
    { key: "archived", title: "Archived", value: archivedCount, Icon: ArchiveIcon, color: "text-slate-400" },
  ]

  function handleStatusChange(value: string) {
    setFilters({ status: value === "all" ? "" : (value as QuizStatus) })
  }

  function handlePageChange(page: number) {
    fetchQuizzes({ ...filters, page })
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Management</h1>
          <p className="mt-1 text-muted-foreground">
            Browse, create, and manage all quizzes in the system.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="w-fit">
            <Link to="/admin/quiz-management/quizzes/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
          <Button
            onClick={() => fetchQuizzes()}
            disabled={isLoading}
            variant="outline"
            className="w-fit"
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary strip ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {summaryItems.map(({ key, title, value, Icon, color }) => (
          <div key={key} className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/10">
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {title}
            </p>
          </div>
        ))}
      </section>

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive" className="relative pr-10">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <button
            onClick={clearError}
            className="absolute right-3 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            aria-label="Dismiss error"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filters.status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({ status: "" })}
            className="h-9 gap-1.5 text-muted-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filter
          </Button>
        )}

        {meta && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} quiz{meta.total !== 1 ? "zes" : ""} total
          </span>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <QuizTable
        quizzes={items}
        isLoading={isLoading}
        onDeleted={() => fetchQuizzes(filters)}
      />

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          isLoading={isLoading}
          onPage={handlePageChange}
        />
      )}
    </div>
  )
}
