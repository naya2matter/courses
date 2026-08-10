// ─── Number Field ───────────────────────────────────────────────────────────────
// A numeric input that keeps its own raw text buffer.
//
// Binding a plain <Input type="number"> straight to a number is subtly broken:
// `Number("")` is 0, so clearing the box silently writes 0, and `Number("0.")`
// is 0, so the trailing dot is eaten the moment you try to type "0.35". Here the
// text the client typed is what stays on screen, and an empty/unparseable box
// reports NaN upward — which validation surfaces as "required" rather than
// quietly saving a wrong number.

import { useState } from "react"
import { AlertCircleIcon, AlertTriangleIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

function toRaw(value: number): string {
  return Number.isFinite(value) ? String(value) : ""
}

function parseRaw(text: string): number {
  return text.trim() === "" ? NaN : Number(text)
}

interface NumberFieldProps {
  label?: string
  value: number
  onChange: (value: number) => void
  /** Blocking validation message; switches the field to its error styling. */
  error?: string
  /** Non-blocking advisory; amber styling, and never marks the field invalid. */
  warning?: string
  /** Shown when there is neither an error nor a warning. */
  hint?: string
  /** Unit rendered inside the right edge of the input, e.g. "%" or "pts". */
  suffix?: string
  step?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

export function NumberField({
  label,
  value,
  onChange,
  error,
  warning,
  hint,
  suffix,
  step = "any",
  placeholder,
  disabled,
  className,
  inputClassName,
  ariaLabel,
}: NumberFieldProps) {
  const [raw, setRaw] = useState(() => toRaw(value))
  const [lastExternal, setLastExternal] = useState(value)

  // Adopt values changed from outside (discard, restore, save) without wiping
  // what is currently being typed. Object.is keeps NaN === NaN comparisons sane.
  if (!Object.is(value, lastExternal)) {
    setLastExternal(value)
    if (!Object.is(parseRaw(raw), value)) setRaw(toRaw(value))
  }

  function handleChange(text: string) {
    setRaw(text)
    const parsed = parseRaw(text)
    // Record our own edit as the latest external value, so the sync check above
    // doesn't treat the round-trip through the parent as an outside change.
    setLastExternal(parsed)
    onChange(parsed)
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label className="text-xs font-medium text-white/60">{label}</Label>}

      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          value={raw}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          aria-invalid={error ? true : undefined}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "h-9 border-white/10 bg-white/5 text-sm text-white tabular-nums placeholder:text-white/25",
            "focus-visible:border-indigo-400/60 focus-visible:ring-indigo-500/20",
            // The browser's native number-input spinner brings its own widget
            // chrome (a shadowed up/down control on hover) that our styling
            // can't reach — drop it so only our own box renders.
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            suffix && "pr-9",
            error && "border-red-500/50 bg-red-500/5 focus-visible:border-red-500/60 focus-visible:ring-red-500/20",
            !error && warning && "border-amber-500/40 focus-visible:border-amber-500/60 focus-visible:ring-amber-500/20",
            inputClassName,
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-white/30">
            {suffix}
          </span>
        )}
      </div>

      {error ? (
        <p className="flex items-start gap-1 text-[11px] leading-snug text-red-400">
          <AlertCircleIcon className="mt-px size-3 shrink-0" />
          {error}
        </p>
      ) : warning ? (
        <p className="flex items-start gap-1 text-[11px] leading-snug text-amber-400/90">
          <AlertTriangleIcon className="mt-px size-3 shrink-0" />
          {warning}
        </p>
      ) : hint ? (
        <p className="text-[11px] leading-snug text-white/30">{hint}</p>
      ) : null}
    </div>
  )
}
