// ─── EvaluationConfigTable ────────────────────────────────────────────────────
// Card-based list of evaluation configs. Each card has a collapsible section
// that shows the config's sub-types via EvaluationTypeInlineSection.
// Works for all screen sizes (no separate mobile component needed).

import { useState } from "react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type { EvaluationConfig } from "../types/evaluation-config.types"
import { AppliesToBadge } from "./applies-to-badge"
import { EvaluationTypeInlineSection } from "./evaluation-type-inline-section"

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface EvaluationConfigTableProps {
  configs: EvaluationConfig[]
  isLoading: boolean
  /** Combined search term shared with inline type filtering */
  search: string
  onEdit: (config: EvaluationConfig) => void
  onDelete: (config: EvaluationConfig) => void
  /** Called after any type create / edit / delete so parent can refetch */
  onTypeMutated: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationConfigTable({
  configs,
  isLoading,
  search,
  onEdit,
  onDelete,
  onTypeMutated,
}: EvaluationConfigTableProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (isLoading && configs.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!isLoading && configs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-muted-foreground">
        No evaluation configs found.
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {configs.map((config) => {
          const isOpen = expanded.has(config.id)
          const typeCount = config.types?.length ?? 0

          return (
            <div
              key={config.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-colors"
            >
              {/* ── Config header ─────────────────────────────────────── */}
              <div className="flex items-center gap-3 px-4 py-4">
                {/* Clickable area: expand toggle + config info */}
                <button
                  type="button"
                  onClick={() => toggleExpand(config.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? "Collapse" : "Expand"} types for ${config.name}`}
                >
                  <span className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                    {isOpen ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0">
                    <p className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                      {config.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <AppliesToBadge value={config.applies_to} />
                      <span className="text-xs text-muted-foreground">
                        Max score:{" "}
                        <span className="tabular-nums font-medium text-foreground">
                          {config.max_score}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {typeCount === 0
                          ? "No sub-types"
                          : `${typeCount} sub-type${typeCount !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(config)}
                        aria-label={`Edit ${config.name}`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit config</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(config)}
                        aria-label={`Delete ${config.name}`}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete config</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* ── Expandable types section ──────────────────────────── */}
              {isOpen && (
                <EvaluationTypeInlineSection
                  config={config}
                  typeSearch={search}
                  onMutated={onTypeMutated}
                />
              )}
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
