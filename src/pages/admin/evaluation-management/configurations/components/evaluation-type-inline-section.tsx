// ─── EvaluationTypeInlineSection ─────────────────────────────────────────────
// Expandable section shown inside each config card. Renders a mini-table
// (desktop) or stacked cards (mobile) of the config's sub-types.
// Manages its own create / edit / delete dialog state so the parent card
// component stays thin.

import { useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import type {
  EvaluationConfig,
  EvaluationConfigType,
} from "../types/evaluation-config.types"
import { EvaluationTypeScoreBadge } from "./evaluation-type-score-badge"
import { EvaluationTypeFormDialog } from "./evaluation-type-form-dialog"
import { DeleteEvaluationTypeDialog } from "./delete-evaluation-type-dialog"

// ── Helpers ────────────────────────────────────────────────────────────────────

// function formatDate(dateStr?: string): string {
//   if (!dateStr) return "—"
//   try {
//     return new Date(dateStr).toLocaleDateString(undefined, {
//       month: "short",
//       day: "numeric",
//       year: "numeric",
//     })
//   } catch {
//     return dateStr
//   }
// }

// ── Props ──────────────────────────────────────────────────────────────────────

interface EvaluationTypeInlineSectionProps {
  config: EvaluationConfig
  /** Cross-config type search term — filters displayed types */
  typeSearch: string
  /** Called after any successful create / edit / delete so parent can refetch */
  onMutated: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EvaluationTypeInlineSection({
  config,
  typeSearch,
  onMutated,
}: EvaluationTypeInlineSectionProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EvaluationConfigType | null>(
    null,
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] =
    useState<EvaluationConfigType | null>(null)

  function handleOpenCreate() {
    setEditTarget(null)
    setFormOpen(true)
  }

  function handleOpenEdit(t: EvaluationConfigType) {
    setEditTarget(t)
    setFormOpen(true)
  }

  function handleOpenDelete(t: EvaluationConfigType) {
    setDeleteTarget(t)
    setDeleteOpen(true)
  }

  const allTypes = config.types ?? []
  const normalizedSearch = typeSearch.trim().toLowerCase()
  const configMatchesSearch = normalizedSearch
    ? config.name.toLowerCase().includes(normalizedSearch)
    : false
  const filteredTypes = normalizedSearch
    ? configMatchesSearch
      ? allTypes
      : allTypes.filter((t) =>
          t.type_name.toLowerCase().includes(normalizedSearch),
        )
    : allTypes

  const countLabel =
    normalizedSearch && filteredTypes.length !== allTypes.length
      ? `${filteredTypes.length} of ${allTypes.length}`
      : `${allTypes.length}`

  return (
    <div className="border-t border-white/10 bg-black/20">
      {/* ── Section header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Sub-types ({countLabel})
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs"
          onClick={handleOpenCreate}
        >
          <PlusIcon className="h-3 w-3" />
          Add Type
        </Button>
      </div>

      {/* ── Desktop: shadcn table ─────────────────────────────────────────── */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type Name</TableHead>
              <TableHead className="w-28">Score</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTypes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {normalizedSearch
                    ? "No types match the current search."
                    : "No sub-types yet — add one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              filteredTypes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.type_name}</TableCell>
                  <TableCell>
                    <EvaluationTypeScoreBadge
                      score={t.score_value}
                      maxScore={config.max_score}
                    />
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEdit(t)}
                            aria-label={`Edit ${t.type_name}`}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit type</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleOpenDelete(t)}
                            aria-label={`Delete ${t.type_name}`}
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete type</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Mobile: stacked cards ────────────────────────────────────────── */}
      <div className="sm:hidden divide-y divide-white/10">
        {filteredTypes.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {normalizedSearch
              ? "No types match the current search."
              : "No sub-types yet."}
          </p>
        ) : (
          filteredTypes.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.type_name}</p>
                
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <EvaluationTypeScoreBadge
                  score={t.score_value}
                  maxScore={config.max_score}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleOpenEdit(t)}
                  aria-label={`Edit ${t.type_name}`}
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleOpenDelete(t)}
                  aria-label={`Delete ${t.type_name}`}
                >
                  <Trash2Icon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <EvaluationTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        configId={config.id}
        maxScore={config.max_score}
        type={editTarget}
        onSuccess={onMutated}
      />

      <DeleteEvaluationTypeDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        type={deleteTarget}
        onSuccess={onMutated}
      />
    </div>
  )
}
