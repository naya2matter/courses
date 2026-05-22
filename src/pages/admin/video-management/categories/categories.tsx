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
          <h1 className="text-3xl font-bold tracking-tight">Video Categories</h1>
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

      {/* ── Summary strip ────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {displayCards.map((card) => {
          const Icon = getSummaryIcon(card.key)
          return (
            <div
              key={card.key}
              className="flex flex-col items-center text-center rounded-3xl p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/6 mb-2">
                <Icon className="size-6 text-sky-400" />
              </div>
              <p className="text-4xl font-semibold tabular-nums text-foreground">
                {card.value}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {card.title}
              </p>
            </div>
          )
        })}
      </section>

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
