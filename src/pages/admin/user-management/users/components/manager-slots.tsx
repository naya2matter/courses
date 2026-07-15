// ─── ManagerSlots ─────────────────────────────────────────────────────────────
// Two labeled manager slots ("Primary" / "Secondary") backed by SearchableSelect.
// Enforces the backend contract by construction: max 2 managers, no duplicates,
// and the user can never pick themselves (excludeUserId).
//
// Emits a compact number[] — [] when none, [primary] when one, [primary, secondary]
// when both. The parent sends this straight through as `manager_ids`.

import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"

// Radix Select items cannot use an empty string as their value.
const NONE_VALUE = "__none__"

export interface ManagerOption {
  id: number
  name: string
  email: string
}

interface ManagerSlotsProps {
  /** Currently selected manager ids (0–2 entries). */
  value: number[]
  onChange: (ids: number[]) => void
  /** Full list of selectable users. */
  options: ManagerOption[]
  /** Exclude this user id from both slots (the user being edited). */
  excludeUserId?: number
  disabled?: boolean
  /** Placeholder while the option source is still loading. */
  isLoading?: boolean
}

export function ManagerSlots({
  value,
  onChange,
  options,
  excludeUserId,
  disabled,
  isLoading,
}: ManagerSlotsProps) {
  const primary = value[0]
  const secondary = value[1]

  // Selectable users, never including the user themselves.
  const base = options.filter((u) => u.id !== excludeUserId)

  const toOption = (u: ManagerOption) => ({
    value: String(u.id),
    label: `${u.name} (${u.email})`,
    keywords: u.email,
  })

  // Secondary cannot repeat the primary selection.
  const primaryOptions = base.map(toOption)
  const secondaryOptions = base
    .filter((u) => u.id !== primary)
    .map(toOption)

  function setPrimary(next: string) {
    if (next === NONE_VALUE) {
      // Clearing the primary drops the secondary too (no gaps).
      onChange([])
      return
    }
    const id = Number(next)
    // If the new primary equals the current secondary, collapse to one.
    onChange(secondary && secondary !== id ? [id, secondary] : [id])
  }

  function setSecondary(next: string) {
    if (!primary) return
    if (next === NONE_VALUE) {
      onChange([primary])
      return
    }
    onChange([primary, Number(next)])
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-1.5">
        <Label htmlFor="user-manager-primary">Primary manager</Label>
        <SearchableSelect
          id="user-manager-primary"
          value={primary ? String(primary) : NONE_VALUE}
          onValueChange={setPrimary}
          disabled={disabled || isLoading}
          placeholder={isLoading ? "Loading..." : "Select manager"}
          searchPlaceholder="Search users…"
          triggerClassName="h-9 w-full"
          emptyText="No users found"
          pinnedOptions={[{ value: NONE_VALUE, label: "No manager" }]}
          options={primaryOptions}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="user-manager-secondary">Secondary manager</Label>
        <SearchableSelect
          id="user-manager-secondary"
          value={secondary ? String(secondary) : NONE_VALUE}
          onValueChange={setSecondary}
          disabled={disabled || isLoading || !primary}
          placeholder={
            !primary ? "Select a primary manager first" : "Add a second manager (optional)"
          }
          searchPlaceholder="Search users…"
          triggerClassName="h-9 w-full"
          emptyText="No users found"
          pinnedOptions={[{ value: NONE_VALUE, label: "No second manager" }]}
          options={secondaryOptions}
        />
        <p className="text-xs text-muted-foreground">A user can report to up to two managers.</p>
      </div>
    </div>
  )
}
