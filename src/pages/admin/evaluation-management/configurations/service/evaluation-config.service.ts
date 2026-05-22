// ─── Evaluation Config Service ────────────────────────────────────────────────
// All HTTP calls for the Evaluation Configurations feature.
// The shared apiClient attaches the Bearer token automatically.

import { apiClient } from "@/lib/api"
import type {
  EvaluationConfig,
  EvaluationConfigListResponse,
  EvaluationConfigPayload,
  EvaluationConfigResponse,
  EvaluationConfigUpdatePayload,
} from "../types/evaluation-config.types"

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Unwrap a single-resource response that may arrive as `{ data: {...} }` or as
 * the resource object itself.
 */
function unwrapSingle(res: EvaluationConfigResponse | EvaluationConfig): EvaluationConfig {
  if (
    res &&
    "data" in res &&
    typeof (res as EvaluationConfigResponse).data === "object" &&
    !Array.isArray((res as EvaluationConfigResponse).data)
  ) {
    return (res as EvaluationConfigResponse).data
  }
  return res as EvaluationConfig
}

// ── CRUD functions ────────────────────────────────────────────────────────────

/**
 * Fetch all evaluation configs.
 * GET /admin/evaluation-configs/getAll
 */
export async function getEvaluationConfigs(): Promise<EvaluationConfig[]> {
  const res = await apiClient.get<EvaluationConfigListResponse | EvaluationConfig[]>(
    "/admin/evaluation-configs/getAll",
  )
  if (Array.isArray(res)) return res
  if (res && "data" in res && Array.isArray(res.data)) return res.data
  return []
}

/**
 * Create a new evaluation config.
 * POST /admin/evaluation-configs/create
 */
export async function createEvaluationConfig(
  payload: EvaluationConfigPayload,
): Promise<EvaluationConfig> {
  const res = await apiClient.post<EvaluationConfigResponse | EvaluationConfig>(
    "/admin/evaluation-configs/create",
    payload,
  )
  return unwrapSingle(res)
}

/**
 * Update an existing evaluation config.
 * PUT /admin/evaluation-configs/update/{configId}
 */
export async function updateEvaluationConfig(
  configId: number,
  payload: EvaluationConfigUpdatePayload,
): Promise<EvaluationConfig> {
  const res = await apiClient.put<EvaluationConfigResponse | EvaluationConfig>(
    `/admin/evaluation-configs/update/${configId}`,
    payload,
  )
  return unwrapSingle(res)
}

/**
 * Delete an evaluation config.
 * DELETE /admin/evaluation-configs/delete/{configId}
 *
 * Throws a 422 ApiError if the config name appears in any historical snapshot.
 */
export async function deleteEvaluationConfig(configId: number): Promise<void> {
  return apiClient.delete<void>(`/admin/evaluation-configs/delete/${configId}`)
}
