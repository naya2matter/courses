// ─── Attention Score Config Zustand Store ──────────────────────────────────────
// Single source of truth for the attention-score settings page: the active
// config, the editable draft, version history, live preview, and the polled
// recalculation job status.

import { create } from "zustand"
import { isApiError } from "@/lib/api"
import {
  getActiveConfig,
  getConfigHistory,
  getRecalculationJobStatus,
  previewConfig,
  restoreConfig,
  saveConfig,
} from "../service/attention-score.service"
import type { AttentionScoreConfigState } from "../types/attention-score.types"

const POLL_INTERVAL_MS = 2000

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof DOMException && err.name === "AbortError") return fallback
  if (isApiError(err)) {
    if (err.status === 422 && err.data?.errors) {
      return Object.values(err.data.errors as Record<string, string[]>).flat().slice(0, 3).join(" ")
    }
    return err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

let pollTimer: ReturnType<typeof setInterval> | null = null

export const useAttentionScoreConfigStore = create<AttentionScoreConfigState>((set, get) => ({
  activeConfig: null,
  draftConfig: null,
  draftName: "",
  history: [],
  previewResults: null,
  recalculationJob: null,

  isLoading: false,
  isPreviewing: false,
  isSaving: false,
  error: null,

  fetchActiveConfig: async () => {
    set({ isLoading: true, error: null })
    try {
      const config = await getActiveConfig()
      set({
        activeConfig: config,
        draftConfig: structuredClone(config.config),
        draftName: `${config.name} (edited)`,
        isLoading: false,
      })
    } catch (err) {
      set({ isLoading: false, error: errorMessage(err, "Failed to load the active attention score config.") })
    }
  },

  fetchHistory: async () => {
    try {
      const history = await getConfigHistory()
      set({ history })
    } catch (err) {
      set({ error: errorMessage(err, "Failed to load config history.") })
    }
  },

  setDraftConfig: (config) => set({ draftConfig: config }),

  setDraftName: (name) => set({ draftName: name }),

  resetDraftToActive: () => {
    const { activeConfig } = get()
    if (!activeConfig) return
    set({
      draftConfig: structuredClone(activeConfig.config),
      draftName: `${activeConfig.name} (edited)`,
      previewResults: null,
    })
  },

  preview: async () => {
    const { draftConfig, draftName } = get()
    if (!draftConfig) return

    set({ isPreviewing: true, error: null })
    try {
      const response = await previewConfig({ name: draftName, config: draftConfig })
      set({ previewResults: response.examples, isPreviewing: false })
    } catch (err) {
      set({ isPreviewing: false, error: errorMessage(err, "Failed to compute preview.") })
    }
  },

  save: async () => {
    const { draftConfig, draftName } = get()
    if (!draftConfig) return

    set({ isSaving: true, error: null })
    try {
      const response = await saveConfig({ name: draftName, config: draftConfig })
      set({
        activeConfig: response.config,
        draftConfig: structuredClone(response.config.config),
        draftName: `${response.config.name} (edited)`,
        recalculationJob: response.recalculation_job,
        isSaving: false,
      })
      get().fetchHistory()
      get().pollJobStatus(response.recalculation_job.id)
    } catch (err) {
      set({ isSaving: false, error: errorMessage(err, "Failed to save the new config.") })
      throw err
    }
  },

  restore: async (id: number) => {
    set({ isSaving: true, error: null })
    try {
      const response = await restoreConfig(id)
      set({
        activeConfig: response.config,
        draftConfig: structuredClone(response.config.config),
        draftName: `${response.config.name} (edited)`,
        recalculationJob: response.recalculation_job,
        isSaving: false,
      })
      get().fetchHistory()
      get().pollJobStatus(response.recalculation_job.id)
    } catch (err) {
      set({ isSaving: false, error: errorMessage(err, "Failed to restore this config version.") })
      throw err
    }
  },

  pollJobStatus: (jobId: number) => {
    get().stopPolling()

    const tick = async () => {
      try {
        const job = await getRecalculationJobStatus(jobId)
        set({ recalculationJob: job })
        if (job.status === "done" || job.status === "failed") {
          get().stopPolling()
        }
      } catch {
        // A transient poll failure shouldn't kill the whole page — just try again next tick.
      }
    }

    tick()
    pollTimer = setInterval(tick, POLL_INTERVAL_MS)
  },

  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  },

  clearError: () => set({ error: null }),
}))
