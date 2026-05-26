// ─── User Feedback Page ───────────────────────────────────────────────────────
// User-facing page to view, filter, and submit feedback.

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, Loader2Icon, AlertCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { getMyFeedback } from "./service/user-feedback.service"
import type { PaginationMeta, UserFeedback, UserFeedbackFilters } from "./types/user-feedback.types"
import { UserFeedbackSummaryCards } from "./components/user-feedback-summary-cards"
import { UserFeedbackTable } from "./components/user-feedback-table"
import { SubmitFeedbackDialog } from "./components/submit-feedback-dialog"

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: UserFeedbackFilters = { page: 1, per_page: 15 }

// ── Page component ────────────────────────────────────────────────────────────

export function UserFeedbackPage() {
  const [items, setItems] = useState<UserFeedback[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [filters, setFiltersState] = useState<UserFeedbackFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchFeedback = useCallback(async (overrideFilters?: UserFeedbackFilters) => {
    const active = overrideFilters ?? filters
    setIsLoading(true)
    setError(null)

    try {
      const res = await getMyFeedback(active)
      setItems(res.data)
      setMeta(res.meta)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      let message = "Failed to load feedback. Please try again."
      if (isApiError(err)) {
        message = err.status === 401
          ? "You are not authenticated. Please log in again."
          : err.message || message
      } else if (err instanceof Error) {
        message = err.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchFeedback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Filter change handler ─────────────────────────────────────────────────

  function handleFilterChange(partial: Partial<UserFeedbackFilters>) {
    const next: UserFeedbackFilters = { ...filters, ...partial, page: partial.page ?? 1 }
    setFiltersState(next)
    fetchFeedback(next)
  }

  function handleClearAll() {
    const next = DEFAULT_FILTERS
    setFiltersState(next)
    fetchFeedback(next)
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Feedback</h1>
          <p className="mt-1 text-muted-foreground">
            Submit ideas, suggestions, or feature requests. Track admin responses here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setSubmitOpen(true)} className="w-fit">
            <PlusIcon className="mr-2 h-4 w-4" />
            Submit Feedback
          </Button>
          <Button
            variant="outline"
            className="w-fit"
            disabled={isLoading}
            onClick={() => fetchFeedback()}
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <UserFeedbackSummaryCards items={items} total={meta?.total} />

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
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
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Table / mobile cards ─────────────────────────────────────────────── */}
      <UserFeedbackTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
      />

      {/* ── Submit dialog ────────────────────────────────────────────────────── */}
      <SubmitFeedbackDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onCreated={() => {
          toast.success("Feedback submitted successfully.")
          fetchFeedback()
        }}
      />
    </div>
  )
}
