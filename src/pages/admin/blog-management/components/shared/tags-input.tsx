// ─── TagsInput ────────────────────────────────────────────────────────────────
// Chip-based tag input.
// • Press Enter, Tab, or type a comma to confirm a tag.
// • Press Backspace on empty input to remove the last tag.
// • Duplicate tags are silently ignored.
// • Each tag is trimmed and must be non-empty.

import { useRef, useState, type KeyboardEvent } from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Add a tag…",
  disabled = false,
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag || value.includes(tag)) return
    onChange([...value, tag])
    setInputValue("")
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "Tab") {
      if (inputValue.trim()) {
        e.preventDefault()
        addTag(inputValue)
      }
      return
    }

    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
      return
    }

    if (e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    }
  }

  function handleBlur() {
    if (inputValue.trim()) addTag(inputValue)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // If the user pasted a comma-separated list, split it immediately
    if (raw.includes(",")) {
      const parts = raw.split(",")
      // All but the last become tags; last becomes the new draft
      parts.slice(0, -1).forEach((p) => addTag(p))
      setInputValue(parts[parts.length - 1])
    } else {
      setInputValue(raw)
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
              className="rounded-full hover:bg-primary/20 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        aria-label="Add tag"
      />
    </div>
  )
}
