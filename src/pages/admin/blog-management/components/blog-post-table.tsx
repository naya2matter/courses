// ─── BlogPostTable ────────────────────────────────────────────────────────────
// Orchestrator: filters toolbar, desktop table, mobile cards, pagination,
// and all dialogs/drawers for the blog management feature.

import { useMemo, useState } from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  FileTextIcon,
  HeartIcon,
  MessageSquareIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom"
import type { BlogPost, BlogPostFilters, PaginationMeta } from "../types/blog.types"
import { BlogFiltersToolbar, type MediaFilter } from "./blog-filters-toolbar"
import { BlogStatusBadge } from "./shared/blog-status-badge"
import { BlogMediaBadge } from "./shared/blog-media-badge"
import { BlogPostMobileCard } from "./blog-post-mobile-card"
import { DeleteBlogPostDialog } from "./delete-blog-post-dialog"
import { ToggleStatusDialog } from "./toggle-status-dialog"
import type { BlogPostStatus } from "../types/blog.types"

// ── Types ─────────────────────────────────────────────────────────────────────

interface BlogPostTableProps {
  items: BlogPost[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: BlogPostFilters
  onFilterChange: (f: Partial<BlogPostFilters>) => void
  onMutated: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const SKELETON_ROWS = 8

function TruncatedCell({
  text,
  maxWidth = "max-w-[180px]",
}: {
  text: string
  maxWidth?: string
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`block truncate ${maxWidth} cursor-default`}>
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs wrap-break-word">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BlogPostTable({
  items,
  meta,
  isLoading,
  filters,
  onFilterChange,
  onMutated,
}: BlogPostTableProps) {
  const navigate = useNavigate()
  // ── Client-side filters ────────────────────────────────────────────────────
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | "all">("all")
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all")

  const displayedItems = useMemo(() => {
    return items.filter((p) => {
      // Search: title / excerpt / (description not in list shape)
      if (searchValue) {
        const q = searchValue.toLowerCase()
        const match =
          p.title.toLowerCase().includes(q) ||
          (p.excerpt ?? "").toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
        if (!match) return false
      }
      // Status filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      // Media filter
      if (mediaFilter === "text" && p.has_media) return false
      if (mediaFilter === "video" && p.media_type !== "Video") return false
      if (mediaFilter === "audio" && p.media_type !== "Audio") return false
      return true
    })
  }, [items, searchValue, statusFilter, mediaFilter])

  const hasActiveFilters =
    !!searchValue || statusFilter !== "all" || mediaFilter !== "all"

  function clearAll() {
    setSearchValue("")
    setStatusFilter("all")
    setMediaFilter("all")
  }

  // ── Pagination ─────────────────────────────────────────────────────────────
  const currentPage = meta?.current_page ?? 1
  const lastPage = meta?.last_page ?? 1

  function prevPage() {
    if (currentPage > 1) onFilterChange({ page: currentPage - 1 })
  }
  function nextPage() {
    if (currentPage < lastPage) onFilterChange({ page: currentPage + 1 })
  }

  const resultCount =
    meta && !hasActiveFilters
      ? { from: meta.from ?? 0, to: meta.to ?? 0, total: meta.total ?? 0 }
      : null

  function openDetail(post: BlogPost) {
    navigate(`/admin/blog-management/blog/${post.id}`)
  }

  function openEdit(post: BlogPost) {
    navigate(`/admin/blog-management/blog/edit/${post.id}`)
  }

  // ── Toggle status dialog ───────────────────────────────────────────────────
  const [toggleTarget, setToggleTarget] = useState<BlogPost | null>(null)
  const [toggleOpen, setToggleOpen] = useState(false)

  function openToggle(post: BlogPost) {
    setToggleTarget(post)
    setToggleOpen(true)
  }

  // ── Delete dialog ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function openDelete(post: BlogPost) {
    setDeleteTarget(post)
    setDeleteOpen(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <BlogFiltersToolbar
        searchValue={searchValue}
        statusFilter={statusFilter}
        mediaFilter={mediaFilter}
        perPage={filters.per_page ?? 15}
        resultCount={resultCount}
        onSearchChange={setSearchValue}
        onStatusChange={setStatusFilter}
        onMediaChange={setMediaFilter}
        onPerPageChange={(v) => onFilterChange({ per_page: v, page: 1 })}
        onClearAll={clearAll}
      />

      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Thumb</TableHead>
              <TableHead className="min-w-50">Title</TableHead>
              <TableHead className="hidden lg:table-cell min-w-35">Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Media</TableHead>
              <TableHead className="hidden xl:table-cell">Author</TableHead>
              <TableHead className="w-16 text-right">Likes</TableHead>
              <TableHead className="w-20 text-right">Comments</TableHead>
              <TableHead className="hidden lg:table-cell">Published</TableHead>
              <TableHead className="hidden xl:table-cell">Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32 mt-1.5" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                    <FileTextIcon className="h-8 w-8 opacity-30" />
                    <p className="text-sm">
                      {hasActiveFilters
                        ? "No posts match your filters."
                        : "No blog posts yet."}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearAll}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedItems.map((post) => (
                <TableRow key={post.id}>
                  {/* Thumbnail */}
                  <TableCell>
                    {post.thumbnail_url ? (
                      <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        className="h-10 w-10 rounded-lg object-cover border border-white/10"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>

                  {/* Title + excerpt */}
                  <TableCell className="max-w-65">
                    <p className="font-medium line-clamp-1">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </p>
                    )}
                  </TableCell>

                  {/* Slug */}
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                    <TruncatedCell text={post.slug} maxWidth="max-w-[140px]" />
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <BlogStatusBadge status={post.status} />
                  </TableCell>

                  {/* Media */}
                  <TableCell>
                    <BlogMediaBadge mediaType={post.media_type} />
                  </TableCell>

                  {/* Author */}
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {post.author.name}
                  </TableCell>

                  {/* Likes */}
                  <TableCell className="text-right text-sm tabular-nums">
                    <span className="flex items-center justify-end gap-1 text-rose-400">
                      <HeartIcon className="h-3 w-3" />
                      {post.like_count}
                    </span>
                  </TableCell>

                  {/* Comments */}
                  <TableCell className="text-right text-sm tabular-nums">
                    <span className="flex items-center justify-end gap-1 text-sky-400">
                      <MessageSquareIcon className="h-3 w-3" />
                      {post.comment_count}
                    </span>
                  </TableCell>

                  {/* Published At */}
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(post.published_at)}
                  </TableCell>

                  {/* Updated At */}
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(post.updated_at)}
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                          <span className="sr-only">Row actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => openDetail(post)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(post)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openToggle(post)}>
                          {post.status === "published"
                            ? "Move to Draft"
                            : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => openDelete(post)}
                          className="text-destructive focus:text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <FileTextIcon className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {hasActiveFilters
                ? "No posts match your filters."
                : "No blog posts yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          displayedItems.map((post) => (
            <BlogPostMobileCard
              key={post.id}
              post={post}
              onView={() => openDetail(post)}
              onEdit={() => openEdit(post)}
              onToggleStatus={() => openToggle(post)}
              onDelete={() => openDelete(post)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {!isLoading && meta && lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {currentPage} of {lastPage}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPage}
              disabled={currentPage >= lastPage}
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Dialogs ────────────────────────────────────────────────────────── */}

      <ToggleStatusDialog
        post={toggleTarget}
        open={toggleOpen}
        onOpenChange={(next) => {
          if (!next) setToggleTarget(null)
          setToggleOpen(next)
        }}
        onUpdated={() => {
          setToggleOpen(false)
          onMutated()
        }}
      />

      <DeleteBlogPostDialog
        post={deleteTarget}
        open={deleteOpen}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
          setDeleteOpen(next)
        }}
        onDeleted={() => {
          setDeleteOpen(false)
          onMutated()
        }}
      />
    </div>
  )
}
