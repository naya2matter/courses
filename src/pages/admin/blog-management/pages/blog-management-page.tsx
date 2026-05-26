// ─── Blog Management Page ─────────────────────────────────────────────────────
// Admin page for creating, publishing, attaching media, and managing blog posts.

import { useNavigate } from "react-router-dom"
import { PlusIcon, Loader2Icon, AlertCircleIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useBlogPosts } from "../hook/use-blog-posts"
import { BlogSummaryCards } from "../components/blog-summary-cards"
import { BlogPostTable } from "../components/blog-post-table"

export function BlogManagementPageContent() {
  const navigate = useNavigate()
  const {
    items,
    meta,
    isLoading,
    error,
    filters,
    fetchBlogPosts,
    setFilters,
    clearError,
  } = useBlogPosts()

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="mt-1 text-muted-foreground">
            Create, publish, attach media, and manage blog posts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate("/admin/blog-management/blog/create")}
            className="w-fit"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Post
          </Button>
          <Button
            variant="outline"
            className="w-fit"
            disabled={isLoading}
            onClick={() => fetchBlogPosts()}
          >
            {isLoading && (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary cards ────────────────────────────────────────────────────── */}
      <BlogSummaryCards items={items} total={meta?.total} />

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

      {/* ── Table / mobile cards ──────────────────────────────────────────────── */}
      <BlogPostTable
        items={items}
        meta={meta}
        isLoading={isLoading}
        filters={filters}
        onFilterChange={setFilters}
        onMutated={() => fetchBlogPosts()}
      />

    </div>
  )
}
