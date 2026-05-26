// ─── Evaluation Notification Service ─────────────────────────────────────────
// All HTTP calls for the Evaluation Notifications feature.
// The shared apiClient attaches the Bearer token automatically.

import { apiClient } from "@/lib/api"
import type {
  EvaluationNotificationPayload,
  EvaluationNotificationPreviewResponse,
  EvaluationNotificationSendResponse,
  EvaluationNotificationHistoryResponse,
} from "../types/evaluation-notification.types"

// ── Preview ───────────────────────────────────────────────────────────────────

/**
 * Dry-run — returns who would receive the email and how many evaluations
 * would be included. Does NOT send any emails.
 * POST /admin/evaluation-notifications/preview
 */
export async function previewEvaluationNotification(
  payload: EvaluationNotificationPayload,
): Promise<EvaluationNotificationPreviewResponse> {
  return apiClient.post<EvaluationNotificationPreviewResponse>(
    "/admin/evaluation-notifications/preview",
    payload,
  )
}

// ── Send ──────────────────────────────────────────────────────────────────────

/**
 * Queue notification emails for the given managers.
 * Emails are dispatched asynchronously — success means the queue job was
 * created, not necessarily that the email was delivered.
 * POST /admin/evaluation-notifications/send
 */
export async function sendEvaluationNotification(
  payload: EvaluationNotificationPayload,
): Promise<EvaluationNotificationSendResponse> {
  return apiClient.post<EvaluationNotificationSendResponse>(
    "/admin/evaluation-notifications/send",
    payload,
  )
}

// ── History ───────────────────────────────────────────────────────────────────

/**
 * Fetch the paginated log of all sent notification batches.
 * GET /admin/evaluation-notifications/getAll
 */
export async function getEvaluationNotificationHistory(
  params: { page?: number; per_page?: number } = {},
): Promise<EvaluationNotificationHistoryResponse> {
  const p = new URLSearchParams()
  if (params.page) p.set("page", String(params.page))
  if (params.per_page) p.set("per_page", String(params.per_page))
  const qs = p.toString()
  const response = await apiClient.get<EvaluationNotificationHistoryResponse>(
    `/admin/evaluation-notifications/getAll${qs ? `?${qs}` : ""}`,
  )

  return {
    ...response,
    data: response.data.map((item) => ({
      ...item,
      created_at: item.created_at ?? item.sent_at ?? "",
      success_count: item.success_count ?? item.managers?.length ?? item.sent_to?.length ?? 0,
      failed_count: item.failed_count ?? 0,
    })),
  }
}
