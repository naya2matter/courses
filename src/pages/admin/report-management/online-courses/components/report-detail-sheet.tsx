// ─── Report Detail Sheet ──────────────────────────────────────────────────────
// Reusable slide-over for a single report record fetched by id. Handles the
// loading / error(404) / loaded states; the caller supplies the field rows.

import { AlertCircleIcon, Loader2Icon } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  isLoading: boolean
  error: string | null
  children: React.ReactNode
}

export function ReportDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  isLoading,
  error,
  children,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-white/10 bg-[#0b0b14] sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="px-4 pb-8">
          {isLoading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-white/50">
              <Loader2Icon className="size-4 animate-spin" />
              Loading details…
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-3 text-sm text-rose-300">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-0">{children}</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Header ───────────────────────────────────────────────────────────────────

/** Colored avatar circle + primary name + subtitle line. */
export function ReportDetailHeader({
  initial,
  name,
  subtitle,
  color = "indigo",
}: {
  initial: string
  name: string
  subtitle?: string
  color?: "indigo" | "sky" | "emerald" | "amber"
}) {
  const colors: Record<string, string> = {
    indigo:  "bg-indigo-500/20 text-indigo-300 ring-indigo-500/30",
    sky:     "bg-sky-500/20 text-sky-300 ring-sky-500/30",
    emerald: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
    amber:   "bg-amber-500/20 text-amber-300 ring-amber-500/30",
  }
  return (
    <div className="flex items-center gap-3 pb-5 pt-1">
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1 ${colors[color]}`}
      >
        {initial.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-base font-semibold text-white leading-snug truncate">{name}</p>
        {subtitle && <p className="text-sm text-white/45 truncate mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// ── Metric chips row ──────────────────────────────────────────────────────────

interface MetricChip {
  label: string
  value: string
  color: "emerald" | "amber" | "rose" | "indigo" | "sky" | "white"
}

const CHIP_COLORS: Record<MetricChip["color"], string> = {
  emerald: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  amber:   "bg-amber-500/12 text-amber-300 border-amber-500/25",
  rose:    "bg-rose-500/12 text-rose-300 border-rose-500/25",
  indigo:  "bg-indigo-500/12 text-indigo-300 border-indigo-500/25",
  sky:     "bg-sky-500/12 text-sky-300 border-sky-500/25",
  white:   "bg-white/8 text-white/60 border-white/12",
}

export function ReportMetricChips({ chips }: { chips: MetricChip[] }) {
  return (
    <div className="flex flex-wrap gap-2 pb-4">
      {chips.map((c) => (
        <div
          key={c.label}
          className={`flex flex-col rounded-xl border px-3 py-2 ${CHIP_COLORS[c.color]}`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">{c.label}</span>
          <span className="text-base font-bold tabular-nums leading-tight">{c.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────

export function ReportDetailSection({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="pb-2 pt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/28">
        {label}
      </p>
      <div className="rounded-xl border border-white/6 bg-white/2 px-3 py-1">
        {children}
      </div>
    </div>
  )
}

// ── Field row ─────────────────────────────────────────────────────────────────

/** A single label/value row inside a ReportDetailSection. */
export function DetailField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-2.5 text-sm last:border-0">
      <span className="text-white/50 shrink-0">{label}</span>
      <span className="min-w-0 text-right font-medium text-white/90 break-words">{value}</span>
    </div>
  )
}
