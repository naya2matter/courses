// ─── Attention Score Config Editor Form ────────────────────────────────────────
// Renders every editable number/table from the client's spec, bound to the
// draft config held in the store. Pure controlled inputs — validation happens
// server-side; this form just reflects and updates the draft.

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BandTableEditor } from "./band-table-editor"
import type { AttentionScoreConfigData } from "../types/attention-score.types"

interface ConfigEditorFormProps {
  config: AttentionScoreConfigData
  onChange: (config: AttentionScoreConfigData) => void
  disabled?: boolean
}

export function ConfigEditorForm({ config, onChange, disabled }: ConfigEditorFormProps) {
  function set(path: (draft: AttentionScoreConfigData) => void) {
    const next = structuredClone(config)
    path(next)
    onChange(next)
  }

  const weightSum = config.video.weights.watch_time + config.video.weights.engagement + config.video.weights.completion
  const blendedSum =
    config.blended_score_weights.completion +
    config.blended_score_weights.progress +
    config.blended_score_weights.attention +
    config.blended_score_weights.quiz

  return (
    <div className="space-y-8">
      {/* ── Component weights ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Component Weights</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Watch Time & Consistency</Label>
            <Input
              type="number"
              value={config.video.weights.watch_time}
              disabled={disabled}
              onChange={(e) => set((d) => { d.video.weights.watch_time = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Engagement</Label>
            <Input
              type="number"
              value={config.video.weights.engagement}
              disabled={disabled}
              onChange={(e) => set((d) => { d.video.weights.engagement = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Completion</Label>
            <Input
              type="number"
              value={config.video.weights.completion}
              disabled={disabled}
              onChange={(e) => set((d) => { d.video.weights.completion = Number(e.target.value) })}
            />
          </div>
        </div>
        <p className={weightSum === 100 ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          Sum: {weightSum} (must equal 100)
        </p>
      </section>

      {/* ── Time ratio bands ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Watch Time & Consistency — Time Ratio Bands</h3>
        <p className="text-sm text-muted-foreground">Active playback time ÷ video duration → points.</p>
        <BandTableEditor
          rows={config.video.time_ratio_bands}
          hasMin
          valueField="points"
          valueLabel="Points"
          disabled={disabled}
          onChange={(rows) => set((d) => { d.video.time_ratio_bands = rows as typeof d.video.time_ratio_bands })}
        />
      </section>

      {/* ── Engagement ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Engagement</h3>
        <div className="max-w-xs space-y-2">
          <Label>Base points (normal learning behavior)</Label>
          <Input
            type="number"
            value={config.video.engagement_base_points}
            disabled={disabled}
            onChange={(e) => set((d) => { d.video.engagement_base_points = Number(e.target.value) })}
          />
        </div>
        <p className="text-sm text-muted-foreground">Speed-change count → point adjustment.</p>
        <BandTableEditor
          rows={config.video.speed_change_bands}
          hasMin
          valueField="adjustment"
          valueLabel="Adjustment"
          disabled={disabled}
          onChange={(rows) => set((d) => { d.video.speed_change_bands = rows as typeof d.video.speed_change_bands })}
        />
      </section>

      {/* ── Completion bands ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Completion Bands</h3>
        <p className="text-sm text-muted-foreground">Completion % → points.</p>
        <BandTableEditor
          rows={config.video.completion_bands}
          hasMin
          valueField="points"
          valueLabel="Points"
          disabled={disabled}
          onChange={(rows) => set((d) => { d.video.completion_bands = rows as typeof d.video.completion_bands })}
        />
      </section>

      {/* ── Skip ratio bands ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Learning Skip Ratio Bands</h3>
        <p className="text-sm text-muted-foreground">Unwatched % skipped over → point adjustment.</p>
        <BandTableEditor
          rows={config.video.skip_ratio_bands}
          hasMin={false}
          valueField="adjustment"
          valueLabel="Adjustment"
          disabled={disabled}
          onChange={(rows) => set((d) => { d.video.skip_ratio_bands = rows as typeof d.video.skip_ratio_bands })}
        />
      </section>

      {/* ── Consistency validation ────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Completion Consistency Validation</h3>
        <p className="text-sm text-muted-foreground">
          If completion ≥ threshold AND skip ratio &gt; threshold, apply an extra penalty.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Completion threshold (%)</Label>
            <Input
              type="number"
              value={config.video.consistency_validation.completion_threshold}
              disabled={disabled}
              onChange={(e) =>
                set((d) => { d.video.consistency_validation.completion_threshold = Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Skip ratio threshold (%)</Label>
            <Input
              type="number"
              value={config.video.consistency_validation.skip_ratio_threshold}
              disabled={disabled}
              onChange={(e) =>
                set((d) => { d.video.consistency_validation.skip_ratio_threshold = Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Penalty</Label>
            <Input
              type="number"
              value={config.video.consistency_validation.penalty}
              disabled={disabled}
              onChange={(e) => set((d) => { d.video.consistency_validation.penalty = Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* ── Risk levels ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Risk Levels</h3>
        <div className="grid gap-4 sm:grid-cols-2 sm:max-w-md">
          <div className="space-y-2">
            <Label>High risk below</Label>
            <Input
              type="number"
              value={config.risk_levels.high_below}
              disabled={disabled}
              onChange={(e) => set((d) => { d.risk_levels.high_below = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Medium risk below</Label>
            <Input
              type="number"
              value={config.risk_levels.medium_below}
              disabled={disabled}
              onChange={(e) => set((d) => { d.risk_levels.medium_below = Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* ── Blended score weights ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="font-semibold">Blended Score Weights</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label>Completion</Label>
            <Input
              type="number" step="0.01"
              value={config.blended_score_weights.completion}
              disabled={disabled}
              onChange={(e) => set((d) => { d.blended_score_weights.completion = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Progress</Label>
            <Input
              type="number" step="0.01"
              value={config.blended_score_weights.progress}
              disabled={disabled}
              onChange={(e) => set((d) => { d.blended_score_weights.progress = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Attention</Label>
            <Input
              type="number" step="0.01"
              value={config.blended_score_weights.attention}
              disabled={disabled}
              onChange={(e) => set((d) => { d.blended_score_weights.attention = Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label>Quiz</Label>
            <Input
              type="number" step="0.01"
              value={config.blended_score_weights.quiz}
              disabled={disabled}
              onChange={(e) => set((d) => { d.blended_score_weights.quiz = Number(e.target.value) })}
            />
          </div>
        </div>
        <p className={blendedSum === 1 ? "text-sm text-muted-foreground" : "text-sm text-destructive"}>
          Sum: {blendedSum.toFixed(2)} (must equal 1.00)
        </p>
        <div className="max-w-xs space-y-2">
          <Label>Suspicious-session penalty multiplier</Label>
          <Input
            type="number"
            value={config.blended_score_weights.suspicious_penalty_multiplier}
            disabled={disabled}
            onChange={(e) =>
              set((d) => { d.blended_score_weights.suspicious_penalty_multiplier = Number(e.target.value) })
            }
          />
        </div>
      </section>
    </div>
  )
}
