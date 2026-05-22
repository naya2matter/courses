// ─── EvaluationType Service ────────────────────────────────────────────────────
// HTTP calls for evaluation type (sub-score) CRUD operations.

import { apiClient } from "@/lib/api"
import type {
  EvaluationConfigType,
  EvaluationTypePayload,
  EvaluationTypeResource,
  EvaluationTypeUpdatePayload,
} from "../types/evaluation-config.types"

// ── Response normalizer ────────────────────────────────────────────────────────

function unwrapType(
  res: EvaluationTypeResource | EvaluationConfigType,
): EvaluationConfigType {
  if (
    res &&
    typeof res === "object" &&
    "data" in res &&
    res.data &&
    typeof res.data === "object" &&
    "id" in res.data
  ) {
    return (res as EvaluationTypeResource).data
  }
  return res as EvaluationConfigType
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * POST /admin/evaluation-configs/{configId}/types/create
 */
export async function createEvaluationType(
  configId: number,
  payload: EvaluationTypePayload,
): Promise<EvaluationConfigType> {
  const res = await apiClient.post<EvaluationTypeResource | EvaluationConfigType>(
    `/admin/evaluation-configs/${configId}/types/create`,
    payload,
  )
  return unwrapType(res)
}

/**
 * PUT /admin/evaluation-types/update/{typeId}
 */
export async function updateEvaluationType(
  typeId: number,
  payload: EvaluationTypeUpdatePayload,
): Promise<EvaluationConfigType> {
  const res = await apiClient.put<EvaluationTypeResource | EvaluationConfigType>(
    `/admin/evaluation-types/update/${typeId}`,
    payload,
  )
  return unwrapType(res)
}

/**
 * DELETE /admin/evaluation-types/delete/{typeId}
 * Throws a 422 ApiError if the type is referenced by historical snapshots.
 */
export async function deleteEvaluationType(typeId: number): Promise<void> {
  await apiClient.delete<void>(`/admin/evaluation-types/delete/${typeId}`)
}
