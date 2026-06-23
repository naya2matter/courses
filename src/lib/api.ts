/**
 * ApiClient — single source for all HTTP communication with the backend.
 *
 * Usage:
 *   import { apiClient } from "@/lib/api"
 *   const data = await apiClient.get<MyType>("/some/path")
 *   const result = await apiClient.post<MyType>("/some/path", { key: "value" })
 *
 * Token management:
 *   apiClient.setToken(token)   // called after login
 *   apiClient.clearToken()      // called after logout
 */

const TOKEN_KEY = "auth_token" as const
const USER_ROLE_KEY = "auth_role" as const

export interface ApiError extends Error {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

function isApiError(err: unknown): err is ApiError {
  return err instanceof Error && "status" in err
}

class ApiClient {
  private readonly baseUrl: string

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
  }

  // ── Token helpers ──────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  }

  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_ROLE_KEY)
  }

  // ── Core request (JSON) ────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: res.statusText }))
      const err = new Error(
        payload?.message ?? `Request failed with status ${res.status}`,
      ) as ApiError
      err.status = res.status
      err.data = payload
      throw err
    }

    // 204 No Content — return undefined cast to T
    if (res.status === 204) return undefined as T

    return res.json() as Promise<T>
  }

  // ── Core request (multipart / FormData) ────────────────────────────────────
  // Used for endpoints that accept file uploads.
  // IMPORTANT: do NOT set Content-Type manually — the browser must add it
  // automatically so it includes the correct multipart boundary string.

  private async requestForm<T>(
    method: string,
    path: string,
    body: FormData,
  ): Promise<T> {
    const token = this.getToken()
    // Only Accept is set; Content-Type is intentionally omitted for FormData
    const headers: Record<string, string> = {
      Accept: "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body,
    })

    if (!res.ok) {
      const payload = await res.json().catch(() => ({ message: res.statusText }))
      const err = new Error(
        payload?.message ?? `Request failed with status ${res.status}`,
      ) as ApiError
      err.status = res.status
      err.data = payload
      throw err
    }

    if (res.status === 204) return undefined as T

    return res.json() as Promise<T>
  }

  // ── Public methods (JSON) ──────────────────────────────────────────────────

  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>("GET", path, undefined, signal)
  }

  post<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("POST", path, body, signal)
  }

  put<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("PUT", path, body, signal)
  }

  delete<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>("DELETE", path, undefined, signal)
  }

  deleteBody<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>("DELETE", path, body, signal)
  }

  // ── Blob download (authenticated) ─────────────────────────────────────────

  async getBlob(path: string): Promise<Blob> {
    const token = this.getToken()
    const headers: Record<string, string> = { Accept: "*/*" }
    if (token) headers["Authorization"] = `Bearer ${token}`
    const res = await fetch(`${this.baseUrl}${path}`, { method: "GET", headers })
    if (!res.ok) {
      const err = new Error(`Download failed with status ${res.status}`) as ApiError
      err.status = res.status
      err.data = {}
      throw err
    }
    return res.blob()
  }

  // ── Public methods (multipart / FormData) ─────────────────────────────────

  /** POST with a FormData body (file uploads) */
  postForm<T>(path: string, body: FormData): Promise<T> {
    return this.requestForm<T>("POST", path, body)
  }

  /**
   * PUT with a FormData body.
   *
   * PHP only parses multipart bodies on POST requests, so we POST to the same
   * URL and append a hidden `_method=PUT` field (Laravel method-spoofing).
   * The backend reads X-HTTP-Method-Override / _method automatically.
   */
  putForm<T>(path: string, body: FormData): Promise<T> {
    // Append the method-spoof field so Laravel treats this POST as a PUT
    body.append("_method", "PUT")
    return this.requestForm<T>("POST", path, body)
  }
}

/** Singleton client — import and use directly across the entire app. */
export const apiClient = new ApiClient()
export { TOKEN_KEY, USER_ROLE_KEY, isApiError }
