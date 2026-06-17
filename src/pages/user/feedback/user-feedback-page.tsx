// ─── User Feedback Page ───────────────────────────────────────────────────────
// User-facing page to view, filter, and submit feedback.

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { PlusIcon, AlertCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"
import { PageHeader } from "@/components/user/page-header"
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
      <PageHeader
        title="My Feedback"
        description="Submit ideas, suggestions, or feature requests. Track admin responses here."
        onRefresh={() => fetchFeedback()}
        refreshing={isLoading}
        actions={
          <Button onClick={() => setSubmitOpen(true)} className="w-fit">
            <PlusIcon className="mr-2 h-4 w-4" />
            Submit Feedback
          </Button>
        }
      />

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
