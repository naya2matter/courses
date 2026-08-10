// ─── SearchableSelect ─────────────────────────────────────────────────────────
// A Select with a sticky search box at the top of the dropdown that filters its
// options client-side. Built on top of the shadcn Select primitives so it shares
// the same styling, keyboard behavior, and popover positioning.
//
// Extracted from the inline pattern originally used in the Online Course
// Assignments filters toolbar so every searchable dropdown stays consistent.

import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { Loader2Icon, SearchIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface SearchableSelectOption {
  value: string
  label: string
  /** Extra text to match against while searching (e.g. email, department). */
  keywords?: string
  disabled?: boolean
  /** Optional custom node rendered inside the item instead of `label`. */
  node?: ReactNode
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  triggerClassName?: string
  contentClassName?: string
  disabled?: boolean
  emptyText?: string
  /** Options always shown at the top, exempt from filtering (e.g. "All", "None"). */
  pinnedOptions?: SearchableSelectOption[]
  id?: string
  /**
   * Called (debounced ~300ms) with the current search text whenever it
   * changes, for callers that back this dropdown with a remote/paginated
   * search instead of a fully preloaded `options` list.
   */
  onSearchChange?: (term: string) => void
  /** Shows a spinner in place of the search icon while a remote search is in flight. */
  isSearching?: boolean
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  triggerClassName,
  contentClassName,
  disabled,
  emptyText = "No results",
  pinnedOptions,
  id,
  onSearchChange,
  isSearching,
}: SearchableSelectProps) {
  const [search, setSearch] = useState("")
  const inputId = useId()

  // Debounce onSearchChange so remote-search callers don't fire a request per keystroke.
  useEffect(() => {
    if (!onSearchChange) return
    const timer = setTimeout(() => onSearchChange(search), 300)
    return () => clearTimeout(timer)
  }, [search, onSearchChange])

  // Defensive: upstream data (API responses, store state) occasionally
  // contains a stray null/undefined entry instead of a real option object
  // (e.g. a list built from ids that no longer resolve to a record). Drop
  // those here so one bad entry can't crash every dropdown that uses this
  // component.
  const safeOptions = useMemo(
    () => options.filter((o): o is SearchableSelectOption => o != null),
    [options],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return safeOptions
    return safeOptions.filter((o) =>
      `${o.label} ${o.keywords ?? ""}`.toLowerCase().includes(q),
    )
  }, [safeOptions, search])

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      onOpenChange={(open) => {
        if (!open) setSearch("")
      }}
    >
      <SelectTrigger id={id} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={contentClassName ?? "max-h-[420px]"}
        position="popper"
        sideOffset={4}
      >
        {/* Sticky search header */}
        <div className="sticky top-0 z-10 bg-popover px-2 pt-2 pb-1">
          <div className="relative">
            {isSearching ? (
              <Loader2Icon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <SearchIcon className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              id={inputId}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              // Stop Radix Select's typeahead from hijacking keystrokes.
              onKeyDown={(e) => e.stopPropagation()}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
            />
          </div>
        </div>

        {/* Pinned options (not filtered) */}
        {pinnedOptions?.filter((o) => o != null).map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.node ?? o.label}
          </SelectItem>
        ))}

        {/* Filtered options */}
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          filtered.map((o) => (
            <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
              {o.node ?? o.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
