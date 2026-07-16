// ─── Bug Reports Page ─────────────────────────────────────────────────────────
// Admin page for tracking, assigning, prioritizing, and resolving bug reports.

import { useState } from "react"
import {
  PlusIcon,
  Loader2Icon,
  AlertCircleIcon,
  XIcon,
  ExternalLinkIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useBugReports } from "../hook/use-bug-reports"
import { BugReportTable } from "../components/bug-report-table"
import { BugReportFormDialog } from "../components/bug-report-form-dialog"
import { BugReportSummaryCards } from "../components/bug-report-summary-cards"

// ── Page component ────────────────────────────────────────────────────────────

export function BugReportsPageContent() {
  const { items, meta, isLoading, error, filters, fetchBugReports, setFilters, clearError } =
    useBugReports()

  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bug Reports</h1>
          <p className="mt-1 text-muted-foreground">
            Track, assign, prioritize, and resolve reported issues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setCreateOpen(true)} className="w-fit">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Bug Report
          </Button>
          <Button variant="outline" asChild className="w-fit">
            <a
              href="https://tasks.rdexperts.tech/support-ticket"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Create Support Ticket
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-fit"
            disabled={isLoading}
            onClick={() => fetchBugReports()}
          >
            {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <BugReportSummaryCards items={items} total={meta?.total} />

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
      <BugReportTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onMutated={() => fetchBugReports()}
      />

      {/* ── Create dialog ────────────────────────────────────────────────────── */}
      <BugReportFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => fetchBugReports()}
      />
    </div>
  )
}
