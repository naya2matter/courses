// ─── Feedback Page ────────────────────────────────────────────────────────────
// Admin page for viewing, responding to, and managing user feedback.

import { Loader2Icon, AlertCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFeedback } from "../hook/use-feedback"
import { FeedbackTable } from "../components/feedback-table"
import { FeedbackSummaryCards } from "../components/feedback-summary-cards"

// ── Page component ────────────────────────────────────────────────────────────

export function FeedbackPageContent() {
  const { items, meta, isLoading, error, filters, fetchFeedback, setFilters, clearError } =
    useFeedback()

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
          <p className="mt-1 text-muted-foreground">
            Review, respond to, and manage feedback submitted by users.
          </p>
        </div>
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

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <FeedbackSummaryCards items={items} total={meta?.total} />

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
              onClick={clearError}
              aria-label="Dismiss error"
            >
              <XIcon className="size-3.5" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ── Table / mobile cards ─────────────────────────────────────────────── */}
      <FeedbackTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onMutated={() => fetchFeedback()}
      />
    </div>
  )
}
