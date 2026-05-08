// ─── Audio Categories Page ────────────────────────────────────────────────────
// Full-featured page for managing audio categories.
// Responsibilities:
//   • Fetch the list via the Zustand store on mount (handled by useCategory hook)
//   • Show a top-level error banner when the list fetch fails
//   • Render the CategoryTable which handles inline edit/delete
//   • Provide a "Create Category" button that opens the CategoryFormSheet

import { AlertCircleIcon, XIcon, Loader2Icon, RefreshCwIcon, PlusIcon, FileMusicIcon, BookOpen, Activity, Clock } from "lucide-react"
import { useRef } from "react"
import type { CategoryTableHandle } from "./components/category-table"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useCategory } from "./hook/use-category"
import { CategoryTable } from "./components/category-table"

export default function AudioCategoriesPage() {
  // Pull everything we need from the custom hook (backed by Zustand)
  const {
    items,
    summaryCards,
    isLoading,
    error,
    clearError,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategory()

  const totalCategories = items.length
  const sortedCategories = items.filter(
    (category) => typeof category.sort_order === "number" && category.sort_order >= 0,
  ).length
  const unsortedCategories = totalCategories - sortedCategories

  const getSummaryIcon = (key: string) => {
    switch (key) {
      case "total_categories":
        return FileMusicIcon
      case "total_audios":
        return BookOpen
      case "active_categories":
        return Activity
      default:
        return Clock
    }
  }

  // Ref to control the child table's imperative API (open create/edit sheet)
  const tableRef = useRef<CategoryTableHandle | null>(null)

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audio Categories</h1>
          <p className="mt-1 text-muted-foreground">
            Manage all audio categories used to organise audio content.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Create category button — opens the create sheet inside the table */}
          <Button
            onClick={() => tableRef.current?.openCreate()}
            disabled={isLoading}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Category
          </Button>

          {/* Manual refresh — triggers a re-fetch of the full list */}
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

      {/* ── Summary strip (icon-first, no shadows) ─────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-center">
        {(summaryCards.length > 0 ? summaryCards : [
          { key: "total_categories", title: "Total Categories", value: totalCategories },
          { key: "total_audios", title: "Total Audios", value: sortedCategories },
          { key: "active_categories", title: "Categories With Audio", value: unsortedCategories },
        ]).map((card) => {
          const Icon = getSummaryIcon(card.key)
          return (
            <div key={card.key} className="flex flex-col items-center text-center rounded-3xl  p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/6 mb-2">
                <Icon className="size-6 text-sky-400" />
              </div>
              <p className="text-4xl font-semibold tabular-nums text-foreground">{card.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {card.title}
              </p>
            </div>
          )
        })}
      </section>

      {/* ── Top-level fetch error banner ─────────────────────────────────────── */}
      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <div className="flex w-full items-start justify-between gap-2">
            <div>
              <AlertTitle>Failed to load categories</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            {/* Dismiss button — clears the error from the store */}
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

      {/* ── Category table with inline create / edit / delete ────────────────── */}
      <CategoryTable
        ref={tableRef}
        items={items}
        isLoading={isLoading}
        onRefetch={fetchCategories}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
    </div>
  )
}
