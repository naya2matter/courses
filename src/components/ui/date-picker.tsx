import * as React from "react"
import { useRef, useEffect, useState, useMemo } from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon, ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H     = 36   // px height of each row
const VISIBLE    = 5    // how many rows are visible at once
const CONTAINER_H = ITEM_H * VISIBLE        // 180 px
const SPACER_H   = ITEM_H * Math.floor(VISIBLE / 2)  // 72 px — top/bottom padding

const HOURS   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const MINUTES = Array.from({ length: 60 }, (_, i) => i)
const PERIODS = ["AM", "PM"] as const

// ─── ScrollColumn ─────────────────────────────────────────────────────────────
// Drum-roll scroll list. Click an item or free-scroll; both snap and commit.

interface ScrollColumnProps<T extends number | string> {
  items: readonly T[]
  value: T
  onChange: (v: T) => void
  getLabel?: (v: T) => string
  width?: string
}

function ScrollColumn<T extends number | string>({
  items,
  value,
  onChange,
  getLabel,
  width = "flex-1",
}: ScrollColumnProps<T>) {
  const listRef    = useRef<HTMLDivElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const programRef = useRef(false)   // suppresses debounce during programmatic scrolls

  // Scroll to the selected item whenever value or items change (incl. popover open)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const idx = (items as readonly (number | string)[]).indexOf(value)
    if (idx === -1) return
    programRef.current = true
    el.scrollTop = idx * ITEM_H
    const raf = requestAnimationFrame(() => { programRef.current = false })
    return () => cancelAnimationFrame(raf)
  }, [value, items])

  function snapTo(idx: number, smooth = true) {
    const el = listRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    programRef.current = true
    el.scrollTo({ top: clamped * ITEM_H, behavior: smooth ? "smooth" : "instant" })
    setTimeout(() => { programRef.current = false }, 350)
    onChange(items[clamped] as T)
  }

  function handleScroll() {
    if (programRef.current) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const el = listRef.current
      if (!el) return
      snapTo(Math.round(el.scrollTop / ITEM_H), true)
    }, 80)
  }

  const label = (v: T) =>
    getLabel ? getLabel(v) : String(v).padStart(2, "0")

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className={cn("overflow-y-scroll", width)}
      style={{
        height: CONTAINER_H,
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none",
      }}
    >
      <div style={{ height: SPACER_H }} aria-hidden />

      {(items as readonly T[]).map((item, i) => (
        <div
          key={i}
          onClick={() => snapTo(i)}
          style={{ height: ITEM_H, scrollSnapAlign: "center" }}
          className={cn(
            "relative z-30 flex cursor-pointer select-none items-center justify-center text-sm transition-all duration-100",
            item === value
              ? "font-semibold text-foreground"
              : "text-muted-foreground/35 hover:text-muted-foreground/65",
          )}
        >
          {label(item)}
        </div>
      ))}

      <div style={{ height: SPACER_H }} aria-hidden />
    </div>
  )
}

// ─── ScrollTimePicker ─────────────────────────────────────────────────────────
// Popover with three drum-roll columns: [HH] : [MM] [AM|PM]
// value / onChange use 24-h "HH:mm" format.

interface ScrollTimePickerProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function ScrollTimePicker({
  value,
  onChange,
  disabled,
  children,
}: ScrollTimePickerProps) {
  const [open, setOpen] = useState(false)

  const parsed = useMemo(() => {
    if (!value) return { h12: 12, min: 0, ap: "AM" as "AM" | "PM" }
    const [hStr = "0", mStr = "0"] = value.split(":")
    const h24 = Math.max(0, Math.min(23, parseInt(hStr, 10) || 0))
    const min  = Math.max(0, Math.min(59, parseInt(mStr, 10) || 0))
    const ap   = h24 < 12 ? "AM" : "PM"
    const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
    return { h12, min, ap } as { h12: number; min: number; ap: "AM" | "PM" }
  }, [value])

  function emit(h12: number, min: number, ap: "AM" | "PM") {
    let h24 = h12
    if (ap === "AM") { if (h12 === 12) h24 = 0 }
    else             { if (h12 !== 12) h24 = h12 + 12 }
    onChange(`${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-44 overflow-hidden border border-white/10 bg-[#0e0d1f]/95 p-0 shadow-2xl backdrop-blur-xl"
        onInteractOutside={() => setOpen(false)}
      >
        {/* Column headers */}
        <div className="grid grid-cols-3 border-b border-white/[0.07] bg-white/[0.02] px-1 py-2 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Hour</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">Min</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40" />
        </div>

        {/* Drum-roll area */}
        <div className="relative flex">
          {/* Centre-row highlight band */}
          <div
            className="pointer-events-none absolute inset-x-2 z-10 rounded-lg bg-indigo-500/[0.08] ring-1 ring-inset ring-indigo-500/20"
            style={{ top: SPACER_H, height: ITEM_H }}
            aria-hidden
          />

          {/* Top fade */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20"
            style={{ height: SPACER_H, background: "linear-gradient(to bottom, #0e0d1f 30%, transparent)" }}
            aria-hidden
          />
          {/* Bottom fade */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
            style={{ height: SPACER_H, background: "linear-gradient(to top, #0e0d1f 30%, transparent)" }}
            aria-hidden
          />

          {/* Hours */}
          <ScrollColumn
            items={HOURS}
            value={parsed.h12}
            onChange={(h12) => emit(h12, parsed.min, parsed.ap)}
          />

          {/* Colon */}
          <div
            className="flex shrink-0 select-none items-center justify-center text-muted-foreground/25 text-sm"
            style={{ width: 10, paddingTop: SPACER_H + (ITEM_H - 20) / 2, alignSelf: "flex-start", height: SPACER_H + ITEM_H }}
            aria-hidden
          >
            :
          </div>

          {/* Minutes */}
          <ScrollColumn
            items={MINUTES}
            value={parsed.min}
            onChange={(min) => emit(parsed.h12, min, parsed.ap)}
          />

          {/* AM / PM */}
          <ScrollColumn
            items={PERIODS}
            value={parsed.ap}
            onChange={(ap) => emit(parsed.h12, parsed.min, ap as "AM" | "PM")}
            getLabel={(v) => String(v)}
            width="w-12"
          />
        </div>

        {/* Done button */}
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-md bg-indigo-500/15 py-1.5 text-[11px] font-semibold tracking-wide text-indigo-300 ring-1 ring-inset ring-indigo-500/25 transition-colors hover:bg-indigo-500/25 hover:text-indigo-200"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hhmm: string): string {
  if (!hhmm) return ""
  const [hStr = "0", mStr = "0"] = hhmm.split(":")
  const h24 = parseInt(hStr, 10) || 0
  const min  = parseInt(mStr, 10) || 0
  const ap   = h24 < 12 ? "AM" : "PM"
  const h12  = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return `${String(h12).padStart(2, "0")}:${String(min).padStart(2, "0")} ${ap}`
}

// ─── DatePickerField ──────────────────────────────────────────────────────────
// Drop-in for <Input type="date" value="YYYY-MM-DD" onChange={…} />

interface DatePickerFieldProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => {
    if (!value) return undefined
    const d = parse(value, "yyyy-MM-dd", new Date())
    return isValid(d) ? d : undefined
  }, [value])

  function handleSelect(date: Date | undefined) {
    onChange(date ? format(date, "yyyy-MM-dd") : "")
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
            "hover:bg-muted/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <CalendarIcon className="size-3.5 shrink-0 text-indigo-400/80" />
          <span className={cn("flex-1 text-left", selected ? "text-foreground" : "text-muted-foreground/60")}>
            {selected ? format(selected, "PPP") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  )
}

// ─── DateTimePickerField ──────────────────────────────────────────────────────
// Unified field: [📅 calendar trigger] | [🕐 scroll-wheel time trigger]
// Drop-in for <Input type="datetime-local" value="YYYY-MM-DDTHH:mm" onChange={…} />

interface DateTimePickerFieldProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  className,
}: DateTimePickerFieldProps) {
  const [calOpen, setCalOpen] = useState(false)

  const [datePart, timePart] = useMemo(() => {
    if (!value) return ["", ""]
    const idx = value.indexOf("T")
    if (idx === -1) return [value, ""]
    return [value.slice(0, idx), value.slice(idx + 1, idx + 6)]
  }, [value])

  const selected = useMemo(() => {
    if (!datePart) return undefined
    const d = parse(datePart, "yyyy-MM-dd", new Date())
    return isValid(d) ? d : undefined
  }, [datePart])

  function handleDateSelect(date: Date | undefined) {
    if (!date) { onChange(""); setCalOpen(false); return }
    const newDate = format(date, "yyyy-MM-dd")
    const newTime = timePart || "00:00"
    onChange(`${newDate}T${newTime}`)
    setCalOpen(false)
  }

  function handleTimeChange(t: string) {
    if (!datePart) return
    onChange(t ? `${datePart}T${t}` : datePart)
  }

  const timeLabel = timePart ? formatTime(timePart) : "--:-- --"

  return (
    <div
      className={cn(
        "flex h-9 w-full overflow-hidden rounded-md border border-input bg-background shadow-sm transition-colors",
        "focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {/* ── Date section ── */}
      <Popover open={calOpen} onOpenChange={setCalOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex flex-1 items-center gap-2 px-3 text-sm transition-colors hover:bg-muted/30 focus:outline-none"
          >
            <CalendarIcon className="size-3.5 shrink-0 text-indigo-400/80" />
            <span className={cn("min-w-0 truncate text-left", selected ? "text-foreground" : "text-muted-foreground/55")}>
              {selected ? format(selected, "PPP") : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={selected} onSelect={handleDateSelect} />
        </PopoverContent>
      </Popover>

      {/* ── Divider ── */}
      <div className="my-1.5 w-px shrink-0 bg-border/60" />

      {/* ── Time trigger → scroll-wheel popover ── */}
      <ScrollTimePicker
        value={timePart}
        onChange={handleTimeChange}
        disabled={disabled || !datePart}
      >
        <button
          type="button"
          disabled={disabled || !datePart}
          className={cn(
            "flex shrink-0 items-center gap-1.5 px-2.5 text-sm transition-colors",
            "hover:bg-muted/30 focus:outline-none",
            "disabled:cursor-not-allowed",
            !datePart && "opacity-35",
          )}
        >
          <ClockIcon className="size-3.5 shrink-0 text-indigo-400/70" />
          <span className={cn("tabular-nums", timePart ? "text-foreground" : "text-muted-foreground/50")}>
            {timeLabel}
          </span>
        </button>
      </ScrollTimePicker>
    </div>
  )
}

// ─── TimePickerField ──────────────────────────────────────────────────────────
// Standalone time-only picker — drop-in for <Input type="time" value="HH:mm" onChange={…} />
// Shows a trigger button that opens the scroll-wheel popover.

interface TimePickerFieldProps {
  value: string          // "HH:mm" 24-h format, or ""
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TimePickerField({
  value,
  onChange,
  placeholder = "Pick a time",
  disabled,
  className,
}: TimePickerFieldProps) {
  const label = value ? formatTime(value) : placeholder

  return (
    <ScrollTimePicker value={value} onChange={onChange} disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
          "hover:bg-muted/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground/60",
          className,
        )}
      >
        <ClockIcon className="size-3.5 shrink-0 text-indigo-400/70" />
        <span className={cn("tabular-nums", value ? "text-foreground" : "text-muted-foreground/55")}>
          {label}
        </span>
      </button>
    </ScrollTimePicker>
  )
}

// ─── DurationPickerField ──────────────────────────────────────────────────────
// Wheel picker for a DURATION quantity — NOT a time-of-day, so no AM/PM.
//   mode="hm" → [Hours] : [Minutes], value = total MINUTES  (e.g. "120" → 2h 0m)
//   mode="ms" → [Minutes] : [Seconds], value = total SECONDS (e.g. "90"  → 1m 30s)
// Drop-in for <Input type="number" value={string} onChange={setString} />.

const DUR_HOURS  = Array.from({ length: 100 }, (_, i) => i)  // 0–99  (hm: hours)
const DUR_MIN60  = Array.from({ length: 60 }, (_, i) => i)   // 0–59  (minutes / seconds)
const DUR_MIN300 = Array.from({ length: 300 }, (_, i) => i)  // 0–299 (ms: minutes → up to ~5h)

interface ScrollDurationPickerProps {
  mode: "hm" | "ms"
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  children: React.ReactNode
}

function ScrollDurationPicker({
  mode,
  value,
  onChange,
  disabled,
  children,
}: ScrollDurationPickerProps) {
  const [open, setOpen] = useState(false)

  const total = Math.max(0, parseInt(value, 10) || 0)
  const right = total % 60
  const leftItems = mode === "hm" ? DUR_HOURS : DUR_MIN300
  const left = Math.min(Math.floor(total / 60), leftItems[leftItems.length - 1])
  const leftLabel = mode === "hm" ? "Hour" : "Min"
  const rightLabel = mode === "hm" ? "Min" : "Sec"

  function emit(l: number, r: number) {
    onChange(String(l * 60 + r))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-40 overflow-hidden border border-white/10 bg-[#0e0d1f]/95 p-0 shadow-2xl backdrop-blur-xl"
        onInteractOutside={() => setOpen(false)}
      >
        {/* Column headers */}
        <div className="grid grid-cols-2 border-b border-white/[0.07] bg-white/[0.02] px-1 py-2 text-center">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">{leftLabel}</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40">{rightLabel}</span>
        </div>

        {/* Drum-roll area */}
        <div className="relative flex">
          <div
            className="pointer-events-none absolute inset-x-2 z-10 rounded-lg bg-indigo-500/[0.08] ring-1 ring-inset ring-indigo-500/20"
            style={{ top: SPACER_H, height: ITEM_H }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20"
            style={{ height: SPACER_H, background: "linear-gradient(to bottom, #0e0d1f 30%, transparent)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
            style={{ height: SPACER_H, background: "linear-gradient(to top, #0e0d1f 30%, transparent)" }}
            aria-hidden
          />

          <ScrollColumn
            items={leftItems}
            value={left}
            onChange={(l) => emit(l, right)}
          />

          <div
            className="flex shrink-0 select-none items-center justify-center text-muted-foreground/25 text-sm"
            style={{ width: 10, paddingTop: SPACER_H + (ITEM_H - 20) / 2, alignSelf: "flex-start", height: SPACER_H + ITEM_H }}
            aria-hidden
          >
            :
          </div>

          <ScrollColumn
            items={DUR_MIN60}
            value={right}
            onChange={(r) => emit(left, r)}
          />
        </div>

        {/* Done button */}
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-3 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-md bg-indigo-500/15 py-1.5 text-[11px] font-semibold tracking-wide text-indigo-300 ring-1 ring-inset ring-indigo-500/25 transition-colors hover:bg-indigo-500/25 hover:text-indigo-200"
          >
            Done
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function formatDuration(value: string, mode: "hm" | "ms"): string {
  const total = Math.max(0, parseInt(value, 10) || 0)
  const l = Math.floor(total / 60)
  const r = total % 60
  if (mode === "hm") {
    if (l && r) return `${l}h ${r}m`
    if (l) return `${l}h`
    return `${r}m`
  }
  if (l && r) return `${l}m ${r}s`
  if (l) return `${l}m`
  return `${r}s`
}

interface DurationPickerFieldProps {
  value: string | number
  onChange: (v: string) => void
  mode?: "hm" | "ms"
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DurationPickerField({
  value,
  onChange,
  mode = "hm",
  placeholder = "Set duration",
  disabled,
  className,
}: DurationPickerFieldProps) {
  const strValue = value == null ? "" : String(value)
  const hasValue = strValue !== "" && (parseInt(strValue, 10) || 0) > 0
  const label = hasValue ? formatDuration(strValue, mode) : placeholder

  return (
    <ScrollDurationPicker mode={mode} value={strValue} onChange={onChange} disabled={disabled}>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
          "hover:bg-muted/30 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !hasValue && "text-muted-foreground/60",
          className,
        )}
      >
        <ClockIcon className="size-3.5 shrink-0 text-indigo-400/70" />
        <span className={cn("tabular-nums", hasValue ? "text-foreground" : "text-muted-foreground/55")}>
          {label}
        </span>
      </button>
    </ScrollDurationPicker>
  )
}
