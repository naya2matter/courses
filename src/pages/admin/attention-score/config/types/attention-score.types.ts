// ─── Attention Score Config Types ──────────────────────────────────────────────
// All TypeScript shapes for the configurable Attention Score feature:
//   • the config JSON structure (bands/weights/thresholds the client edits)
//   • API response types (config, history, preview, recalculation job)
//   • Zustand store state shape

// ── Config JSON shapes (mirrors backend AttentionScoreConfig::config) ─────────

/** A {min, max, points} band — max is null on the last (open-ended) band. */
export interface MinMaxPointsBand {
  min: number
  max: number | null
  points: number
}

/** A {min, max, adjustment} band — used for speed-change bands. */
export interface MinMaxAdjustmentBand {
  min: number
  max: number | null
  adjustment: number
}

/** A {max, adjustment} threshold band — used for skip-ratio bands. */
export interface ThresholdAdjustmentBand {
  max: number | null
  adjustment: number
}

export interface ConsistencyValidation {
  completion_threshold: number
  skip_ratio_threshold: number
  penalty: number
}

export interface RiskLevels {
  high_below: number
  medium_below: number
}

export interface BlendedScoreWeights {
  completion: number
  progress: number
  attention: number
  quiz: number
  suspicious_penalty_multiplier: number
}

export interface AttentionScoreConfigData {
  video: {
    weights: { watch_time: number; engagement: number; completion: number }
    time_ratio_bands: MinMaxPointsBand[]
    engagement_base_points: number
    speed_change_bands: MinMaxAdjustmentBand[]
    completion_bands: MinMaxPointsBand[]
    skip_ratio_bands: ThresholdAdjustmentBand[]
    consistency_validation: ConsistencyValidation
    allowed_review_window_multiplier: number
  }
  risk_levels: RiskLevels
  blended_score_weights: BlendedScoreWeights
}

// ── Resource shapes returned by the API ────────────────────────────────────────

export interface AttentionScoreConfig {
  id: number
  name: string
  is_active: boolean
  config: AttentionScoreConfigData
  created_by: number | null
  created_at: string | null
}

export interface AttentionScoreConfigHistoryItem {
  id: number
  name: string
  is_active: boolean
  created_by: string | null
  created_at: string | null
}

export type RecalculationJobStatus = "queued" | "running" | "done" | "failed"

export interface AttentionScoreRecalculationJob {
  id: number
  attention_score_config_id: number
  status: RecalculationJobStatus
  total_sessions: number
  processed_sessions: number
  started_at: string | null
  finished_at: string | null
  error_message: string | null
}

export interface PreviewExampleResult {
  label: string
  expected: number
  result: { score: number; breakdown?: Record<string, number> }
}

// ── API response envelopes ─────────────────────────────────────────────────────

export interface PreviewResponse {
  examples: PreviewExampleResult[]
}

export interface SaveConfigResponse {
  config: AttentionScoreConfig
  recalculation_job: AttentionScoreRecalculationJob
}

// ── Request payloads ────────────────────────────────────────────────────────────

export interface SaveConfigPayload {
  name: string
  config: AttentionScoreConfigData
}

// ── Validation error shape (HTTP 422) ───────────────────────────────────────────

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}

// ── Zustand store shape ─────────────────────────────────────────────────────────

export interface AttentionScoreConfigState {
  /** The currently active config, as last fetched (or saved) */
  activeConfig: AttentionScoreConfig | null
  /** Draft config being edited on the settings page — starts as a clone of activeConfig */
  draftConfig: AttentionScoreConfigData | null
  draftName: string
  /** Version history, newest first */
  history: AttentionScoreConfigHistoryItem[]
  /** Live-preview results for the 3 worked examples, from the last Preview click */
  previewResults: PreviewExampleResult[] | null
  /** The recalculation job triggered by the last save/restore, polled until done/failed */
  recalculationJob: AttentionScoreRecalculationJob | null

  isLoading: boolean
  isLoadingHistory: boolean
  isPreviewing: boolean
  isSaving: boolean
  /** Id of the version currently being restored, or null. */
  restoringId: number | null

  // Errors are kept in separate slots so a failed preview doesn't blank out the
  // page, and a failed history fetch doesn't look like the editor is broken.
  loadError: string | null
  historyError: string | null
  previewError: string | null
  saveError: string | null
  /** Field-level messages from a 422 response, keyed by the server's field path. */
  fieldErrors: Record<string, string[]>

  fetchActiveConfig: () => Promise<void>
  fetchHistory: () => Promise<void>
  setDraftConfig: (config: AttentionScoreConfigData) => void
  setDraftName: (name: string) => void
  resetDraftToActive: () => void
  preview: () => Promise<void>
  save: () => Promise<void>
  restore: (id: number) => Promise<void>
  pollJobStatus: (jobId: number) => void
  stopPolling: () => void
  /** Hide a finished (done/failed) job banner. */
  dismissJob: () => void
  clearErrors: () => void
}
