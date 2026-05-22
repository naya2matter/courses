// ─── EvaluationConfigMobileList ───────────────────────────────────────────────
// Responsive card list rendered on small screens in place of the Table.

import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { AppliesToBadge } from "./applies-to-badge"
import type { EvaluationConfig } from "../types/evaluation-config.types"

// ── Single config card ────────────────────────────────────────────────────────

interface ConfigCardProps {
  config: EvaluationConfig
  onEdit: (config: EvaluationConfig) => void
  onDelete: (config: EvaluationConfig) => void
}

function ConfigCard({ config, onEdit, onDelete }: ConfigCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 transition-colors hover:bg-white/10">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate">
            {config.name}
          </p>
          <AppliesToBadge value={config.applies_to} />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(config)}
            aria-label={`Edit ${config.name}`}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(config)}
            aria-label={`Delete ${config.name}`}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span>
          Max score:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {config.max_score}
          </span>
        </span>
        {config.types != null && (
          <span>
            Sub-types:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {config.types.length}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────

function MobileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
      <Skeleton className="h-3 w-44" />
    </div>
  )
}

// ── List component ────────────────────────────────────────────────────────────

interface EvaluationConfigMobileListProps {
  configs: EvaluationConfig[]
  isLoading: boolean
  onEdit: (config: EvaluationConfig) => void
  onDelete: (config: EvaluationConfig) => void
}

export function EvaluationConfigMobileList({
  configs,
  isLoading,
  onEdit,
  onDelete,
}: EvaluationConfigMobileListProps) {
  if (isLoading && configs.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!isLoading && configs.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-muted-foreground">
        No evaluation configs found.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {configs.map((config) => (
        <ConfigCard
          key={config.id}
          config={config}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
