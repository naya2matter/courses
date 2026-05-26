// ─── User Blog Service ────────────────────────────────────────────────────────
// HTTP calls for the public blog / podcast feed.
//
// Endpoints:
//   1. GET /user/blog-posts/getAll           → paginated published feed (no auth required)
//   2. GET /user/blog-posts/getBySlug/{slug} → post detail (no auth required; optional auth
//                                              enriches the response with is_liked for users)
//
// Auth behaviour:
//   • Both read endpoints are public; apiClient forwards the stored token (any role)
//     automatically so is_liked is populated when a user is signed in.
//   • If the request is rejected with 401 (e.g. expired token), the detail endpoint
//     is retried without auth so the public post is still displayed.
//   • Like / unlike / comment routes still require a valid user token.

import { apiClient, isApiError } from "@/lib/api"
import type {
  PublicBlogFeedResponse,
  PublicBlogDetailResponse,
  PublicBlogFilters,
  BlogLikeResponse,
  BlogCommentResponse,
} from "../types/user-blog.types"

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Returns true for fetch AbortController cancellations. */
function isCanceled(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

const EMPTY_FEED: PublicBlogFeedResponse = {
  data: [],
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: null,
    last_page: 1,
    per_page: 15,
    to: null,
    total: 0,
    path: "",
  },
}

// ── Unauthenticated fetch helper ──────────────────────────────────────────────

/**
 * Performs a plain GET without an Authorization header.
 * Used for the detail endpoint when no user token is available or after a 401.
 */
async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  })

  if (!res.ok) {
    const payload = await res.json().catch(() => ({ message: res.statusText }))
    if (res.status === 404) throw new Error("Post not found")
    if (res.status === 403) throw new Error("Access to media stream denied")
    throw new Error(
      payload?.message ?? `Request failed with status ${res.status}`,
    )
  }

  return res.json() as Promise<T>
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * GET /user/blog-posts/getAll
 *
 * Public feed — no authentication required.
 * Returns cancelled-request errors silently with an empty list.
 */
export async function getPublicBlogPosts(
  filters: PublicBlogFilters = {},
): Promise<PublicBlogFeedResponse> {
  const params = new URLSearchParams()
  if (filters.page != null) params.set("page", String(filters.page))
  if (filters.per_page != null) params.set("per_page", String(filters.per_page))
  const qs = params.toString()

  try {
    return await apiClient.get<PublicBlogFeedResponse>(
      `/user/blog-posts/getAll${qs ? `?${qs}` : ""}`,
    )
  } catch (err) {
    if (isCanceled(err)) return EMPTY_FEED
    throw err
  }
}

/**
 * GET /user/blog-posts/getBySlug/{slug}
 *
 * Public endpoint — works for any role (user, admin) and anonymous visitors.
 * • apiClient forwards the stored token so `is_liked` is populated for users.
 * • If the token is rejected (401) the request is retried without auth so the
 *   public post is still displayed.
 */
export async function getPublicBlogPostBySlug(
  slug: string,
): Promise<PublicBlogDetailResponse> {
  const encodedSlug = encodeURIComponent(slug)

  try {
    return await apiClient.get<PublicBlogDetailResponse>(
      `/user/blog-posts/getBySlug/${encodedSlug}`,
    )
  } catch (err) {
    if (isCanceled(err)) throw err
    if (isApiError(err) && err.status === 404) throw new Error("Post not found")
    if (isApiError(err) && err.status === 403) {
      throw new Error("Access to media stream denied")
    }
    // Expired / invalid token — retry as anonymous so the public post is shown.
    if (isApiError(err) && err.status === 401) {
      return fetchPublic<PublicBlogDetailResponse>(
        `/user/blog-posts/getBySlug/${encodedSlug}`,
      )
    }
    throw err
  }
}

// ── User interaction ──────────────────────────────────────────────────────────

/**
 * POST /user/blog-posts/like/{postId}
 * Idempotent — liking an already-liked post is a no-op on the server.
 */
export async function likePost(postId: number): Promise<BlogLikeResponse> {
  return apiClient.post<BlogLikeResponse>(`/user/blog-posts/like/${postId}`)
}

/**
 * DELETE /user/blog-posts/unlike/{postId}
 */
export async function unlikePost(postId: number): Promise<BlogLikeResponse> {
  return apiClient.delete<BlogLikeResponse>(`/user/blog-posts/unlike/${postId}`)
}

/**
 * POST /user/blog-posts/comment/{postId}
 * Body: { body: string } (1-2000 chars)
 */
export async function postBlogComment(
  postId: number,
  body: string,
): Promise<BlogCommentResponse> {
  return apiClient.post<BlogCommentResponse>(`/user/blog-posts/comment/${postId}`, { body })
}

/**
 * DELETE /user/blog-comments/delete/{commentId}
 * Only the comment owner can delete their own comment.
 */
export async function deleteBlogComment(commentId: number): Promise<void> {
  await apiClient.delete<unknown>(`/user/blog-comments/delete/${commentId}`)
}
