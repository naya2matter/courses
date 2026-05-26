// ─── Resend Login Links — Page ────────────────────────────────────────────────

import { Loader2Icon, AlertCircleIcon, XIcon, CheckCircle2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useResendLinks } from "../hook/use-resend-links"
import { ResendLinksSummaryCards } from "../components/resend-links-summary-cards"
import { ResendLinksTable } from "../components/resend-links-table"

export function ResendLinksPageContent() {
  const {
    items,
    meta,
    isLoading,
    error,
    filters,
    fetchExpiredLinks,
    setFilters,
    clearError,
  } = useResendLinks()

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resend Login Links</h1>
          <p className="mt-1 text-muted-foreground">
            Course assignments where the user's login link has expired or was never sent.
            Resend a fresh 72-hour link directly from this page.
          </p>
        </div>
        <Button
          variant="outline"
          className="w-fit"
          disabled={isLoading}
          onClick={() => fetchExpiredLinks(filters.page)}
        >
          {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Refresh
        </Button>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <ResendLinksSummaryCards items={items} total={meta?.total} />

      {/* ── Empty state (all links valid) ────────────────────────────────────── */}
      {!isLoading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 py-12 text-center">
          <CheckCircle2Icon className="h-10 w-10 text-emerald-400" />
          <div>
            <p className="font-semibold text-emerald-400">All links are valid</p>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no expired or unsent login links right now.
            </p>
          </div>
        </div>
      )}

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

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      {(isLoading || items.length > 0) && (
        <ResendLinksTable
          items={items}
          meta={meta}
          isLoading={isLoading}
          filters={filters}
          onPageChange={(page) => fetchExpiredLinks(page)}
          onFilterChange={(partial) => setFilters(partial)}
          onClearAll={() => {
            setFilters({ linkStatus: undefined, search: undefined, page: 1 })
          }}
          onMutated={() => fetchExpiredLinks(1)}
        />
      )}
    </div>
  )
}
