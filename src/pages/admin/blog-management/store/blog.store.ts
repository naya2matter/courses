// ─── Blog Zustand Store ───────────────────────────────────────────────────────
// Single source of truth for the admin blog post list.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import { getBlogPosts } from "../service/blog.service"
import type {
  BlogPost,
  BlogPostFilters,
  PaginationMeta,
  PaginationLinks,
} from "../types/blog.types"

interface BlogState {
  items: BlogPost[]
  meta: PaginationMeta | null
  links: PaginationLinks | null
  isLoading: boolean
  error: string | null
  filters: BlogPostFilters

  fetchBlogPosts: (filters?: BlogPostFilters) => Promise<void>
  setFilters: (filters: Partial<BlogPostFilters>) => void
  clearError: () => void
}

const DEFAULT_PER_PAGE = 15

export const useBlogStore = create<BlogState>((set, get) => ({
  items: [],
  meta: null,
  links: null,
  isLoading: false,
  error: null,
  filters: { page: 1, per_page: DEFAULT_PER_PAGE },

  fetchBlogPosts: async (filters?: BlogPostFilters) => {
    const mergedFilters: BlogPostFilters = filters
      ? { ...get().filters, ...filters }
      : get().filters

    set({ isLoading: true, error: null, filters: mergedFilters })

    try {
      const response = await getBlogPosts(mergedFilters)
      set({
        items: response.data,
        meta: response.meta,
        links: response.links,
        isLoading: false,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({ isLoading: false })
        return
      }

      let message = "Failed to load blog posts. Please try again."
      if (isApiError(err)) {
        if (err.status === 401) {
          message = "You are not authenticated. Please log in again."
        } else {
          message = err.message || message
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      set({ isLoading: false, error: message })
    }
  },

  setFilters: (filters: Partial<BlogPostFilters>) => {
    // Merge incoming filters; reset to page 1 for any filter change unless the
    // caller explicitly provides a page (e.g. pagination prev/next).
    const next = { ...get().filters, ...filters, page: filters.page ?? 1 }
    set({ filters: next })
    get().fetchBlogPosts(next)
  },

  clearError: () => set({ error: null }),
}))
