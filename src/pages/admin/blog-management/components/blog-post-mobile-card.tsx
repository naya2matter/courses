// ─── BlogPostMobileCard ───────────────────────────────────────────────────────
// Single card for the mobile (< md) layout in the blog table.

import { EllipsisVerticalIcon, HeartIcon, MessageSquareIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BlogStatusBadge } from "./shared/blog-status-badge"
import { BlogMediaBadge } from "./shared/blog-media-badge"
import type { BlogPost } from "../types/blog.types"

interface BlogPostMobileCardProps {
  post: BlogPost
  onView: () => void
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function BlogPostMobileCard({
  post,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: BlogPostMobileCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {post.thumbnail_url ? (
          <img
            src={post.thumbnail_url}
            alt={post.title}
            className="h-12 w-12 rounded-lg object-cover shrink-0 border border-white/10"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-white/5 border border-white/10 shrink-0 flex items-center justify-center text-muted-foreground text-[10px]">
            No img
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-2">
            {post.title}
          </p>
          {post.excerpt && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {post.excerpt}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <EllipsisVerticalIcon className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onView}>View Details</DropdownMenuItem>
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleStatus}>
              {post.status === "published" ? "Move to Draft" : "Publish"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        <BlogStatusBadge status={post.status} />
        <BlogMediaBadge mediaType={post.media_type} />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Author</span>
          <p className="text-foreground truncate">{post.author.name}</p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Published</span>
          <p className="text-foreground">{formatShortDate(post.published_at)}</p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-widest text-[10px]">Slug</span>
          <p className="text-foreground truncate font-mono">{post.slug}</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-rose-400">
            <HeartIcon className="h-3 w-3" />
            {post.like_count}
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <MessageSquareIcon className="h-3 w-3" />
            {post.comment_count}
          </span>
        </div>
      </div>
    </div>
  )
}
