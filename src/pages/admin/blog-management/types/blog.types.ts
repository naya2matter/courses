// ─── Blog Management Types ─────────────────────────────────────────────────────
// Defines all TypeScript shapes for the Admin Blog Management feature.
//   • API response types (list + single resource)
//   • Request payload types (create / update)
//   • Filter params used when fetching the list
//   • Standard Laravel pagination envelope
//   • Available media resource types
//   • API validation error shape

// ── Enum-like literals ────────────────────────────────────────────────────────

export type BlogPostStatus = "draft" | "published"

export type MediableType = "App\\Models\\Video" | "App\\Models\\Audio"

// ── Embedded resource shapes ──────────────────────────────────────────────────

/**
 * Compact author reference embedded in blog post responses.
 */
export interface BlogAuthor {
  id: number
  name: string
}

/**
 * Media attachment embedded in the post detail response.
 * Includes a signed stream URL valid for 4 hours.
 */
export interface BlogPostMedia {
  type: "video" | "audio"
  id: number
  stream_url: string
}

/**
 * Compact comment shape embedded in the post detail response.
 */
export interface BlogComment {
  id: number
  body: string
  created_at: string
  author: BlogAuthor
}

// ── Primary resource shapes ───────────────────────────────────────────────────

/**
 * A single blog post as returned in the paginated feed list.
 * Maps to the backend BlogPostResource (list context).
 */
export interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string | null
  thumbnail_url: string | null
  status: BlogPostStatus
  published_at: string | null
  tags: string[]
  has_media: boolean
  media_type: "Video" | "Audio" | null
  like_count: number
  comment_count: number
  author: BlogAuthor
  created_at: string
  updated_at: string
}

/**
 * Full blog post detail as returned by the single-post endpoint.
 * Extends the list shape with description, full media object, and comments.
 */
export interface BlogPostDetail extends BlogPost {
  description: string | null
  media: BlogPostMedia | null
  is_liked: boolean
  comments: BlogComment[]
}

// ── Available media resource shapes ──────────────────────────────────────────

/**
 * A transcoded video available for attachment to a blog post.
 * Returned by GET /admin/blog-posts/available-videos.
 */
export interface AvailableVideo {
  id: number
  title: string
  duration?: number | null
  thumbnail_url?: string | null
}

/**
 * A processed audio file available for attachment to a blog post.
 * Returned by GET /admin/blog-posts/available-audios.
 */
export interface AvailableAudio {
  id: number
  title: string
  duration?: number | null
}

// ── Laravel paginated envelope ────────────────────────────────────────────────

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

/** Paginated list response for GET /admin/blog-posts */
export interface BlogPostListResponse {
  data: BlogPost[]
  meta: PaginationMeta
  links: PaginationLinks
}

/** Single resource response for GET /admin/blog-posts/{id} */
export interface BlogPostDetailResponse {
  data: BlogPostDetail
}

/** List response for available-videos / available-audios */
export interface AvailableVideosResponse {
  data: AvailableVideo[]
}

export interface AvailableAudiosResponse {
  data: AvailableAudio[]
}

// ── Request payload types ─────────────────────────────────────────────────────

/**
 * Payload for POST /admin/blog-posts and PUT /admin/blog-posts/{id}.
 *
 * When `thumbnail` is provided the caller must use multipart/form-data
 * (use the `postForm` / `putForm` helpers).  All other fields are optional
 * on update.
 *
 * Constraints (mirrors backend validation):
 *   title        — required on create, max 255 chars
 *   slug         — optional, ^[a-z0-9-]+$
 *   excerpt      — optional, max 500 chars
 *   description  — optional, rich text
 *   status       — "draft" | "published"
 *   tags         — array of strings (each max 50 chars)
 *   mediable_type — required when mediable_id is set
 *   mediable_id   — integer ≥ 1, required when mediable_type is set
 *   thumbnail    — optional file, max 4 MB (triggers multipart upload)
 */
export interface BlogPostPayload {
  title?: string
  slug?: string
  excerpt?: string
  description?: string
  status?: BlogPostStatus
  tags?: string[]
  mediable_type?: MediableType | null
  mediable_id?: number | null
  thumbnail?: File
}

// ── Filter params ─────────────────────────────────────────────────────────────

/**
 * Query parameters accepted by GET /admin/blog-posts.
 * All fields are optional — omitting them returns page 1 with the
 * default server per_page value.
 */
export interface BlogPostFilters {
  page?: number
  per_page?: number
}

// ── Error types ───────────────────────────────────────────────────────────────

/**
 * Shape of a Laravel 422 Unprocessable Entity response.
 * The `errors` map has field names as keys and arrays of messages as values.
 */
export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}
