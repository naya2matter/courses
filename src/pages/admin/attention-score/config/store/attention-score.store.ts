// ─── Attention Score Config Zustand Store ──────────────────────────────────────
// Single source of truth for the attention-score settings page: the active
// config, the editable draft, version history, live preview, and the polled
// recalculation job status.
//
// Errors are kept in separate slots (load / history / preview / save) so one
// failing call never blanks out the rest of the page.

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
/** Give up live progress after this many consecutive poll failures (~10s). */
const MAX_POLL_FAILURES = 5

interface DescribedError {
  message: string
  fieldErrors: Record<string, string[]>
}

function isAbort(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError"
}

/**
 * Turns any thrown value into a message the client can act on, plus the
 * per-field messages from a Laravel 422 so the form can highlight them.
 */
function describeError(err: unknown, fallback: string): DescribedError {
  if (isApiError(err)) {
    const fieldErrors =
      err.status === 422 && err.data?.errors && typeof err.data.errors === "object"
        ? (err.data.errors as Record<string, string[]>)
        : {}

    if (err.status === 422) {
      const first = Object.values(fieldErrors).flat().slice(0, 3)
      return {
        message: first.length > 0 ? first.join(" ") : err.message || "Some values were rejected by the server.",
        fieldErrors,
      }
    }
    if (err.status === 401) return { message: "Your session expired. Sign in again to continue.", fieldErrors }
    if (err.status === 403) return { message: "You do not have permission to change these settings.", fieldErrors }
    if (err.status === 404) return { message: "This attention-score config no longer exists.", fieldErrors }
    if (err.status === 409) return { message: "A recalculation is already running. Wait for it to finish, then try again.", fieldErrors }
    if (err.status >= 500) return { message: "The server failed to process this request. Please try again.", fieldErrors }
    return { message: err.message || fallback, fieldErrors }
  }

  if (err instanceof TypeError) {
    // fetch() rejects with a TypeError when the network itself is unreachable.
    return { message: "Could not reach the server. Check your connection and try again.", fieldErrors: {} }
  }
  if (err instanceof Error) return { message: err.message, fieldErrors: {} }
  return { message: fallback, fieldErrors: {} }
}

let pollTimer: ReturnType<typeof setInterval> | null = null
let pollAbort: AbortController | null = null

export const useAttentionScoreConfigStore = create<AttentionScoreConfigState>((set, get) => ({
  activeConfig: null,
  draftConfig: null,
  draftName: "",
  history: [],
  previewResults: null,
  recalculationJob: null,

  isLoading: false,
  isLoadingHistory: false,
  isPreviewing: false,
  isSaving: false,
  restoringId: null,

  loadError: null,
  historyError: null,
  previewError: null,
  saveError: null,
  fieldErrors: {},

  fetchActiveConfig: async () => {
    set({ isLoading: true, loadError: null })
    try {
      const config = await getActiveConfig()
      if (!config?.config) {
        throw new Error("The server returned an empty attention-score config.")
      }
      set({
        activeConfig: config,
        draftConfig: structuredClone(config.config),
        draftName: `${config.name} (edited)`,
        isLoading: false,
      })
    } catch (err) {
      if (isAbort(err)) return
      set({
        isLoading: false,
        loadError: describeError(err, "Failed to load the active attention score config.").message,
      })
    }
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true, historyError: null })
    try {
      const history = await getConfigHistory()
      set({ history, isLoadingHistory: false })
    } catch (err) {
      if (isAbort(err)) return
      set({
        isLoadingHistory: false,
        historyError: describeError(err, "Failed to load config history.").message,
      })
    }
  },

  // Editing clears stale preview results and any server-side field errors —
  // both describe a config that no longer matches what's on screen.
  setDraftConfig: (config) => set({ draftConfig: config, previewResults: null, fieldErrors: {} }),

  setDraftName: (name) => set({ draftName: name, fieldErrors: {} }),

  resetDraftToActive: () => {
    const { activeConfig } = get()
    if (!activeConfig) return
    set({
      draftConfig: structuredClone(activeConfig.config),
      draftName: `${activeConfig.name} (edited)`,
      previewResults: null,
      previewError: null,
      saveError: null,
      fieldErrors: {},
    })
  },

  preview: async () => {
    const { draftConfig, draftName } = get()
    if (!draftConfig) return

    set({ isPreviewing: true, previewError: null })
    try {
      const response = await previewConfig({ name: draftName, config: draftConfig })
      set({ previewResults: response?.examples ?? [], isPreviewing: false })
    } catch (err) {
      if (isAbort(err)) return
      const { message, fieldErrors } = describeError(err, "Failed to compute preview.")
      set({ isPreviewing: false, previewError: message, fieldErrors })
    }
  },

  save: async () => {
    const { draftConfig, draftName } = get()
    if (!draftConfig) return

    set({ isSaving: true, saveError: null, fieldErrors: {} })
    try {
      const response = await saveConfig({ name: draftName.trim(), config: draftConfig })
      if (!response?.config?.config) {
        throw new Error("The server did not return the saved config.")
      }
      set({
        activeConfig: response.config,
        draftConfig: structuredClone(response.config.config),
        draftName: `${response.config.name} (edited)`,
        recalculationJob: response.recalculation_job ?? null,
        previewResults: null,
        isSaving: false,
      })
      get().fetchHistory()
      if (response.recalculation_job?.id) get().pollJobStatus(response.recalculation_job.id)
    } catch (err) {
      const { message, fieldErrors } = describeError(err, "Failed to save the new config.")
      set({ isSaving: false, saveError: message, fieldErrors })
      throw err
    }
  },

  restore: async (id: number) => {
    set({ restoringId: id, saveError: null, fieldErrors: {} })
    try {
      const response = await restoreConfig(id)
      if (!response?.config?.config) {
        throw new Error("The server did not return the restored config.")
      }
      set({
        activeConfig: response.config,
        draftConfig: structuredClone(response.config.config),
        draftName: `${response.config.name} (edited)`,
        recalculationJob: response.recalculation_job ?? null,
        previewResults: null,
        restoringId: null,
      })
      get().fetchHistory()
      if (response.recalculation_job?.id) get().pollJobStatus(response.recalculation_job.id)
    } catch (err) {
      set({
        restoringId: null,
        saveError: describeError(err, "Failed to restore this config version.").message,
      })
      throw err
    }
  },

  pollJobStatus: (jobId: number) => {
    get().stopPolling()

    pollAbort = new AbortController()
    const { signal } = pollAbort
    let failures = 0

    const tick = async () => {
      try {
        const job = await getRecalculationJobStatus(jobId, signal)
        failures = 0
        set({ recalculationJob: job })
        if (job.status === "done" || job.status === "failed") {
          get().stopPolling()
          // The scores every report reads have just changed underneath us.
          if (job.status === "done") get().fetchHistory()
        }
      } catch (err) {
        if (isAbort(err)) return
        failures += 1
        // A transient blip shouldn't kill the page, but silently retrying
        // forever leaves a spinner that never resolves — so give up loudly.
        if (failures >= MAX_POLL_FAILURES) {
          get().stopPolling()
          set({
            saveError:
              "Lost contact with the recalculation job. It is most likely still running — reload the page to check its progress.",
          })
        }
      }
    }

    void tick()
    pollTimer = setInterval(() => void tick(), POLL_INTERVAL_MS)
  },

  stopPolling: () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (pollAbort) {
      pollAbort.abort()
      pollAbort = null
    }
  },

  dismissJob: () => set({ recalculationJob: null }),

  clearErrors: () => set({ loadError: null, historyError: null, previewError: null, saveError: null, fieldErrors: {} }),
}))
