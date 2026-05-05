// ─── Audio Page ───────────────────────────────────────────────────────────────
// Full-featured Audio Management page.
// Fetches items via the Zustand store, handles loading/error states,
// and renders the AudioTable component.

import { AlertCircleIcon, XIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isApiError } from "@/lib/api"

import { deleteAudio } from "../service/audio.service"
import { useAudio } from "../hook/use-audio"
import { AudioTable } from "../components/audio-table"

export function AudioPageContent() {
  const { items, meta, isLoading, error, filters, fetchAudio, setFilters, clearError } =
    useAudio()

  /**
   * Soft-delete an audio item by ID and re-fetch the current page.
   * Normalises API errors into plain Error objects so the table dialog can
   * display them without knowing about ApiError internals.
   */
  async function handleDeleteAudio(id: number) {
    try {
      await deleteAudio(id)
      // Refresh the list after a successful delete
      await fetchAudio()
    } catch (err) {
      // Ignore browser navigation cancellations — not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        return
      }

      if (isApiError(err)) {
        // Surface Laravel validation errors as readable messages
        if (err.status === 422 && err.data?.errors) {
          const first = Object.values(err.data.errors as Record<string, string[]>)[0]
          throw new Error(
            Array.isArray(first) && first.length > 0
              ? first[0]
              : "Validation error while deleting audio.",
          )
        }
        throw new Error(err.message || "Failed to delete audio.")
      }

      // Re-throw any other errors so the table dialog can show them
      throw err
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audio Management</h1>
          <p className="mt-1 text-muted-foreground">
            Browse and manage all audio content in the system.
          </p>
        </div>

        {/* Action buttons: Create + Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Navigate to the create audio form */}
          <Button asChild className="w-fit">
            <Link to="/admin/audio-management/audio/create">
              <PlusIcon className="mr-2 h-4 w-4" />
              Create Audio
            </Link>
          </Button>

          {/* Manual refresh triggers a re-fetch with the current filters */}
          <Button
            onClick={() => fetchAudio()}
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
      {/* Shown for real API/network errors; AbortError is never surfaced here */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            {/* Dismiss button so the user can clear the banner */}
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

      {/* ── Audio table ───────────────────────────────────────────────────────── */}
      {/* Always rendered; shows skeleton rows internally while loading */}
      <AudioTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onDeleteAudio={handleDeleteAudio}
      />
    </div>
  )
}
