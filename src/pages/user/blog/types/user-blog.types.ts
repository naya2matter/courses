// ─── User Blog Types ───────────────────────────────────────────────────────────
// TypeScript shapes for the public blog / podcast feed API responses.
// These map to the Laravel BlogPostResource and BlogPostDetailResource shapes.

// Re-export ApiError from the shared client so callers have a single import.
export type { ApiError } from "@/lib/api"

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

// ── Embedded resource shapes ──────────────────────────────────────────────────

export interface BlogAuthor {
  id: number
  name: string
}

export interface BlogVideoQuality {
  id: number
  quality: string      // "360p" | "720p" | "1080p"
  file_size: number    // bytes
  stream_url: string   // signed URL
}

export interface BlogMedia {
  type: "audio" | "video"
  id: number
  name: string
  duration: number | null
  thumbnail_url: string | null
  stream_url: string
  qualities?: BlogVideoQuality[]   // video only; empty/absent = no variants
  subtitle_url?: string | null     // video only; VTT public URL
}

export interface BlogComment {
  id: number
  body: string
  created_at: string
  author: BlogAuthor
}

// ── Primary resource shapes ───────────────────────────────────────────────────

/** One item returned in the public feed list (GET /user/blog-posts/getAll). */
export interface PublicBlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  status: "published"
  published_at: string
  tags: string[]
  has_media: boolean
  media_type: "Video" | "Audio" | null
  like_count: number
  comment_count: number
  author: BlogAuthor
  created_at: string
}

/**
 * Full post detail returned by GET /user/blog-posts/getBySlug/{slug}.
 * Extends the feed item with full body, media, and interaction fields.
 * `is_liked` is only present when a valid user token is forwarded.
 */
export interface PublicBlogPostDetail extends PublicBlogPost {
  description: string | null
  media: BlogMedia | null
  is_liked?: boolean
  comments: BlogComment[]
  updated_at: string
}

// ── Interaction response shapes ─────────────────────────────────────────────

/** Returned by POST /user/blog-posts/like/{id} and DELETE /user/blog-posts/unlike/{id}. */
export interface BlogLikeResponse {
  like_count: number
  is_liked: boolean
}

/** Returned by POST /user/blog-posts/comment/{id}. */
export interface BlogCommentResponse {
  data: BlogComment
}

// ── Query / filter shapes ─────────────────────────────────────────────────────

export interface PublicBlogFilters {
  page?: number
  per_page?: number
}

// ── API response envelopes ────────────────────────────────────────────────────

export interface PublicBlogFeedResponse {
  data: PublicBlogPost[]
  links: PaginationLinks
  meta: PaginationMeta
}

export interface PublicBlogDetailResponse {
  data: PublicBlogPostDetail
}
