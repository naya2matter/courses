// ─── Resend Login Links — Service ─────────────────────────────────────────────

import { apiClient } from "@/lib/api"
import type { ExpiredLinksListResponse, ResendLinkResponse } from "../types/resend-links.types"

/**
 * Fetch all course assignments with expired or never-sent login links.
 * Endpoint: GET /admin/course-assignments/expired-links
 */
export async function getExpiredLinks(page = 1): Promise<ExpiredLinksListResponse> {
  return apiClient.get<ExpiredLinksListResponse>(
    `/admin/course-assignments/expired-links?page=${page}`,
  )
}

/**
 * Resend the magic login link for a course assignment.
 * Endpoint: POST /admin/course-assignments/{id}/resend-link
 */
export async function resendLoginLink(id: number): Promise<ResendLinkResponse> {
  return apiClient.post<ResendLinkResponse>(
    `/admin/course-assignments/${id}/resend-link`,
    {},
  )
}
