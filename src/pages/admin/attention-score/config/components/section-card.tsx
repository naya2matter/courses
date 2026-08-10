// ─── Section Card ───────────────────────────────────────────────────────────────
// Shared shell for every block of the config editor: a title, a plain-English
// explanation of what the numbers do, an optional right-hand slot (the live
// "must total 100" indicators), and an error/warning count so a section with
// problems is obvious without scrolling into it. Deliberately plain — no icon
// tiles or decorative charts, to match the rest of the admin UI.

import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  icon: React.ElementType
  title: string
  description?: string
  errorCount?: number
  warningCount?: number
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function SectionCard({
  icon: Icon,
  title,
  description,
  errorCount = 0,
  warningCount = 0,
  aside,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        // overflow-hidden keeps the header's bottom border from poking past the
        // rounded corners — without it the corner shows a 1-2px square seam.
        "overflow-hidden rounded-xl border bg-card/40 transition-colors",
        errorCount > 0 ? "border-red-500/25" : "border-white/10",
        className,
      )}
    >
      {/*
        A plain div, not <header> — the app has a global `header { ... }` rule
        (src/index.css) meant for the top bar that adds its own border, rounded
        corners, drop shadow, and !important margins to every <header> element.
        Using that tag here caused a double border and a shadow under each row.
      */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 shrink-0 text-white/35" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-red-400">
                <AlertCircleIcon className="size-3" />
                {errorCount} {errorCount === 1 ? "error" : "errors"}
              </span>
            )}
            {errorCount === 0 && warningCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400/90">
                <AlertTriangleIcon className="size-3" />
                {warningCount} {warningCount === 1 ? "warning" : "warnings"}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-white/40">{description}</p>
          )}
        </div>

        {aside && <div className="shrink-0">{aside}</div>}
      </div>

      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}

/**
 * Live "these must total N" pill used by the two weight sections. Reads as a
 * running tally while editing rather than an error that appears only on save.
 */
export function SumIndicator({
  sum,
  target,
  decimals = 0,
}: {
  sum: number
  target: number
  decimals?: number
}) {
  const valid = Number.isFinite(sum) && Math.abs(sum - target) < 1e-6
  const shown = Number.isFinite(sum) ? sum.toFixed(decimals) : "—"

  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        valid ? "text-white/35" : "text-red-400",
      )}
    >
      Sum {shown} / {target.toFixed(decimals)}
    </span>
  )
}
