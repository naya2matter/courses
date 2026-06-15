// ─── Session Summary Card ─────────────────────────────────────────────────────
// Renders the response of POST /user/online-courses/sessions/{sessionId}/end:
//   { session_id, attention_score, content_completed, course_progress_percentage }
//
// Design goals:
//   • Surface all three response fields clearly (attention score, completion,
//     course progress) — not just two numbers in a row.
//   • Animated radial gauge for the 0–100 attention score, colour-tiered by
//     engagement level.
//   • Fully responsive: stacks on mobile, two-column on >= sm.
//   • Dark, glassy aesthetic consistent with the content viewer.

import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import type { SessionEndResponse } from "@/types/user-online-course"

interface SessionSummaryCardProps {
  summary: SessionEndResponse["data"]
  /** Optional CTA — fired when the user clicks "Continue". */
  onContinue?: () => void
  /** Label for the continue button (e.g. the next content title). */
  continueLabel?: string | null
}

interface AttentionTier {
  label: string
  ring: string
  text: string
  glow: string
}

function getAttentionTier(score: number): AttentionTier {
  if (score >= 80) {
    return {
      label: "Highly engaged",
      ring: "stroke-emerald-400",
      text: "text-emerald-300",
      glow: "drop-shadow-[0_0_12px_rgba(52,211,153,0.55)]",
    }
  }
  if (score >= 60) {
    return {
      label: "Engaged",
      ring: "stroke-indigo-400",
      text: "text-indigo-300",
      glow: "drop-shadow-[0_0_12px_rgba(99,102,241,0.55)]",
    }
  }
  if (score >= 40) {
    return {
      label: "Partially focused",
      ring: "stroke-amber-400",
      text: "text-amber-300",
      glow: "drop-shadow-[0_0_12px_rgba(251,191,36,0.55)]",
    }
  }
  return {
    label: "Low engagement",
    ring: "stroke-rose-400",
    text: "text-rose-300",
    glow: "drop-shadow-[0_0_12px_rgba(251,113,133,0.5)]",
  }
}

/** Radial 0–100 gauge that animates its fill + numeric value on mount. */
function AttentionGauge({ score, tier }: { score: number; tier: AttentionTier }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 52
  const circumference = 2 * Math.PI * radius

  const [progress, setProgress] = useState(0)
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  // Animate the ring fill once the component mounts.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setProgress(safeScore))
    return () => window.cancelAnimationFrame(id)
  }, [safeScore])

  // Count the number up to the score for a touch of motion.
  useEffect(() => {
    const start = performance.now()
    const duration = 900

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(eased * safeScore))
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(step)
      }
    }

    rafRef.current = window.requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [safeScore])

  const dashoffset = circumference * (1 - progress / 100)

  return (
    <div className={`relative flex size-32 shrink-0 items-center justify-center ${tier.glow}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-white/8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className={`${tier.ring} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold tabular-nums ${tier.text}`}>{display}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
          / 100
        </span>
      </div>
    </div>
  )
}

export function SessionSummaryCard({ summary, onContinue, continueLabel }: SessionSummaryCardProps) {
  const score = Number(summary.attention_score) || 0
  const courseProgress = Math.max(0, Math.min(100, Number(summary.course_progress_percentage) || 0))
  const completed = Boolean(summary.content_completed)
  const tier = useMemo(() => getAttentionTier(score), [score])

  return (
    <section
      aria-label="Session summary"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] animate-in fade-in slide-in-from-bottom-3 duration-700 sm:p-7"
    >
      {/* Ambient glow */}
      <div
        className={`pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-[90px] ${
          completed ? "bg-emerald-500/15" : "bg-indigo-500/15"
        }`}
      />

      {/* Header */}
      <div className="relative flex items-center gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${
            completed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
          }`}
        >
          {completed ? <SparklesIcon className="size-5" /> : <CircleDashedIcon className="size-5" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
            {completed ? "Content completed" : "Session saved"}
          </h2>
          <p className="text-sm text-white/45">
            {completed
              ? "Nice work — your progress has been recorded."
              : "Your progress was saved. Finish the content to mark it complete."}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="relative mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        {/* Attention gauge */}
        <div className="flex flex-col items-center gap-2">
          <AttentionGauge score={score} tier={tier} />
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
              Attention score
            </p>
            <p className={`text-sm font-semibold ${tier.text}`}>{tier.label}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex w-full flex-1 flex-col gap-4">
          {/* Completion status */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                  completed ? "bg-emerald-500/12 text-emerald-400" : "bg-white/5 text-white/45"
                }`}
              >
                {completed ? (
                  <CheckCircle2Icon className="size-5" />
                ) : (
                  <CircleDashedIcon className="size-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/85">Content status</p>
                <p className="text-xs text-white/40">Marked complete at 95% watched</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                completed
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-amber-500/12 text-amber-300"
              }`}
            >
              {completed ? "Completed" : "In progress"}
            </span>
          </div>

          {/* Course progress */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/85">
                <TrendingUpIcon className="size-4 text-violet-300" />
                Course progress
              </div>
              <span className="text-sm font-bold tabular-nums text-white">
                {courseProgress.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 ring-1 ring-inset ring-white/5">
              <div
                className="h-full rounded-full bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_0_16px_rgba(139,92,246,0.5)] transition-[width] duration-1000 ease-out"
                style={{ width: `${courseProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Continue CTA */}
      {onContinue && (
        <div className="relative mt-6">
          <Button
            onClick={onContinue}
            className="group w-full rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 py-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400 sm:w-auto sm:px-6"
          >
            {continueLabel ? `Continue to ${continueLabel}` : "Continue"}
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      )}
    </section>
  )
}
