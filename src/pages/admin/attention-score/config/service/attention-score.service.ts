// ─── Attention Score Config API Service ────────────────────────────────────────
// Raw HTTP calls for the configurable Attention Score feature. No state here —
// the Zustand store orchestrates these and holds the results.

import { apiClient } from "@/lib/api"
import type {
  AttentionScoreConfig,
  AttentionScoreConfigHistoryItem,
  AttentionScoreRecalculationJob,
  PreviewResponse,
  SaveConfigPayload,
  SaveConfigResponse,
} from "../types/attention-score.types"

/**
 * Some endpoints wrap their payload in `{ data: … }` and some return it bare.
 * Rather than guess per-endpoint, unwrap only when the response is a plain
 * `{ data: … }` envelope — a real payload never has `data` as its only key.
 */
function unwrap<T>(response: T | { data: T }): T {
  if (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    Object.keys(response).length === 1
  ) {
    return (response as { data: T }).data
  }
  return response as T
}

export async function getActiveConfig(signal?: AbortSignal): Promise<AttentionScoreConfig> {
  return unwrap(
    await apiClient.get<{ data: AttentionScoreConfig }>(
      "/admin/attention-score-config/getActive",
      signal,
    ),
  )
}

export async function getConfigHistory(signal?: AbortSignal): Promise<AttentionScoreConfigHistoryItem[]> {
  const result = unwrap(
    await apiClient.get<{ data: AttentionScoreConfigHistoryItem[] }>(
      "/admin/attention-score-config/getHistory",
      signal,
    ),
  )
  return Array.isArray(result) ? result : []
}

export async function previewConfig(payload: SaveConfigPayload): Promise<PreviewResponse> {
  return unwrap(await apiClient.post<PreviewResponse>("/admin/attention-score-config/preview", payload))
}

export async function saveConfig(payload: SaveConfigPayload): Promise<SaveConfigResponse> {
  return unwrap(await apiClient.post<SaveConfigResponse>("/admin/attention-score-config/save", payload))
}

export async function restoreConfig(id: number): Promise<SaveConfigResponse> {
  return unwrap(await apiClient.post<SaveConfigResponse>(`/admin/attention-score-config/restore/${id}`))
}

export async function getRecalculationJobStatus(
  id: number,
  signal?: AbortSignal,
): Promise<AttentionScoreRecalculationJob> {
  return unwrap(
    await apiClient.get<{ data: AttentionScoreRecalculationJob }>(
      `/admin/attention-score-recalculation-jobs/getStatus/${id}`,
      signal,
    ),
  )
}
