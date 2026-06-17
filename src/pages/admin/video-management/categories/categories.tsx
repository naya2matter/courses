// ─── Video Categories Page ────────────────────────────────────────────────────
// Full-featured page for managing video categories.
// Responsibilities:
//   • Fetch the list via the Zustand store on mount (handled by useVideoCategory)
//   • Show a top-level error banner when the list fetch fails
//   • Render the CategoryTable which handles inline edit/delete, search, pagination
//   • Provide a "Create Category" button that opens the CategoryFormSheet

import { useRef } from "react"
import {
  AlertCircleIcon,
  XIcon,
  Loader2Icon,
  RefreshCwIcon,
  PlusIcon,
  VideoIcon,
  LayoutGridIcon,
  Activity,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useVideoCategory } from "./hook/use-category"
import { CategoryTable } from "./components/category-table"
import type { CategoryTableHandle } from "./components/category-table"

// ── Summary card icon map ─────────────────────────────────────────────────────

function getSummaryIcon(key: string) {
  switch (key) {
    case "total_categories":
      return LayoutGridIcon
    case "total_videos":
      return VideoIcon
    default:
      return Activity
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VideoCategoriesPage() {
  const {
    items,
    summaryCards,
    paginationMeta,
    isLoading,
    error,
    search,
    page,
    clearError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setSearch,
    setPage,
  } = useVideoCategory()

  const tableRef = useRef<CategoryTableHandle | null>(null)

  // Fallback cards derived from the current list when the API doesn't return them
  const displayCards =
    summaryCards.length > 0
      ? summaryCards
      : [
          { key: "total_categories", title: "Total Categories", value: items.length },
          { key: "total_videos", title: "Total Videos", value: 0 },
        ]

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Video Categories</h1>
            {displayCards.map((card) => {
              const Icon = getSummaryIcon(card.key)
              return (
                <span
                  key={card.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-muted/40 px-2.5 py-0.5 text-sm tabular-nums text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{card.value}</span>
                  {card.title}
                </span>
              )
            })}
          </div>
          <p className="mt-1 text-muted-foreground">
            Manage all video categories used to organise video content.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => tableRef.current?.openCreate()}
            disabled={isLoading}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Category
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchCategories()}
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

      {/* ── Top-level fetch error banner ──────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load categories</AlertTitle>
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

      {/* ── Category table with search / pagination / CRUD ────────────────────── */}
      <CategoryTable
        ref={tableRef}
        items={items}
        isLoading={isLoading}
        search={search}
        page={page}
        paginationMeta={paginationMeta}
        onRefetch={fetchCategories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        onSearch={setSearch}
        onPageChange={setPage}
      />
    </div>
  )
}
