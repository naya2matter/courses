// ─── Attention Score Config Validation ─────────────────────────────────────────
// Client-side validation mirroring the backend rules, so the client sees what is
// wrong *before* saving — saving kicks off a full historical recalculation, so a
// rejected save is expensive to discover late.
//
// Errors block saving. Warnings do not — they flag configurations that are legal
// but probably not what was intended (gaps between bands, weights with no effect).

import type {
  AttentionScoreConfigData,
  MinMaxAdjustmentBand,
  MinMaxPointsBand,
  ThresholdAdjustmentBand,
} from "../types/attention-score.types"

/** Card/section a given issue belongs to — drives the inline error badges. */
export type SectionKey =
  | "weights"
  | "watch_time"
  | "engagement"
  | "completion"
  | "skip_ratio"
  | "consistency"
  | "risk_levels"
  | "blended"

export interface ConfigIssue {
  section: SectionKey
  /** Dot/bracket path into the config, e.g. `video.time_ratio_bands[2].max`. */
  path: string
  message: string
  severity: "error" | "warning"
}

export interface ValidationResult {
  issues: ConfigIssue[]
  errors: ConfigIssue[]
  warnings: ConfigIssue[]
  /** True when there are no errors (warnings are allowed through). */
  isValid: boolean
  errorsBySection: Record<SectionKey, ConfigIssue[]>
  warningsBySection: Record<SectionKey, ConfigIssue[]>
  /** Every errored path, for O(1) lookup when rendering a field. */
  errorPaths: Set<string>
  /**
   * The issue to show under each field. Errors take precedence over warnings on
   * the same path — the severity has to travel with the message so a warning is
   * never rendered with error styling.
   */
  issueByPath: Record<string, ConfigIssue>
}

// Float sums (0.4 + 0.3 + 0.2 + 0.1 = 0.9999999999999999) need a tolerance.
const EPSILON = 1e-6

const SECTIONS: SectionKey[] = [
  "weights",
  "watch_time",
  "engagement",
  "completion",
  "skip_ratio",
  "consistency",
  "risk_levels",
  "blended",
]

// ── Small assertion helpers ───────────────────────────────────────────────────

class IssueCollector {
  readonly issues: ConfigIssue[] = []

  add(section: SectionKey, path: string, message: string, severity: ConfigIssue["severity"] = "error") {
    this.issues.push({ section, path, message, severity })
  }

  /** Rejects NaN/Infinity — a cleared numeric input parses to NaN by design. */
  number(section: SectionKey, path: string, value: number, label: string): boolean {
    if (!Number.isFinite(value)) {
      this.add(section, path, `${label} is required and must be a number.`)
      return false
    }
    return true
  }

  range(section: SectionKey, path: string, value: number, label: string, min: number, max: number) {
    if (!this.number(section, path, value, label)) return
    if (value < min || value > max) {
      this.add(section, path, `${label} must be between ${min} and ${max}.`)
    }
  }

  atLeast(section: SectionKey, path: string, value: number, label: string, min: number) {
    if (!this.number(section, path, value, label)) return
    if (value < min) this.add(section, path, `${label} cannot be less than ${min}.`)
  }
}

/**
 * Shared rules for every band table.
 *
 * `hasMin` tables ({min,max,value}) must be ascending and contiguous; threshold
 * tables ({max,value}) only need ascending maxima. Both want exactly one
 * open-ended (`max: null`) row, and it has to be last, or some inputs fall
 * through every band and score nothing.
 */
function validateBands(
  c: IssueCollector,
  section: SectionKey,
  basePath: string,
  label: string,
  rows: Array<{ min?: number; max: number | null }>,
  opts: { hasMin: boolean; valueField: "points" | "adjustment"; valueMustBeNonNegative: boolean },
) {
  if (rows.length === 0) {
    c.add(section, basePath, `${label} needs at least one band.`)
    return
  }

  const openEnded: number[] = []

  rows.forEach((row, i) => {
    const rowPath = `${basePath}[${i}]`
    const value = (row as Record<string, unknown>)[opts.valueField] as number

    if (opts.hasMin) {
      const min = row.min as number
      if (c.number(section, `${rowPath}.min`, min, "Min")) {
        if (min < 0) c.add(section, `${rowPath}.min`, "Min cannot be negative.")
      }
    }

    if (row.max === null) {
      openEnded.push(i)
    } else if (c.number(section, `${rowPath}.max`, row.max, "Max")) {
      if (opts.hasMin && Number.isFinite(row.min) && row.max <= (row.min as number)) {
        c.add(section, `${rowPath}.max`, "Max must be greater than Min.")
      }
    }

    if (c.number(section, `${rowPath}.${opts.valueField}`, value, opts.valueField === "points" ? "Points" : "Adjustment")) {
      if (opts.valueMustBeNonNegative && value < 0) {
        c.add(section, `${rowPath}.${opts.valueField}`, "Points cannot be negative.")
      }
    }
  })

  // Exactly one open-ended band, and it must be the final row.
  if (openEnded.length > 1) {
    openEnded.slice(1).forEach((i) => {
      c.add(section, `${basePath}[${i}].max`, "Only one band can be open-ended (blank Max).")
    })
  } else if (openEnded.length === 1 && openEnded[0] !== rows.length - 1) {
    c.add(section, `${basePath}[${openEnded[0]}].max`, "The open-ended band (blank Max) must be the last row.")
  } else if (openEnded.length === 0) {
    c.add(
      section,
      `${basePath}[${rows.length - 1}].max`,
      "No open-ended band — values above the highest Max score nothing. Leave the last Max blank to cover them.",
      "warning",
    )
  }

  // Ordering and coverage between consecutive rows.
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1]
    const curr = rows[i]
    const prevPath = `${basePath}[${i - 1}]`
    const currPath = `${basePath}[${i}]`

    if (prev.max === null) {
      c.add(section, `${prevPath}.max`, "An open-ended band must be last — rows after it are unreachable.")
      continue
    }

    if (opts.hasMin) {
      if (!Number.isFinite(curr.min) || !Number.isFinite(prev.min)) continue
      if ((curr.min as number) < (prev.min as number)) {
        c.add(section, `${currPath}.min`, "Bands must be listed in ascending order.")
      } else if ((curr.min as number) < prev.max) {
        c.add(section, `${currPath}.min`, `Overlaps the previous band (which ends at ${prev.max}).`, "warning")
      } else if ((curr.min as number) > prev.max) {
        c.add(section, `${currPath}.min`, `Gap between ${prev.max} and ${curr.min} — values in between score nothing.`, "warning")
      }
    } else if (curr.max !== null && Number.isFinite(curr.max) && Number.isFinite(prev.max)) {
      if (curr.max <= prev.max) {
        c.add(section, `${currPath}.max`, "Thresholds must increase down the table.")
      }
    }
  }
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function validateConfig(config: AttentionScoreConfigData): ValidationResult {
  const c = new IssueCollector()
  const v = config.video

  // ── Component weights — must total exactly 100 ──
  const w = v.weights
  c.range("weights", "video.weights.watch_time", w.watch_time, "Watch time weight", 0, 100)
  c.range("weights", "video.weights.engagement", w.engagement, "Engagement weight", 0, 100)
  c.range("weights", "video.weights.completion", w.completion, "Completion weight", 0, 100)

  const weightSum = w.watch_time + w.engagement + w.completion
  if (Number.isFinite(weightSum) && Math.abs(weightSum - 100) > EPSILON) {
    c.add(
      "weights",
      "video.weights",
      `The three weights total ${round(weightSum)} — they must total exactly 100.`,
    )
  }

  // ── Watch time ──
  validateBands(c, "watch_time", "video.time_ratio_bands", "Time ratio bands", v.time_ratio_bands as MinMaxPointsBand[], {
    hasMin: true,
    valueField: "points",
    valueMustBeNonNegative: true,
  })
  if (c.number("watch_time", "video.allowed_review_window_multiplier", v.allowed_review_window_multiplier, "Review window multiplier")) {
    if (v.allowed_review_window_multiplier <= 0) {
      c.add("watch_time", "video.allowed_review_window_multiplier", "Review window multiplier must be greater than 0.")
    } else if (v.allowed_review_window_multiplier < 1) {
      c.add(
        "watch_time",
        "video.allowed_review_window_multiplier",
        "Below 1 means a learner is penalised for watching the video once through.",
        "warning",
      )
    }
  }

  // ── Engagement ──
  c.atLeast("engagement", "video.engagement_base_points", v.engagement_base_points, "Base points", 0)
  validateBands(c, "engagement", "video.speed_change_bands", "Speed-change bands", v.speed_change_bands as MinMaxAdjustmentBand[], {
    hasMin: true,
    valueField: "adjustment",
    valueMustBeNonNegative: false,
  })

  // ── Completion ──
  validateBands(c, "completion", "video.completion_bands", "Completion bands", v.completion_bands as MinMaxPointsBand[], {
    hasMin: true,
    valueField: "points",
    valueMustBeNonNegative: true,
  })

  // ── Skip ratio (threshold-only bands) ──
  validateBands(c, "skip_ratio", "video.skip_ratio_bands", "Skip ratio bands", v.skip_ratio_bands as ThresholdAdjustmentBand[], {
    hasMin: false,
    valueField: "adjustment",
    valueMustBeNonNegative: false,
  })

  // ── Consistency validation ──
  const cv = v.consistency_validation
  c.range("consistency", "video.consistency_validation.completion_threshold", cv.completion_threshold, "Completion threshold", 0, 100)
  c.range("consistency", "video.consistency_validation.skip_ratio_threshold", cv.skip_ratio_threshold, "Skip ratio threshold", 0, 100)
  if (c.number("consistency", "video.consistency_validation.penalty", cv.penalty, "Penalty") && cv.penalty === 0) {
    c.add("consistency", "video.consistency_validation.penalty", "A penalty of 0 means this rule has no effect.", "warning")
  }

  // ── Risk levels — high must sit below medium ──
  const r = config.risk_levels
  c.range("risk_levels", "risk_levels.high_below", r.high_below, "High risk threshold", 0, 100)
  c.range("risk_levels", "risk_levels.medium_below", r.medium_below, "Medium risk threshold", 0, 100)
  if (Number.isFinite(r.high_below) && Number.isFinite(r.medium_below) && r.high_below >= r.medium_below) {
    c.add(
      "risk_levels",
      "risk_levels.high_below",
      "The high-risk threshold must be lower than the medium-risk threshold.",
    )
  }

  // ── Blended score weights — must total exactly 1.00 ──
  const b = config.blended_score_weights
  c.range("blended", "blended_score_weights.completion", b.completion, "Completion weight", 0, 1)
  c.range("blended", "blended_score_weights.progress", b.progress, "Progress weight", 0, 1)
  c.range("blended", "blended_score_weights.attention", b.attention, "Attention weight", 0, 1)
  c.range("blended", "blended_score_weights.quiz", b.quiz, "Quiz weight", 0, 1)

  const blendedSum = b.completion + b.progress + b.attention + b.quiz
  if (Number.isFinite(blendedSum) && Math.abs(blendedSum - 1) > EPSILON) {
    c.add(
      "blended",
      "blended_score_weights",
      `The four weights total ${blendedSum.toFixed(2)} — they must total exactly 1.00.`,
    )
  }

  c.atLeast(
    "blended",
    "blended_score_weights.suspicious_penalty_multiplier",
    b.suspicious_penalty_multiplier,
    "Suspicious-session penalty multiplier",
    0,
  )
  if (Number.isFinite(b.suspicious_penalty_multiplier) && b.suspicious_penalty_multiplier > 1) {
    c.add(
      "blended",
      "blended_score_weights.suspicious_penalty_multiplier",
      "Above 1 rewards suspicious sessions instead of penalising them.",
      "warning",
    )
  }

  return summarise(c.issues)
}

// ── Result shaping ────────────────────────────────────────────────────────────

function round(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function emptyBuckets(): Record<SectionKey, ConfigIssue[]> {
  const buckets = {} as Record<SectionKey, ConfigIssue[]>
  SECTIONS.forEach((s) => { buckets[s] = [] })
  return buckets
}

function summarise(issues: ConfigIssue[]): ValidationResult {
  const errors = issues.filter((i) => i.severity === "error")
  const warnings = issues.filter((i) => i.severity === "warning")

  const errorsBySection = emptyBuckets()
  const warningsBySection = emptyBuckets()
  errors.forEach((i) => errorsBySection[i.section].push(i))
  warnings.forEach((i) => warningsBySection[i.section].push(i))

  const issueByPath: Record<string, ConfigIssue> = {}
  // Errors take precedence over warnings for the same field.
  warnings.forEach((i) => { if (!issueByPath[i.path]) issueByPath[i.path] = i })
  errors.forEach((i) => { issueByPath[i.path] = i })

  return {
    issues,
    errors,
    warnings,
    isValid: errors.length === 0,
    errorsBySection,
    warningsBySection,
    errorPaths: new Set(errors.map((i) => i.path)),
    issueByPath,
  }
}
