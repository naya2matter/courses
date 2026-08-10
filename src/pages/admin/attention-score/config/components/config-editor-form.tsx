// ─── Attention Score Config Editor Form ────────────────────────────────────────
// Every editable number in the Attention Score formula, grouped into sections
// that each explain what the numbers actually do. Bound to the draft config held
// in the store; validation messages come pre-computed from the shared validator,
// with any server-side 422 messages merged on top.

import {
  ActivityIcon,
  AlertCircleIcon,
  ClockIcon,
  GaugeIcon,
  LayersIcon,
  ScaleIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  TrendingUpIcon,
} from "lucide-react"

import { BandTableEditor } from "./band-table-editor"
import { NumberField } from "./number-field"
import { SectionCard, SumIndicator } from "./section-card"
import type { ValidationResult } from "../lib/validate-config"
import type { AttentionScoreConfigData } from "../types/attention-score.types"

interface ConfigEditorFormProps {
  config: AttentionScoreConfigData
  onChange: (config: AttentionScoreConfigData) => void
  validation: ValidationResult
  /** Field-level messages from a server 422, keyed by the server's field path. */
  fieldErrors: Record<string, string[]>
  disabled?: boolean
}

export function ConfigEditorForm({
  config,
  onChange,
  validation,
  fieldErrors,
  disabled,
}: ConfigEditorFormProps) {
  function set(mutate: (draft: AttentionScoreConfigData) => void) {
    const next = structuredClone(config)
    mutate(next)
    onChange(next)
  }

  /**
   * Client-side validation first, then the server's own message for the same
   * field. The server namespaces paths under `config.`, so check both forms.
   * Returns NumberField's `error`/`warning` props so severity is never lost —
   * a warning must not render with error styling or mark the field invalid.
   */
  function msg(path: string): { error?: string; warning?: string } {
    const issue = validation.issueByPath[path]
    if (issue) {
      return issue.severity === "error" ? { error: issue.message } : { warning: issue.message }
    }
    const server = fieldErrors[path]?.[0] ?? fieldErrors[`config.${path}`]?.[0]
    return server ? { error: server } : {}
  }

  /** Section-level messages are always blocking errors. */
  function sectionMsg(path: string): string | undefined {
    return msg(path).error
  }

  const counts = (key: keyof ValidationResult["errorsBySection"]) => ({
    errorCount: validation.errorsBySection[key].length,
    warningCount: validation.warningsBySection[key].length,
  })

  const bandProps = {
    issueByPath: validation.issueByPath,
    errorPaths: validation.errorPaths,
    disabled,
  }

  const v = config.video
  const weightSum = v.weights.watch_time + v.weights.engagement + v.weights.completion
  const blended = config.blended_score_weights
  const blendedSum = blended.completion + blended.progress + blended.attention + blended.quiz

  return (
    <div className="space-y-4">
      {/* ── Component weights ─────────────────────────────────────────────── */}
      <SectionCard
        icon={ScaleIcon}
        title="Component Weights"
        description="How much each part contributes to a video's attention score. These three must total 100."
        aside={<SumIndicator sum={weightSum} target={100} />}
        {...counts("weights")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Watch time & consistency"
            value={v.weights.watch_time}
            {...msg("video.weights.watch_time")}
            suffix="%"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.weights.watch_time = n })}
          />
          <NumberField
            label="Engagement"
            value={v.weights.engagement}
            {...msg("video.weights.engagement")}
            suffix="%"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.weights.engagement = n })}
          />
          <NumberField
            label="Completion"
            value={v.weights.completion}
            {...msg("video.weights.completion")}
            suffix="%"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.weights.completion = n })}
          />
        </div>

        <SectionError message={sectionMsg("video.weights")} />
      </SectionCard>

      {/* ── Watch time ─────────────────────────────────────────────────────── */}
      <SectionCard
        icon={ClockIcon}
        title="Watch Time & Consistency"
        description="Active playback time ÷ video duration, converted to points. A learner who watches steadily scores at the top band."
        {...counts("watch_time")}
      >
        <BandTableEditor
          rows={v.time_ratio_bands}
          hasMin
          valueField="points"
          valueLabel="Points"
          basePath="video.time_ratio_bands"
          unit="×"
          {...bandProps}
          onChange={(rows) => set((d) => { d.video.time_ratio_bands = rows as typeof d.video.time_ratio_bands })}
        />

        <div className="border-t border-white/8 pt-4">
          <NumberField
            label="Allowed review window multiplier"
            value={v.allowed_review_window_multiplier}
            {...msg("video.allowed_review_window_multiplier")}
            hint="How many times the video's length a learner may spend before extra time stops counting. 2 = twice the runtime."
            suffix="×"
            disabled={disabled}
            className="max-w-xs"
            onChange={(n) => set((d) => { d.video.allowed_review_window_multiplier = n })}
          />
        </div>
      </SectionCard>

      {/* ── Engagement ─────────────────────────────────────────────────────── */}
      <SectionCard
        icon={ActivityIcon}
        title="Engagement"
        description="Starts from a base score for normal viewing, then adjusts it based on how often playback speed was changed."
        {...counts("engagement")}
      >
        <NumberField
          label="Base points (normal learning behaviour)"
          value={v.engagement_base_points}
          {...msg("video.engagement_base_points")}
          hint="Awarded before any speed-change adjustment is applied."
          suffix="pts"
          disabled={disabled}
          className="max-w-xs"
          onChange={(n) => set((d) => { d.video.engagement_base_points = n })}
        />

        <div className="space-y-2 border-t border-white/8 pt-4">
          <p className="text-xs font-medium text-white/50">Speed-change adjustment</p>
          <p className="text-[11px] text-white/30">
            Number of speed changes in a session → points added to (or taken off) the base.
          </p>
          <BandTableEditor
            rows={v.speed_change_bands}
            hasMin
            valueField="adjustment"
            valueLabel="Adjustment"
            basePath="video.speed_change_bands"
            {...bandProps}
            onChange={(rows) => set((d) => { d.video.speed_change_bands = rows as typeof d.video.speed_change_bands })}
          />
        </div>
      </SectionCard>

      {/* ── Completion ─────────────────────────────────────────────────────── */}
      <SectionCard
        icon={TrendingUpIcon}
        title="Completion"
        description="How far through the video the learner actually got, converted to points."
        {...counts("completion")}
      >
        <BandTableEditor
          rows={v.completion_bands}
          hasMin
          valueField="points"
          valueLabel="Points"
          basePath="video.completion_bands"
          unit="%"
          {...bandProps}
          onChange={(rows) => set((d) => { d.video.completion_bands = rows as typeof d.video.completion_bands })}
        />
      </SectionCard>

      {/* ── Skip ratio ─────────────────────────────────────────────────────── */}
      <SectionCard
        icon={SlidersHorizontalIcon}
        title="Learning Skip Ratio"
        description="Share of the video that was skipped past rather than watched. Higher skipping should cost points."
        {...counts("skip_ratio")}
      >
        <BandTableEditor
          rows={v.skip_ratio_bands}
          hasMin={false}
          valueField="adjustment"
          valueLabel="Adjustment"
          basePath="video.skip_ratio_bands"
          unit="%"
          {...bandProps}
          onChange={(rows) => set((d) => { d.video.skip_ratio_bands = rows as typeof d.video.skip_ratio_bands })}
        />
      </SectionCard>

      {/* ── Consistency validation ─────────────────────────────────────────── */}
      <SectionCard
        icon={GaugeIcon}
        title="Completion Consistency Check"
        description="Catches sessions that report near-full completion while skipping most of the video. When both thresholds are crossed, the penalty is applied on top."
        {...counts("consistency")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Completion at or above"
            value={v.consistency_validation.completion_threshold}
            {...msg("video.consistency_validation.completion_threshold")}
            suffix="%"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.consistency_validation.completion_threshold = n })}
          />
          <NumberField
            label="…and skip ratio above"
            value={v.consistency_validation.skip_ratio_threshold}
            {...msg("video.consistency_validation.skip_ratio_threshold")}
            suffix="%"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.consistency_validation.skip_ratio_threshold = n })}
          />
          <NumberField
            label="…then apply penalty"
            value={v.consistency_validation.penalty}
            {...msg("video.consistency_validation.penalty")}
            suffix="pts"
            disabled={disabled}
            onChange={(n) => set((d) => { d.video.consistency_validation.penalty = n })}
          />
        </div>
      </SectionCard>

      {/* ── Risk levels ────────────────────────────────────────────────────── */}
      <SectionCard
        icon={ShieldAlertIcon}
        title="Risk Levels"
        description="Score thresholds that decide how a learner is flagged in reports and dashboards."
        {...counts("risk_levels")}
      >
        <div className="grid gap-4 sm:max-w-md sm:grid-cols-2">
          <NumberField
            label="High risk below"
            value={config.risk_levels.high_below}
            {...msg("risk_levels.high_below")}
            suffix="pts"
            disabled={disabled}
            onChange={(n) => set((d) => { d.risk_levels.high_below = n })}
          />
          <NumberField
            label="Medium risk below"
            value={config.risk_levels.medium_below}
            {...msg("risk_levels.medium_below")}
            suffix="pts"
            disabled={disabled}
            onChange={(n) => set((d) => { d.risk_levels.medium_below = n })}
          />
        </div>
      </SectionCard>

      {/* ── Blended score weights ──────────────────────────────────────────── */}
      <SectionCard
        icon={LayersIcon}
        title="Blended Score Weights"
        description="How the overall learner score combines the four inputs. These must total 1.00."
        aside={<SumIndicator sum={blendedSum} target={1} decimals={2} />}
        {...counts("blended")}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <NumberField
            label="Completion" step="0.01"
            value={blended.completion}
            {...msg("blended_score_weights.completion")}
            disabled={disabled}
            onChange={(n) => set((d) => { d.blended_score_weights.completion = n })}
          />
          <NumberField
            label="Progress" step="0.01"
            value={blended.progress}
            {...msg("blended_score_weights.progress")}
            disabled={disabled}
            onChange={(n) => set((d) => { d.blended_score_weights.progress = n })}
          />
          <NumberField
            label="Attention" step="0.01"
            value={blended.attention}
            {...msg("blended_score_weights.attention")}
            disabled={disabled}
            onChange={(n) => set((d) => { d.blended_score_weights.attention = n })}
          />
          <NumberField
            label="Quiz" step="0.01"
            value={blended.quiz}
            {...msg("blended_score_weights.quiz")}
            disabled={disabled}
            onChange={(n) => set((d) => { d.blended_score_weights.quiz = n })}
          />
        </div>

        <SectionError message={sectionMsg("blended_score_weights")} />

        <div className="border-t border-white/8 pt-4">
          <NumberField
            label="Suspicious-session penalty multiplier"
            value={blended.suspicious_penalty_multiplier}
            {...msg("blended_score_weights.suspicious_penalty_multiplier")}
            hint="Blended score is multiplied by this when a session is flagged suspicious. 0.5 halves it; 1 disables the penalty."
            step="0.01"
            suffix="×"
            disabled={disabled}
            className="max-w-xs"
            onChange={(n) => set((d) => { d.blended_score_weights.suspicious_penalty_multiplier = n })}
          />
        </div>
      </SectionCard>
    </div>
  )
}

/** Section-wide message (e.g. "the weights must total 100") shown below its fields. */
function SectionError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-red-400">
      <AlertCircleIcon className="mt-px size-3.5 shrink-0" />
      {message}
    </p>
  )
}
