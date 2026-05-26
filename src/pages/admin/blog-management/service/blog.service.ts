// ─── Blog Service ─────────────────────────────────────────────────────────────
// Handles all HTTP requests for the Admin Blog Management feature.
// The shared apiClient automatically attaches the Bearer token from localStorage.
//
// Error handling:
//   • 401 Unauthenticated — the ApiClient throws with err.status === 401;
//     callers / global error boundaries should redirect to login.
//   • 422 Validation — thrown with err.status === 422 and err.data typed as
//     ApiValidationError; callers can cast err.data to surface field errors.
//   • Aborted requests — if the caller cancels the fetch via AbortController,
//     the resulting AbortError is filtered out so stale-state updates are
//     skipped.
//
// File uploads:
//   • When the payload contains a `thumbnail` File, the request is sent as
//     multipart/form-data using apiClient.postForm / apiClient.putForm.
//   • For updates, Laravel method-spoofing (_method=PUT) is appended
//     automatically by apiClient.putForm.
//   • When no file is present a plain JSON request is sent instead.

import { apiClient } from "@/lib/api"
import type {
  AvailableAudio,
  AvailableAudiosResponse,
  AvailableVideo,
  AvailableVideosResponse,
  BlogPost,
  BlogPostDetail,
  BlogPostDetailResponse,
  BlogPostFilters,
  BlogPostListResponse,
  BlogPostPayload,
} from "../types/blog.types"

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Build a URLSearchParams-based query string from a BlogPostFilters object.
 * Only includes params that have actual values (skips undefined / null).
 */
function buildQuery(filters: BlogPostFilters): string {
  const params = new URLSearchParams()

  if (filters.page != null) {
    params.set("page", String(filters.page))
  }
  if (filters.per_page != null) {
    params.set("per_page", String(filters.per_page))
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Returns true when an error represents a fetch cancellation (AbortError).
 * Canceled requests should be silently ignored by callers.
 */
function isCanceledError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

/**
 * Build a FormData object from a BlogPostPayload.
 * Scalar fields are appended as strings; arrays (tags) are appended as
 * repeated entries; null values are appended as empty strings so Laravel
 * clears the field; File objects are appended directly.
 */
function buildFormData(payload: BlogPostPayload): FormData {
  const form = new FormData()

  if (payload.title !== undefined) {
    form.append("title", payload.title)
  }
  if (payload.slug !== undefined) {
    form.append("slug", payload.slug)
  }
  if (payload.excerpt !== undefined) {
    form.append("excerpt", payload.excerpt)
  }
  if (payload.description !== undefined) {
    form.append("description", payload.description)
  }
  if (payload.status !== undefined) {
    form.append("status", payload.status)
  }
  if (payload.tags !== undefined) {
    payload.tags.forEach((tag) => form.append("tags[]", tag))
  }
  // Only append these fields when they have real values.
  // Sending an empty string for mediable_type would fail the backend's Rule::in
  // validation because the API stack has no ConvertEmptyStringsToNull middleware.
  if (payload.mediable_type != null) {
    form.append("mediable_type", payload.mediable_type)
  }
  if (payload.mediable_id != null) {
    form.append("mediable_id", String(payload.mediable_id))
  }
  if (payload.thumbnail instanceof File) {
    form.append("thumbnail", payload.thumbnail)
  }

  return form
}

type RawAvailableVideo = {
  id: number
  title?: string | null
  name?: string | null
  duration?: number | null
  duration_seconds?: number | null
  thumbnail_url?: string | null
  thumbnail_path?: string | null
}

type RawAvailableAudio = {
  id: number
  title?: string | null
  name?: string | null
  duration?: number | null
}

type RawBlogPost = Omit<BlogPost, "media_type" | "has_media"> & {
  media_type?: "Video" | "Audio" | null
  has_media?: boolean
  mediable_type?: string | null
  mediable_id?: number | null
}

function normalizeVideo(item: RawAvailableVideo): AvailableVideo {
  return {
    id: item.id,
    title: item.title ?? item.name ?? `Video #${item.id}`,
    duration: item.duration ?? item.duration_seconds ?? null,
    thumbnail_url: item.thumbnail_url ?? item.thumbnail_path ?? null,
  }
}

function normalizeAudio(item: RawAvailableAudio): AvailableAudio {
  return {
    id: item.id,
    title: item.title ?? item.name ?? `Audio #${item.id}`,
    duration: item.duration ?? null,
  }
}

function normalizeMediaType(
  mediaType: RawBlogPost["media_type"],
  mediableType: RawBlogPost["mediable_type"],
): BlogPost["media_type"] {
  if (mediaType === "Video" || mediaType === "Audio") return mediaType
  if (!mediableType) return null
  if (mediableType.endsWith("\\Video") || mediableType === "Video") return "Video"
  if (mediableType.endsWith("\\Audio") || mediableType === "Audio") return "Audio"
  return null
}

function normalizeBlogPost(item: RawBlogPost): BlogPost {
  const media_type = normalizeMediaType(item.media_type, item.mediable_type)
  const has_media =
    item.has_media ??
    (item.mediable_id != null && item.mediable_id > 0) ??
    Boolean(media_type)

  return {
    ...item,
    media_type,
    has_media,
  }
}

// ── Empty pagination fallback ─────────────────────────────────────────────────

const EMPTY_LIST_RESPONSE: BlogPostListResponse = {
  data: [],
  meta: {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 15,
    to: null,
    total: 0,
    path: "",
  },
  links: { first: null, last: null, prev: null, next: null },
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * Fetch a paginated list of blog posts.
 * Endpoint: GET /admin/blog-posts/getAll
 *
 * Throws on 401 (unauthenticated) and 422 (validation).
 * AbortError is swallowed and an empty response is returned.
 */
export async function getBlogPosts(
  filters: BlogPostFilters = {},
): Promise<BlogPostListResponse> {
  try {
    const query = buildQuery(filters)
    const res = await apiClient.get<BlogPostListResponse>(
      `/admin/blog-posts/getAll${query}`,
    )
    return {
      ...res,
      data: (res.data as RawBlogPost[]).map(normalizeBlogPost),
    }
  } catch (err) {
    if (isCanceledError(err)) return EMPTY_LIST_RESPONSE
    throw err
  }
}

/**
 * Fetch a single blog post by its numeric ID.
 * Endpoint: GET /admin/blog-posts/getById/{id}
 *
 * Returns the inner `data` object (unwrapped from the Laravel envelope).
 */
export async function getBlogPostById(id: number): Promise<BlogPostDetail> {
  const res = await apiClient.get<BlogPostDetailResponse>(
    `/admin/blog-posts/getById/${id}`,
  )
  return res.data
}

/**
 * Create a new blog post.
 * Endpoint: POST /admin/blog-posts/create
 *
 * Uses multipart/form-data when `payload.thumbnail` is a File;
 * otherwise sends a plain JSON request.
 *
 * Returns the newly created BlogPostDetail (unwrapped).
 * Throws with status 422 when the backend returns validation errors.
 */
export async function createBlogPost(
  payload: BlogPostPayload & { title: string },
): Promise<BlogPost> {
  if (payload.thumbnail instanceof File) {
    const form = buildFormData(payload)
    const res = await apiClient.postForm<BlogPostDetailResponse>(
      "/admin/blog-posts/create",
      form,
    )
    return res.data
  }

  const { thumbnail: _thumbnail, ...jsonPayload } = payload
  const res = await apiClient.post<BlogPostDetailResponse>(
    "/admin/blog-posts/create",
    jsonPayload,
  )
  return res.data
}

/**
 * Update an existing blog post.
 * Endpoint: PUT /admin/blog-posts/update/{id}
 *
 * Uses multipart/form-data (with _method=PUT spoofing) when
 * `payload.thumbnail` is a File; otherwise sends a plain JSON PUT.
 *
 * Returns the updated BlogPostDetail (unwrapped).
 * Throws with status 422 when the backend returns validation errors.
 */
export async function updateBlogPost(
  id: number,
  payload: BlogPostPayload,
): Promise<BlogPost> {
  if (payload.thumbnail instanceof File) {
    const form = buildFormData(payload)
    const res = await apiClient.putForm<BlogPostDetailResponse>(
      `/admin/blog-posts/update/${id}`,
      form,
    )
    return res.data
  }

  const { thumbnail: _thumbnail, ...jsonPayload } = payload
  const res = await apiClient.put<BlogPostDetailResponse>(
    `/admin/blog-posts/update/${id}`,
    jsonPayload,
  )
  return res.data
}

/**
 * Delete a blog post by its ID.
 * Endpoint: DELETE /admin/blog-posts/delete/{id}
 *
 * Cascades to all associated comments and likes.
 * Returns void on success (backend responds 200 with no body or 204).
 */
export async function deleteBlogPost(id: number): Promise<void> {
  await apiClient.delete<void>(`/admin/blog-posts/delete/${id}`)
}

/**
 * Fetch all transcoded videos available for attachment to a blog post.
 * Endpoint: GET /admin/blog-posts/available-videos
 *
 * Returns an array of AvailableVideo objects (unwrapped from envelope).
 */
export async function getAvailableVideos(): Promise<AvailableVideo[]> {
  const res = await apiClient.get<AvailableVideosResponse>(
    "/admin/blog-posts/available-videos",
  )
  return (res.data as RawAvailableVideo[]).map(normalizeVideo)
}

/**
 * Fetch all processed audio files available for attachment to a blog post.
 * Endpoint: GET /admin/blog-posts/available-audios
 *
 * Returns an array of AvailableAudio objects (unwrapped from envelope).
 */
export async function getAvailableAudios(): Promise<AvailableAudio[]> {
  const res = await apiClient.get<AvailableAudiosResponse>(
    "/admin/blog-posts/available-audios",
  )
  return (res.data as RawAvailableAudio[]).map(normalizeAudio)
}
