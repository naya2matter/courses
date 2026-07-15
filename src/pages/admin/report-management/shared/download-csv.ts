// ─── Shared auth-aware CSV download utility ───────────────────────────────────
//
// Why `application/json` comes FIRST in Accept:
//   Laravel's wantsJson() only checks the FIRST acceptable content type.
//   If text/csv came first, wantsJson() would return false, causing Laravel
//   to redirect on validation failures (422) instead of returning JSON errors.
//   Putting application/json first ensures error responses are JSON while the
//   actual successful response is still a CSV stream.
//
// Why `export_type=csv` is always appended:
//   ReportExportRequest requires `export_type` (csv|xlsx). Without it Laravel
//   returns a 422 validation failure that (before the Accept fix) redirected.
//
// Why `redirect: "manual"`:
//   Belt-and-suspenders guard so any remaining redirect surfaces as an opaque
//   response we detect and throw rather than silently following.
//
// Pagination stripping:
//   Export endpoints return the full dataset; page/per_page are removed.

import { apiClient } from "@/lib/api"

const PAGINATION_KEYS = new Set(["page", "per_page"])

export function buildExportQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  // Always required by ReportExportRequest on the backend
  params.set("export_type", "csv")
  for (const [key, value] of Object.entries(filters)) {
    if (PAGINATION_KEYS.has(key)) continue
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  return `?${params.toString()}`
}

/**
 * Build a query string WITHOUT the `export_type` param.
 * Used by endpoints that are inherently a single format (e.g. the dedicated
 * Excel export route) and would 422 on an unexpected `export_type`.
 * Pagination keys are still stripped (exports return the full dataset).
 */
export function buildFileQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (PAGINATION_KEYS.has(key)) continue
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

/**
 * Authenticated binary download (e.g. .xlsx). Same auth/redirect/blob handling
 * as downloadCsv, but does not assume or require a CSV Accept header or
 * `export_type` param — the endpoint decides the format.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
  const token = apiClient.getToken()

  const headers: Record<string, string> = {
    // application/json FIRST so Laravel's wantsJson() returns true on errors
    Accept: "application/json, application/octet-stream, */*",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
    redirect: "manual",
  })

  if (res.type === "opaqueredirect") {
    throw new Error("Session expired — please log in again.")
  }

  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? ""
    let message = `Download failed with status ${res.status}`
    if (ct.includes("application/json")) {
      const payload = await res.json().catch(() => null)
      if (payload?.message) message = payload.message
    }
    const err = new Error(message) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadCsv(path: string, filename: string): Promise<void> {
  const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"
  const token = apiClient.getToken()

  const headers: Record<string, string> = {
    // application/json FIRST so Laravel's wantsJson() returns true on errors
    Accept: "application/json, text/csv",
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers,
    redirect: "manual",
  })

  if (res.type === "opaqueredirect") {
    throw new Error("Session expired — please log in again.")
  }

  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? ""
    let message = `Export failed with status ${res.status}`
    if (ct.includes("application/json")) {
      const payload = await res.json().catch(() => null)
      if (payload?.message) message = payload.message
    }
    const err = new Error(message) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
