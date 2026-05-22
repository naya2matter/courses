// ─── Evaluation Config Types ──────────────────────────────────────────────────
// All TypeScript shapes for the Evaluation Configurations feature.

// ── Core types ────────────────────────────────────────────────────────────────

export type AppliesToValue = "regular" | "online" | "both"

/** A sub-score type nested inside an EvaluationConfig */
export interface EvaluationConfigType {
  id: number
  config_id: number
  type_name: string
  score_value: number
  created_at?: string
  updated_at?: string
}

/** A single evaluation config returned by the API */
export interface EvaluationConfig {
  id: number
  name: string
  max_score: number
  applies_to: AppliesToValue
  types?: EvaluationConfigType[]
  created_at?: string
  updated_at?: string
}

// ── API response envelopes ────────────────────────────────────────────────────

/** Handles both { data: EvaluationConfig[] } and plain EvaluationConfig[] */
export interface EvaluationConfigListResponse {
  data: EvaluationConfig[]
}

/** Single resource response envelope */
export interface EvaluationConfigResponse {
  data: EvaluationConfig
}

// ── Request payloads ──────────────────────────────────────────────────────────

/** POST /admin/evaluation-configs/create */
export interface EvaluationConfigPayload {
  name: string
  max_score: number
  applies_to: AppliesToValue
}

/** PUT /admin/evaluation-configs/update/{id} — all fields optional */
export interface EvaluationConfigUpdatePayload {
  name?: string
  max_score?: number
  applies_to?: AppliesToValue
}

// ── Evaluation Type payloads ──────────────────────────────────────────────────

/** POST /admin/evaluation-configs/{configId}/types/create */
export interface EvaluationTypePayload {
  type_name: string
  score_value: number
}

/** PUT /admin/evaluation-types/update/{typeId} — all fields optional */
export interface EvaluationTypeUpdatePayload {
  type_name?: string
  score_value?: number
}

/** Single type resource response envelope */
export interface EvaluationTypeResource {
  data: EvaluationConfigType
}

// ── Client-side filter state ──────────────────────────────────────────────────

export interface EvaluationConfigFilters {
  search: string
  applies_to: AppliesToValue | ""
}

// ── Validation error shape ────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}
