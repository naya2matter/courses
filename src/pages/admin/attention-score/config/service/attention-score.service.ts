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

export async function getActiveConfig(): Promise<AttentionScoreConfig> {
  const response = await apiClient.get<{ data: AttentionScoreConfig }>(
    "/admin/attention-score-config/getActive",
  )
  return response.data
}

export async function getConfigHistory(): Promise<AttentionScoreConfigHistoryItem[]> {
  const response = await apiClient.get<{ data: AttentionScoreConfigHistoryItem[] }>(
    "/admin/attention-score-config/getHistory",
  )
  return response.data
}

export async function previewConfig(payload: SaveConfigPayload): Promise<PreviewResponse> {
  return apiClient.post<PreviewResponse>("/admin/attention-score-config/preview", payload)
}

export async function saveConfig(payload: SaveConfigPayload): Promise<SaveConfigResponse> {
  return apiClient.post<SaveConfigResponse>("/admin/attention-score-config/save", payload)
}

export async function restoreConfig(id: number): Promise<SaveConfigResponse> {
  return apiClient.post<SaveConfigResponse>(`/admin/attention-score-config/restore/${id}`)
}

export async function getRecalculationJobStatus(id: number): Promise<AttentionScoreRecalculationJob> {
  const response = await apiClient.get<{ data: AttentionScoreRecalculationJob }>(
    `/admin/attention-score-recalculation-jobs/getStatus/${id}`,
  )
  return response.data
}
